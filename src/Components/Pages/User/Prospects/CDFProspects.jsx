import { useMemo, useState } from "react";
import {
  App as AntdApp,
  Button,
  Dropdown,
  Input,
  Space,
  Tooltip,
  Typography,
} from "antd";
import {
  InfoCircleFilled,
  ReloadOutlined,
  SearchOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import DynamicDataTable from "../../../Common/DynamicDataTable";
import AppModal from "../../../Common/AppModal";
import ProspectStatusTag from "../../../Common/ProspectStatusTag";
import ViewProspects from "./components/ViewProspects";
import ViewGoals from "./components/ViewGoals";
import { SlReload } from "react-icons/sl";
import {
  CDFProspectsData,
  loggedInUser,
  userDashboardLoading,
} from "../../../../store/authState";
import { useAtom, useAtomValue } from "jotai";
import useApi from "../../../../hooks/useApi";
import { normalizeCDFProspect } from "../../../../hooks/useUserDashboardData";
import { useNavigate } from "react-router-dom";
import { formatAustralianDate } from "../../../../hooks/helpers";

const { Title, Text } = Typography;

const tabs = [
  { key: "new", label: "New Prospects" },
  { key: "successful", label: "Successful" },
  { key: "unsuccessful", label: "Unsuccessful" },
  { key: "all", label: "All" },
];

const stackText = (lines, valueStyle = {}) => (
  <div style={{ display: "grid", gap: 4 }}>
    {lines.map((line, index) => (
      <div key={`${line}-${index}`} style={valueStyle}>
        {line}
      </div>
    ))}
  </div>
);

export default function CDFProspects() {
  const api = useApi();
  const { message } = AntdApp.useApp();
  const [prospects, setProspects] = useAtom(CDFProspectsData);
  const session = useAtomValue(loggedInUser);
  const isDashboardLoading = useAtomValue(userDashboardLoading);
  const [activeTab, setActiveTab] = useState("new");
  const [searchText, setSearchText] = useState("");
  const [selectedProspect, setSelectedProspect] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalInfoOpen, setIsModalInfoOpen] = useState(false);
  const navigate = useNavigate();

  const filteredData = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return prospects.filter((item) => {
      const normalizedStatus = item.status?.toLowerCase();
      const matchesTab =
        activeTab === "all"
          ? true
          : activeTab === "new"
            ? normalizedStatus === "pending"
            : normalizedStatus === activeTab;

      if (!matchesTab) return false;

      if (!normalizedSearch) return true;

      const haystack = [
        item.household,
        ...item.clients.map((client) => client.name),
        ...item.contacts,
        ...item.emails,
        ...item.addresses,
        item.status,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [prospects, activeTab, searchText]);

  const statusChange = async (status, row) => {
    try {
      const payload = {
        ...(row.raw || {}),
        status,
      };

      const response = await api.patch("/api/CDF/Update", payload);

      setProspects((prev) =>
        prev.map((item) =>
          item.key === row.key
            ? {
                ...item,
                status:
                  status.charAt(0).toUpperCase() +
                  status.slice(1).toLowerCase(),
                raw: {
                  ...(item.raw || {}),
                  ...(response || {}),
                  status,
                },
              }
            : item,
        ),
      );

      const notifications = {
        successful: {
          head: "Client marked as Successful",
          note: "You can now find this client in Adviser Simplicity's Discovery Form.",
        },
        unsuccessful: {
          head: "Client marked as Unsuccessful",
          note: "The client is now marked as unsuccessful until they submit their data again.",
        },
      };

      const { head, note } = notifications[status] || {
        head: "Client Status Updated",
        note: "The status of the client has been updated successfully.",
      };

      message.success(`${head}. ${note}`);
    } catch (error) {
      console.error("CDF status update error", error);
      message.error("Something went wrong. Please try later.");
    }
  };

  const reloadProspects = async () => {
    try {
      setSearchText("");
      setActiveTab("new");

      const response = await api.get("/api/CDF/");
      const normalizedCDFData = Array.isArray(response)
        ? response.map(normalizeCDFProspect)
        : [];

      setProspects(normalizedCDFData);
      message.success("Prospects refreshed successfully.");
    } catch (error) {
      console.error("CDF prospects refresh error", error);
      message.error("Failed to refresh prospects. Please try later.");
    }
  };

  const handleProspectAction = (actionKey, record) => {
    if (actionKey === "view") {
      setSelectedProspect(record);
      setIsModalOpen(true);
      setIsModalInfoOpen({
        modalkey: "ViewProspects",
        modalTitle: "CDF View Details",
        width: 680,
        footer: (
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            {record.status?.toLowerCase() === "successful" && (
              <Button
                style={{ background: "rgb(75, 85, 99)", color: "#fff" }}
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedProspect(null);
                  setIsModalInfoOpen(null);
                  navigate(
                    `/user/discovery/personal-details/?prospectId=${record.key}`,
                    {
                      replace: true,
                    },
                  );
                }}
                type="seondary"
              >
                Open Discovery
              </Button>
            )}
            <Button
              onClick={() => {
                setIsModalOpen(false);
                setSelectedProspect(null);
              }}
              type="primary"
            >
              Close
            </Button>
          </div>
        ),
      });
      return;
    }

    if (record.status?.toLowerCase() !== "pending") {
      return;
    }

    void statusChange(actionKey, record);
  };

  const columns = [
    {
      title: <div style={{ textAlign: "center", width: "100%" }}>#</div>,
      dataIndex: "number",
      key: "number",
      width: 50,
      onCell: (record) => ({
        style: {
          textAlign: "center",
          fontSize: 12,
          fontWeight: 700,
          color: "#9ca3af",
        },
      }),
      render: (_, __, index) => index + 1,
    },
    {
      title: "HouseHold",
      dataIndex: "household",
      key: "household",
      render: (value, record) => (
        <Space size={8}>
          <span style={{ fontWeight: 700, fontSize: 12 }}>{value}</span>
          <InfoCircleFilled
            role="button"
            style={{ color: "#374151", fontSize: 14 }}
            onClick={() => {
              setIsModalInfoOpen({
                modalkey: "ViewGoals",
                modalTitle: "CDF View Goals",
                width: 760,
                footer: (
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <Button
                      onClick={() => {
                        setIsModalOpen(false);
                        setSelectedProspect(null);
                      }}
                      type="primary"
                    >
                      Close
                    </Button>
                  </div>
                ),
              });
              setSelectedProspect(record);
              setIsModalOpen(true);
            }}
          />
        </Space>
      ),
      // Add basic alphabetical sorting on Household name
      sorter: (a, b) => {
        const nameA = String(a.household || "").toLowerCase();
        const nameB = String(b.household || "").toLowerCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
      },
    },
    {
      title: "Clients",
      dataIndex: "clients",
      key: "clients",
      render: (clients) => {
        return (
          <div>
            {clients.map((client) => (
              <div key={client.name} style={{ fontSize: 12, fontWeight: 700 }}>
                {client.name}{" "}
                <span
                  style={{
                    fontSize: 11,
                    color: "rgb(156, 163, 175)",
                    fontWeight: 400,
                  }}
                >
                  ({client.role})
                </span>
              </div>
            ))}
          </div>
        );
      },
      // Add basic alphabetical sorting on client name
      sorter: (a, b) => {
        const nameA = (
          a.clients && a.clients[0]?.name ? a.clients[0].name : ""
        ).toLowerCase();
        const nameB = (
          b.clients && b.clients[0]?.name ? b.clients[0].name : ""
        ).toLowerCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
      },
    },
    {
      title: "Age",
      dataIndex: "ages",
      key: "ages",
      render: (ages) => {
        return (
          <div
            style={{
              fontSize: 12,
              color: "#4b5563",
              fontWeight: 400,
              fontFamily: "Arial, serif",
            }}
          >
            {stackText(ages)}
          </div>
        );
      },
      onCell: (record) => ({
        style: { fontSize: 11 },
      }),
    },
    {
      title: "Contact",
      dataIndex: "contacts",
      key: "contacts",
      width: 90,
      render: (contacts) => {
        return (
          <div
            style={{
              fontSize: 12,
              color: "#4b5563",
              fontWeight: 400,
              fontFamily: "Arial, serif",
            }}
          >
            {stackText(contacts)}
          </div>
        );
      },
      onCell: (record) => ({
        style: { fontSize: 11 },
      }),
    },
    {
      title: "Email",
      dataIndex: "emails",
      key: "emails",

      render: (emails) => {
        return (
          <div
            style={{
              fontSize: 11,
              color: "#4b5563",
              fontWeight: 400,
              fontFamily: "Arial, serif",
            }}
          >
            {stackText(emails, {
              lineBreak: "anywhere",
              color: "#4b5563",
            })}
          </div>
        );
      },
      onCell: (record) => ({
        style: { fontSize: 11 },
      }),
    },
    {
      title: "Address",
      dataIndex: "addresses",
      key: "addresses",
      render: (addresses) => {
        return (
          <div
            style={{
              fontSize: 11,
              color: "#4b5563",
              fontWeight: 400,
              fontFamily: "Arial, serif",
            }}
          >
            {stackText(addresses, {
              lineBreak: "anywhere",
              color: "#4b5563",
            })}
          </div>
        );
      },
      // width: 250,
      onCell: (record) => ({
        style: { fontSize: 11 },
      }),
    },
    {
      title: "Last updated at",
      dataIndex: "lastUpdated",
      key: "lastUpdated",
      render: (lastUpdated) => {
        return (
          <div
            className="text-center"
            style={{
              fontSize: 11,
              color: "#4b5563",
              fontWeight: 400,
              fontFamily: "Arial, serif",
            }}
          >
            {lastUpdated}
          </div>
        );
      },
      onCell: (record) => ({
        style: { fontSize: 11 },
      }),
      // Add basic date sorting for "Last updated at"
      sorter: (a, b) => {
        const dateA = a?.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
        const dateB = b?.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
        return dateA - dateB;
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => <ProspectStatusTag status={status} />,
      onCell: (record) => ({
        style: { fontSize: 11 },
      }),
    },
    {
      title: "Operation",
      key: "operation",
      onCell: (record) => ({
        style: { fontSize: 11 },
      }),
      render: (_, record) => (
        <Dropdown
          trigger={["click"]}
          menu={{
            items: [
              { key: "view", label: "📄 View" },
              {
                key: "successful",
                label: "✅ Successful",
                disabled: record.status?.toLowerCase() !== "pending",
              },
              {
                key: "unsuccessful",
                label: "❌ Unsuccessful",
                disabled: record.status?.toLowerCase() !== "pending",
              },
            ],
            onClick: ({ key }) => handleProspectAction(key, record),
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
      ),
    },
  ];

  return (
    <div>
      <AppModal
        width={isModalInfoOpen.width}
        titleWeight={700}
        titleSize={18}
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProspect(null);
        }}
        title={isModalInfoOpen.modalTitle}
        footer={isModalInfoOpen.footer}
      >
        {isModalInfoOpen.modalkey === "ViewProspects" && (
          <ViewProspects record={selectedProspect} />
        )}
        {isModalInfoOpen.modalkey === "ViewGoals" && (
          <ViewGoals record={selectedProspect} />
        )}
      </AppModal>

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
            Admin / CDF Prospects
          </Text>
          <Title
            style={{
              margin: "12px 0 0 0",
              fontFamily: "Georgia,serif",
              fontWeight: 500,
              fontSize: 28,
            }}
            onClick={() => {
              console.log(filteredData, "filteredData");
              console.log(prospects, "prospects");
            }}
          >
            CDF Prospects
          </Title>
        </div>
        <div className="">
          <Button
            type="primary"
            style={{
              borderRadius: 8,
              fontWeight: 700,
              padding: "17px 20px",
              fontSize: 13,
              boxShadow: "0 8px 20px rgba(34,197,94,0.18)",
            }}
            onClick={() =>
              window.open(
                "https://cdf.denarowealth.com.au/?referralId=" +
                  session.user.referralID,
                "_blank",
              )
            }
          >
            + New Prospect
          </Button>
        </div>
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          border: "1px solid #ebedf0",
          boxShadow: "0 10px 35px rgba(15,23,42,0.05)",
          marginTop: "35px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            padding: "12px 20px 2px",
            flexWrap: "wrap",
            marginBottom: 4,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 28,
              flexWrap: "wrap",
            }}
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    background: "transparent",
                    border: "none",
                    padding: "0 10px 10px",
                    cursor: "pointer",
                    color: isActive ? "#22c55e" : "#6b7280",
                    fontWeight: isActive ? 700 : 400,
                    borderBottom: isActive
                      ? "3px solid #22c55e"
                      : "3px solid transparent",
                    fontSize: 13,
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <Space size={10}>
            <Input
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search..."
              // prefix={<SearchOutlined style={{ color: "#9ca3af" }} />}
              prefix={"🔍"}
              style={{ width: 210, borderRadius: 7 }}
            />
            <Button
              icon={<SlReload />}
              onClick={() => void reloadProspects()}
            />
          </Space>
        </div>

        <DynamicDataTable
          columns={columns}
          data={filteredData}
          total={filteredData.length}
          pageSize={12}
          showCount={false}
          bordered={true}
          size="small"
          tableStyle={{ borderRadius: 0, overflow: "hidden" }}
          tableProps={{
            loading: {
              spinning: isDashboardLoading,
              tip: "Loading prospects...",
            },
          }}
        />
      </div>
    </div>
  );
}
