import { useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Avatar, Button, Dropdown, message, Spin, Tooltip } from "antd";
import DynamicDataTable from "../../../Common/DynamicDataTable";
import { normalizeMyClientsList } from "../../../../hooks/helpers";
import {
  discoveryDataAtom,
  discoverySectionQuestionsAtom,
  loggedInUser,
  MyClientsData,
  SelectedClient,
  userDashboardLoading,
} from "../../../../store/authState";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  FileTextOutlined,
  LoadingOutlined,
  MailOutlined,
  SettingOutlined,
  SwapOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import useApi from "../../../../hooks/useApi";
import { useNavigate } from "react-router-dom";

const PRIMARY_GREEN = "#22c55e";

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/);
  if (!parts.length) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  // Invalid date
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-AU");
};

const getClientName = (client = {}) =>
  client.clientPreferredName ||
  client.clientGivenName ||
  client.firstName ||
  client.name ||
  "";

const getPartnerName = (partner = {}) =>
  partner.partnerPreferredName ||
  partner.partnerGivenName ||
  partner.firstName ||
  partner.name ||
  "";

const getClientLastName = (client = {}) =>
  client.clientLastName || client.lastName || "";

const getClientEmail = (client = {}) => client.Email || client.email || "";

const getPartnerEmail = (partner = {}) =>
  partner.partnerEmail || partner.email || "";

const getClientPhone = (client = {}) =>
  client.clientWorkPhone || client.clientPhone || client.phone || "";

const getPartnerPhone = (partner = {}) =>
  partner.partnerWorkPhone || partner.partnerPhone || partner.phone || "";

const getClientAddress = (client = {}) =>
  client.clientHomeAddress || client.clientAddress || client.address || "";

const getPartnerAddress = (partner = {}) =>
  partner.partnerHomeAddress || partner.partnerAddress || partner.address || "";

const MEMBER_NAME_STYLE = {
  fontFamily: "Arial",
  fontSize: 12,
  color: "rgb(55, 65, 81)",
  fontWeight: 600,
};

const buildMembersNode = (client = {}, partner = {}) => {
  const clientName = getClientName(client) || "—";
  const partnerName = getPartnerName(partner);

  return (
    <div style={{ display: "grid", gap: 4 }}>
      <div>
        <span style={MEMBER_NAME_STYLE}>{clientName}</span>
        <span>
          {` - Primary${client.clientAge ? `, ${client.clientAge}` : ""}`}
        </span>
      </div>

      {partnerName ? (
        <div>
          <span style={MEMBER_NAME_STYLE}>{partnerName}</span>
          <span>
            {` - Partner${partner.partnerAge ? `, ${partner.partnerAge}` : ""}`}
          </span>
        </div>
      ) : null}
    </div>
  );
};

/** Lowercase single string used for substring search across household, names, #, phones, emails. */
function buildRowSearchHaystack(row) {
  const client = row?.client || {};
  const partner = row?.partner || {};
  const parts = [
    row.household,
    getClientLastName(client),
    client.clientTitle,
    client.clientGivenName,
    client.clientMiddleName,
    client.clientLastName,
    client.clientPreferredName,
    getClientName(client),
    String(client.clientAge ?? ""),
    partner.partnerTitle,
    partner.partnerGivenName,
    partner.partnerMiddleName,
    partner.partnerLastName,
    partner.partnerPreferredName,
    getPartnerName(partner),
    String(partner.partnerAge ?? ""),
    String(row.no ?? ""),
    getClientPhone(client),
    getPartnerPhone(partner),
    getClientEmail(client),
    getPartnerEmail(partner),
    row.assignID?.email,
    row._id ? String(row._id) : "",
  ];
  return parts
    .filter((p) => p !== undefined && p !== null && p !== "")
    .join(" ")
    .toLowerCase();
}

function rowMatchesSearch(row, queryRaw) {
  const q = String(queryRaw ?? "")
    .trim()
    .toLowerCase();
  if (!q) return true;
  const hay = buildRowSearchHaystack(row);
  if (hay.includes(q)) return true;
  const digitsQuery = q.replace(/\D/g, "");
  if (digitsQuery.length >= 2) {
    const phones =
      `${getClientPhone(row.client)} ${getPartnerPhone(row.partner)}`.replace(
        /\D/g,
        "",
      );
    if (phones.includes(digitsQuery)) return true;
  }
  return false;
}

const HouseholdTable = ({ onAction, searchText = "" }) => {
  const session = useAtomValue(loggedInUser);
  const navigate = useNavigate();

  const setDiscoveryData = useSetAtom(discoveryDataAtom);
  const setDiscoverySectionQuestions = useSetAtom(
    discoverySectionQuestionsAtom,
  );

  const { get } = useApi();

  const [selectedClient, setSelectedClient] = useAtom(SelectedClient);
  const [openDropdownRowId, setOpenDropdownRowId] = useState(null);
  const [selectLoadingRowId, setSelectLoadingRowId] = useState(null);
  /** Sync guard so onOpenChange cannot close the menu before Select loading state is applied. */
  const selectLoadingRowIdRef = useRef(null);

  const permissions =
    session?.user?.roleID?.permissions ?? session?.permissions ?? [];

  const finishSelectClientFlow = (rowId) => {
    selectLoadingRowIdRef.current = null;
    setSelectLoadingRowId(null);
    setOpenDropdownRowId(null);
  };

  const getClientDetails = async (row, action) => {
    const rowId = row?._id ?? row?.key;
    console.log("row", row);
    let yesNoQuestionsRes = [];
    let fullDetailsRes = {};
    try {
      const [yesNoQuestionsResult, fullDetailsResult] = await Promise.allSettled([
        get(`/api/questions/${row?._id}`),
        get(`/api/dataOfAllSection/${row?._id}`),
      ]);

      if (yesNoQuestionsResult.status === "fulfilled") {
        yesNoQuestionsRes = yesNoQuestionsResult.value;
      } else {
        // Assign default values for failed API call
        yesNoQuestionsRes = {};
      }

      if (fullDetailsResult.status === "fulfilled") {
        fullDetailsRes = fullDetailsResult.value;
      } else {
        // Assign default values for failed API call
        fullDetailsRes = {};
      }

      setDiscoverySectionQuestions(yesNoQuestionsRes);
      setDiscoveryData(fullDetailsRes);
      setSelectedClient(row);

      const displayName = getClientLastName(row?.client || {}) || "Client";
      message.success(`"${displayName.toUpperCase()}" is active now`);
      if (action === "View") {
        navigate(`/user/discovery/personal-details`);
      }
    } catch (error) {
      // If an unexpected error occurs, assign default values
      setDiscoverySectionQuestions([]);
      setDiscoveryData({});
      setSelectedClient(row);
      // Do not show error to the client, but log for debugging
      console.error("Error getting client details", error);
    } finally {
      finishSelectClientFlow(rowId);
    }
  };

  const menuGenerator = (row, selectedClient) => {
    const rowId = row?._id ?? row?.key;
    const selectedId = selectedClient?._id ?? selectedClient?.key;
    const isRowSelected =
      Boolean(selectedId) && Boolean(rowId) && selectedId === rowId;
    const isSelectLoading = Boolean(rowId) && selectLoadingRowId === rowId;

    const items = [
      {
        key: "view",
        label: "View",
        icon: isSelectLoading ? (
          <Spin
            size="small"
            indicator={<LoadingOutlined spin />}
            styles={{
              indicator: {
                color: "lightgray",
              },
            }}
          />
        ) : (
          <FileTextOutlined />
        ),
      },
      { type: "divider" },
      {
        key: "downloadReport",
        label: "Download Report",
        icon: <DownloadOutlined />,
      },
      { type: "divider" },
      {
        key: "pushToAdviser",
        label: "Push to Adviser-link",
        icon: <UploadOutlined />,
      },
      { type: "divider" },
      { key: "assign", label: "Assign", icon: <SwapOutlined /> },
      { type: "divider" },
      {
        // Must differ by key so AntD `onClick({ key })` can distinguish Select vs Deselect
        key: isRowSelected ? "deselect" : "select",
        label: isRowSelected ? "Deselect" : "Select",
        icon: isSelectLoading ? (
          <Spin
            size="small"
            indicator={<LoadingOutlined spin />}
            styles={{
              indicator: {
                color: "lightgray",
              },
            }}
          />
        ) : isRowSelected ? (
          <CloseOutlined />
        ) : (
          <CheckOutlined />
        ),
        disabled: !isRowSelected && isSelectLoading,
      },
      { type: "divider" },
      {
        key: "delete",
        label: "Delete",
        icon: <DeleteOutlined />,
        danger: true,
      },
    ];

    // Adviser: show Unassign instead of Assign when assigned to someone else
    if (
      permissions.includes("adviser") &&
      row?.assignID?.email &&
      session?.email &&
      row.assignID.email !== session.email
    ) {
      const assignIndex = items.findIndex((item) => item?.key === "assign");
      if (assignIndex !== -1) {
        items[assignIndex] = {
          ...items[assignIndex],
          key: "unAssign",
          label: "Unassign",
        };
      }
    }

    // Prospects + Fact Find: insert risk profile send/view after assign/unassign
    if (
      permissions.includes("prospects") &&
      permissions.includes("fact find")
    ) {
      const anchorIndex = items.findIndex(
        (item) => item?.key === "assign" || item?.key === "unAssign",
      );
      if (anchorIndex !== -1) {
        items.splice(anchorIndex + 1, 0, { type: "divider" });
        items.splice(anchorIndex + 2, 0, {
          key: row?.isRiskProfileCompleted
            ? "viewRiskProfile"
            : "sendRiskProfile",
          label: row?.isRiskProfileCompleted
            ? "View Risk Profile"
            : "Send Risk Profile",
          icon: row?.isRiskProfileCompleted ? (
            <FileTextOutlined />
          ) : (
            <MailOutlined />
          ),
        });
      }
    }

    const keyToAction = {
      view: "View",
      discovery: "Edit",
      downloadReport: "Download-Report",
      pushToAdviser: "Push-to-Adviser-link",
      assign: "Assign",
      unAssign: "Unassign",
      select: "Select",
      deselect: "Deselect",
      delete: "Delete",
      sendRiskProfile: "sendRiskProfile",
      viewRiskProfile: "viewRiskProfile",
    };

    return {
      items,
      onClick: ({ key }) => {
        const action = keyToAction[key] || key;
        if (action === "Select" || action === "View") {
          // flushSync(() => {
          //   selectLoadingRowIdRef.current = rowId;
          //   setSelectLoadingRowId(rowId);
          //   setOpenDropdownRowId(rowId);
          // });
          void getClientDetails(row, action);
        } else if (action === "Deselect") {
          setDiscoverySectionQuestions({});
          setDiscoveryData({});
          setSelectedClient(null);
        }
        onAction?.(action, row);
      },
    };
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
      title: "Household",
      dataIndex: "client",
      key: "household",
      render: (_, record) =>
        (() => {
          const client = record?.client || {};
          const household = (
            getClientLastName(client) || "Unknown"
          ).toUpperCase();
          const rowId = record?._id ?? record?.key;
          const selectedId = selectedClient?._id ?? selectedClient?.key;
          const isRowSelected =
            Boolean(selectedId) && Boolean(rowId) && selectedId === rowId;

          return (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div style={{ width: 36, height: 36 }}>
                <Avatar
                  size={36}
                  style={{
                    background:
                      "linear-gradient(135deg, #22c55e, rgb(22, 163, 74))",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: 14,
                  }}
                >
                  {getInitials(household)}
                </Avatar>
              </div>

              <div style={{ lineHeight: 1.2 }}>
                <div
                  style={{
                    fontWeight: 700,
                    textTransform: "uppercase",
                    fontSize: 13,
                    fontFamily: "Arial,serif",
                  }}
                >
                  {household}
                </div>

                {isRowSelected && (
                  <div
                    style={{
                      fontSize: 10,
                      fontFamily: "Arial",
                      fontWeight: 700,
                      color: "#22c55e",
                      letterSpacing: 0.5,
                    }}
                  >
                    ACTIVE
                  </div>
                )}
              </div>
            </div>
          );
        })(),
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
      title: "Members",
      dataIndex: "client",
      key: "members",
      onCell: (record) => ({
        style: { fontSize: 11, color: "#4b5563" },
      }),
      render: (_, record) => {
        const client = record?.client || {};
        const partner = record?.partner || {};
        return (
          <div style={{ color: "#4b5563", fontSize: 11 }}>
            {buildMembersNode(client, partner)}
          </div>
        );
      },
    },
    {
      title: "Contact",
      dataIndex: "client",
      key: "contact",
      onCell: (record) => ({
        style: { fontSize: 11, color: "#4b5563" },
      }),
      render: (_, record) => {
        const client = record?.client || {};
        const partner = record?.partner || {};
        const lines = [getClientPhone(client), getPartnerPhone(partner)].filter(
          Boolean,
        );
        return (
          <div style={{ whiteSpace: "pre-line" }}>
            {lines.join("\n") || "—"}
          </div>
        );
      },
    },
    {
      title: "Email",
      dataIndex: "client",
      key: "email",
      onCell: (record) => ({
        style: { fontSize: 11, color: "#4b5563" },
      }),
      render: (_, record) => {
        const client = record?.client || {};
        const partner = record?.partner || {};
        const lines = [getClientEmail(client), getPartnerEmail(partner)].filter(
          Boolean,
        );
        return (
          <div style={{ whiteSpace: "pre-line" }}>
            {lines.join("\n") || "—"}
          </div>
        );
      },
    },
    {
      title: "Address",
      dataIndex: "client",
      key: "address",
      onCell: (record) => ({
        style: { fontSize: 11, color: "#4b5563" },
      }),
      render: (_, record) => {
        const client = record?.client || {};
        const partner = record?.partner || {};
        const address = getClientAddress(client) || getPartnerAddress(partner);
        return address || "—";
      },
    },
    {
      title: "Last Updated",
      dataIndex: "lastUpdated",
      key: "lastUpdated",
      onCell: (record) => ({
        style: { fontSize: 11, color: "#4b5563" },
      }),
      render: (_, record) => formatDate(record?.updatedAt),
      sorter: (a, b) => {
        const dateA = a?.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b?.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateA - dateB;
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, row) => {
        const rowId = row?._id ?? row?.key;
        return (
          <Dropdown
            trigger={["click"]}
            open={openDropdownRowId === rowId}
            onOpenChange={(visible) => {
              if (!visible) {
                if (selectLoadingRowIdRef.current === rowId) {
                  return;
                }
                setOpenDropdownRowId(null);
              } else {
                setOpenDropdownRowId(rowId);
              }
            }}
            menu={menuGenerator(row, selectedClient)}
            styles={{
              item: {
                fontWeight: 700,
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
        );
      },
    },
  ];

  const myClientsData = useAtomValue(MyClientsData);
  const isDashboardLoading = useAtomValue(userDashboardLoading);

  const clients = normalizeMyClientsList(myClientsData);

  const tableData = useMemo(
    () =>
      clients.map((item, index) => ({
        ...item,
        key: item?._id || String(index + 1),
        no: index + 1,
        household: getClientLastName(item?.client || {}) || "Unknown",
      })),
    [clients],
  );

  const filteredTableData = useMemo(() => {
    const q = String(searchText ?? "").trim();
    if (!q) return tableData;
    return tableData.filter((row) => rowMatchesSearch(row, q));
  }, [tableData, searchText]);

  const titleText =
    searchText.trim() && filteredTableData.length !== tableData.length
      ? `Showing ${filteredTableData.length} of ${tableData.length} households`
      : `Showing ${filteredTableData.length} households`;

  return (
    <DynamicDataTable
      columns={columns}
      data={filteredTableData}
      title={titleText}
      total={filteredTableData.length}
      pageSize={10}
      className="household-table"
      bordered
      size="small"
      tableStyle={{ borderRadius: 12 }}
      tableProps={{
        childrenColumnName: "__antdNestedRows__",
        loading: {
          spinning: isDashboardLoading,
          tip: "Loading households...",
        },
      }}
    />
  );
};

export default HouseholdTable;
