import { useMemo, useState } from "react";
import {
  App as AntdApp,
  Button,
  Dropdown,
  Modal,
  Select,
  Space,
  Tooltip,
  Typography,
} from "antd";
import { useAtom } from "jotai";
import DynamicDataTable from "../../../Common/DynamicDataTable";
import AccountStatusTag from "../../../Common/AccountStatusTag";
import { MyTeamData } from "../../../../store/authState";
import useApi from "../../../../hooks/useApi";
import AddEmployee from "./components/AddEmployee";

const { Title, Text } = Typography;

/** Menu has no built-in “success” flag (unlike `danger`). Use brand green for Edit. */
const MENU_SUCCESS_GREEN = "#22c55e";

export default function MyTeam() {
  const api = useApi();
  const { message } = AntdApp.useApp();
  const { confirm } = Modal;
  const [team, setTeam] = useAtom(MyTeamData);
  const [filterEmail, setFilterEmail] = useState(null);
  const [busy, setBusy] = useState(false);
  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  const tableRows = useMemo(() => {
    const list = Array.isArray(team) ? team : [];
    const rows = filterEmail
      ? list.filter((m) => m?.email === filterEmail)
      : list;
    return rows.map((row, index) => ({
      ...row,
      key: row?._id || String(index),
    }));
  }, [team, filterEmail]);

  const selectOptions = useMemo(() => {
    const list = Array.isArray(team) ? team : [];
    return list.map((item) => ({
      value: item.email,
      label:
        `${item.firstName || ""} ${item.lastName || ""}`.trim() || item.email,
    }));
  }, [team]);

  const runUpdateStatus = async (id) => {
    setBusy(true);
    try {
      await api.patch("/api/user/UpdateStatus", { _id: id });
      setTeam((prev) =>
        (prev || []).map((item) =>
          item._id === id ? { ...item, isActive: !item.isActive } : item,
        ),
      );
      message.success("Status updated.");
    } catch (err) {
      message.error(
        err?.response?.data?.message || err?.message || "Update failed.",
      );
    } finally {
      setBusy(false);
    }
  };

  const runSoftDelete = async (id, email) => {
    setBusy(true);
    try {
      await api.patch("/api/user/softDelete", { _id: id });
      setTeam((prev) => (prev || []).filter((item) => item._id !== id));
      message.success("Team member removed.");
      setFilterEmail((current) =>
        current && email === current ? null : current,
      );
    } catch (err) {
      message.error(
        err?.response?.data?.message || err?.message || "Delete failed.",
      );
    } finally {
      setBusy(false);
    }
  };

  const handleMenuAction = (key, row) => {
    switch (key) {
      case "view":
        Modal.info({
          title: "Team member",
          content: (
            <div style={{ marginTop: 12 }}>
              <p>
                <strong>Name:</strong> {row.firstName} {row.lastName}
              </p>
              <p>
                <strong>Email:</strong> {row.email}
              </p>
              <p>
                <strong>Status:</strong> {row.isActive ? "Active" : "Disabled"}
              </p>
              <p>
                <strong>Created:</strong>{" "}
                {row.createdAt
                  ? new Date(row.createdAt).toLocaleDateString("en-AU")
                  : "—"}
              </p>
            </div>
          ),
        });
        break;
      case "edit":
        setEditingEmployee(row);
        setEmployeeModalOpen(true);
        break;
      case "enable":
      case "disable":
        confirm({
          title:
            key === "enable"
              ? "Enable this team member?"
              : "Disable this team member?",
          okText: key === "enable" ? "Enable" : "Disable",
          okType: key === "enable" ? "primary" : "danger",
          cancelText: "Cancel",
          onOk: () => runUpdateStatus(row._id),
        });
        break;
      case "delete":
        confirm({
          title: "Delete this team member?",
          content: "This action cannot be undone.",
          okText: "Delete",
          okType: "danger",
          cancelText: "Cancel",
          onOk: () => runSoftDelete(row._id, row.email),
        });
        break;
      default:
        break;
    }
  };

  const menuForRow = (row) => {
    const items = [
      {
        key: "view",
        label: <span style={{ marginLeft: "10px" }}>View</span>,
        // icon: <FileTextOutlined style={{ color: MENU_SUCCESS_GREEN }} />,
        icon: "📄",
      },
      { type: "divider" },
      {
        key: "edit",
        label: <span style={{ marginLeft: "10px" }}>Edit</span>,
        // icon: <EditOutlined style={{ color: MENU_SUCCESS_GREEN }} />,
        icon: "✏️",
      },
      { type: "divider" },
    ];
    if (row.isActive) {
      items.push({
        key: "disable",
        label: <span style={{ marginLeft: "10px" }}>Disable</span>,
        // icon: <StopOutlined style={{ color: MENU_SUCCESS_GREEN }} />,
        icon: "❌ ",
      });
    } else {
      items.push({
        key: "enable",
        label: <span style={{ marginLeft: "10px" }}> Enable</span>,
        // icon: <CheckOutlined style={{ color: MENU_SUCCESS_GREEN }} />,
        icon: "✅",
      });
    }
    items.push({ type: "divider" });
    items.push({
      key: "delete",
      label: " Delete",
      // icon: <DeleteOutlined />,
      icon: <div style={{ marginRight: "10px" }}>🗑️ </div>,
      danger: true,
    });

    return {
      items,
      onClick: ({ key }) => handleMenuAction(key, row),
    };
  };

  const columns = [
    {
      title: <div style={{ textAlign: "center", width: "100%" }}>#</div>,
      key: "index",
      width: 56,
      onCell: () => ({
        style: {
          textAlign: "center",
          fontSize: 12,
          color: "#9ca3af",
          fontWeight: 700,
        },
      }),
      render: (_, __, index) => index + 1,
    },
    {
      title: "Name",
      key: "name",
      render: (_, row) => (
        <span>
          {row.firstName} {row.lastName}
        </span>
      ),
    },
    {
      title: "Email",
      key: "email",
      ellipsis: true,
      render: (_, row) => row.email,
    },
    {
      title: "Account Status",
      key: "isActive",
      width: 120,
      render: (_, row) => <AccountStatusTag isActive={row.isActive} />,
    },
    {
      title: "Created at",
      key: "createdAt",
      width: 120,
      render: (_, row) => {
        if (!row.createdAt) return "—";
        return new Date(row.createdAt).toLocaleDateString("en-AU", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        });
      },
    },
    {
      title: "Operations",
      key: "operations",
      width: 90,
      fixed: "right",
      render: (_, row) => (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Dropdown
            trigger={["click"]}
            menu={menuForRow(row)}
            disabled={busy}
            styles={{
              root: {
                width: 150,
              },
            }}
          >
            <Tooltip title="Settings">
              <Button
                type="text"
                shape="circle"
                icon={
                  // <SettingOutlined style={{ color: "#374151", fontSize: 18 }} />
                  "⚙️"
                }
                style={{ fontSize: 18 }}
              />
            </Tooltip>
          </Dropdown>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          marginBottom: 18,
          marginTop: 18,
          flexWrap: "wrap",
        }}
      >
        <div>
          <Text
            style={{
              display: "block",
              fontSize: 11,
              letterSpacing: 3,
              color: "#22c55e",
              textTransform: "uppercase",
              marginBottom: 6,
              fontWeight: 400,
            }}
          >
            Admin
          </Text>
          <Title
            style={{
              margin: 0,
              fontFamily: "Georgia,serif",
              fontWeight: 500,
              fontSize: 28,
            }}
          >
            My Team
          </Title>
        </div>
        <Space wrap size={10}>
          <Select
            allowClear
            showSearch
            placeholder="Filter by team member"
            style={{ minWidth: 240 }}
            options={selectOptions}
            value={filterEmail}
            onChange={setFilterEmail}
            optionFilterProp="label"
          />
          <Button
            type="primary"
            style={{
              borderRadius: 8,
              fontWeight: 700,
              padding: "17px 20px",
              fontSize: 13,
            }}
            onClick={() => {
              setEditingEmployee(null);
              setEmployeeModalOpen(true);
            }}
          >
            Add Advisers
          </Button>
        </Space>
      </div>

      <AddEmployee
        open={employeeModalOpen}
        editingEmployee={editingEmployee}
        onClose={() => {
          setEmployeeModalOpen(false);
          setEditingEmployee(null);
        }}
        onSuccess={(record, meta) => {
          if (!record) return;
          if (meta?.isEdit) {
            setTeam((prev) =>
              (prev || []).map((item) =>
                item._id === record._id ? { ...item, ...record } : item,
              ),
            );
          } else {
            setTeam((prev) => [record, ...(prev || [])]);
          }
        }}
      />

      <DynamicDataTable
        columns={columns}
        data={tableRows}
        pageSize={10}
        total={tableRows.length}
        bordered
        size="small"
        tableStyle={{ borderRadius: 12 }}
        tableProps={{
          scroll: { x: 900 },
        }}
      />
    </div>
  );
}
