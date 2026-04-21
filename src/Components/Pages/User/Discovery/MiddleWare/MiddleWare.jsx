import { Button, Col, Form, Row, Space, message } from "antd";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { RiEdit2Fill } from "react-icons/ri";
import EditableDynamicTable from "../../../../Common/EditableDynamicTable";
import { renderModalContent } from "../../../../Common/renderModalContent";
import useTitleBlock from "../../../../../hooks/useTitleBlock";
import AppModal from "../../../../Common/AppModal";
import {
  discoveryDataAtom,
  discoverySectionQuestionsAtom,
} from "../../../../../store/authState";
import { toCommaAndDollar } from "../../../../../hooks/helpers";
import useApi from "../../../../../hooks/useApi";

const TABLE_PROPS = {
  showCount: false,
  noPagination: true,
  horizontalScroll: true,
  tableStyle: { borderRadius: 12, overflow: "hidden" },
  headerFontSize: 11,
  bodyFontSize: 12,
};

const HEADING_STYLE = { fontFamily: "Georgia,serif" };

const customConfig = {
  SMSF: {
    noJoint: true,
    noPartner: true,
    customKeys: true,
    Name: "SMSF",
    TotalKey: "SMSFTotal",
    innerkey: "SMSF",
  },
  Trust: {
    noJoint: true,
    noPartner: true,
    customKeys: true,
    Name: "Trust",
    TotalKey: "trustTotal",
    innerkey: "trust",
  },
};

const MIDDLEWARE_CONFIG = {
  bankAccountFinance: {
    addEndpoint: "/api/bankAccountFinance/Add",
    updateEndpoint: "/api/bankAccountFinance/Update",
    countLabel: "Number of Bank Accounts",
    width: 680,
  },
  termDepositsFinance: {
    addEndpoint: "/api/termDepositsFinance/Add",
    updateEndpoint: "/api/termDepositsFinance/Update",
    countLabel: "Number of Term Deposits",
    width: 680,
  },
  australianShareMarket: {
    addEndpoint: "/api/australianShareMarket/Add",
    updateEndpoint: "/api/australianShareMarket/Update",
    countLabel: "Number of Australian Shares/ETFs",
    width: 800,
  },
  managedFund: {
    addEndpoint: "/api/managedFund/Add",
    updateEndpoint: "/api/managedFund/Update",
    countLabel: "Number of Platform Investments",
    width: 800,
  },
  investmentBondFinance: {
    addEndpoint: "/api/investmentBondFinance/Add",
    updateEndpoint: "/api/investmentBondFinance/Update",
    countLabel: "Number of Investment Bonds",
    width: 800,
  },
  superAnnuationIssues: {
    addEndpoint: "/api/superAnnuationIssues/Add",
    updateEndpoint: "/api/superAnnuationIssues/Update",
    countLabel: "Number of Super Funds",
    width: 1000,
    noJoint: true,
  },
  accountBasedPensionIssues: {
    addEndpoint: "/api/accountBasedPensionIssues/Add",
    updateEndpoint: "/api/accountBasedPensionIssues/Update",
    countLabel: "Number of Account Based Pensions",
    width: 1000,
    noJoint: true,
  },
  annuitiesIssues: {
    addEndpoint: "/api/annuitiesIssues/Add",
    updateEndpoint: "/api/annuitiesIssues/Update",
    countLabel: "Number of Annuities",
    width: 1500,
    noJoint: true,
  },
  BusinessAsCompanyStructure: {
    addEndpoint: "/api/BusinessAsCompanyStructure/Add",
    updateEndpoint: "/api/BusinessAsCompanyStructure/Update",
    countLabel: "Number of Companies",
    width: 1400,
    noJoint: true,
  },
  BusinessAsTrusts: {
    addEndpoint: "/api/BusinessAsTrusts/Add",
    updateEndpoint: "/api/BusinessAsTrusts/Update",
    countLabel: "Number of Trusts",
    width: 1400,
    noJoint: true,
  },
  SMSFBank: {
    addEndpoint: "/api/SMSFBank/Add",
    updateEndpoint: "/api/SMSFBank/Update",
    countLabel: "Number of Bank Accounts",
    width: 680,
    ...customConfig.SMSF,
  },
  SMSFTermDeposits: {
    addEndpoint: "/api/SMSFTermDeposits/Add",
    updateEndpoint: "/api/SMSFTermDeposits/Update",
    countLabel: "Number of Term Deposits",
    width: 680,
    ...customConfig.SMSF,
  },
  SMSFAustralianShares: {
    addEndpoint: "/api/SMSFAustralianShares/Add",
    updateEndpoint: "/api/SMSFAustralianShares/Update",
    countLabel: "Number of Australian Shares/ETFs",
    width: 800,
    ...customConfig.SMSF,
  },
  SMSFManagedFunds: {
    addEndpoint: "/api/SMSFManagedFunds/Add",
    updateEndpoint: "/api/SMSFManagedFunds/Update",
    countLabel: "Number of Platform Investments",
    width: 1000,
    ...customConfig.SMSF,
  },

  familyBank: {
    addEndpoint: "/api/familyBank/Add",
    updateEndpoint: "/api/familyBank/Update",
    countLabel: "Number of Bank Accounts",
    width: 680,
    ...customConfig.Trust,
  },
  familyTermDeposit: {
    addEndpoint: "/api/familyTermDeposit/Add",
    updateEndpoint: "/api/familyTermDeposit/Update",
    countLabel: "Number of Term Deposits",
    width: 680,
    ...customConfig.Trust,
  },
  familyAustralianShare: {
    addEndpoint: "/api/familyAustralianShare/Add",
    updateEndpoint: "/api/familyAustralianShare/Update",
    countLabel: "Number of Australian Shares/ETFs",
    width: 800,
    ...customConfig.Trust,
  },
  familyMangedFunds: {
    addEndpoint: "/api/familyMangedFunds/Add",
    updateEndpoint: "/api/familyMangedFunds/Update",
    countLabel: "Number of Platform Investments",
    width: 1000,
    ...customConfig.Trust,
  },
};

function parseCurrencyValue(value) {
  if (value === null || value === undefined || value === "") return 0;
  const numeric = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

function formatCurrencyValue(value) {
  const numeric = parseCurrencyValue(value);
  return numeric ? toCommaAndDollar(numeric) : "";
}

function buildOwnerLabel(type, discoveryData) {
  const clientName =
    discoveryData?.personalDetails?.client?.clientPreferredName ||
    discoveryData?.personaldetails?.client?.clientPreferredName ||
    "Client";
  const partnerName =
    discoveryData?.personalDetails?.partner?.partnerPreferredName ||
    discoveryData?.personaldetails?.partner?.partnerPreferredName ||
    "Partner";

  if (type === "client") return clientName;
  if (type === "partner") return partnerName;
  return `${clientName} & ${partnerName}`;
}

function getCustomKeys(config = {}) {
  return {
    enabled: Boolean(config?.customKeys),
    displayKey: config?.Name,
    totalKey: config?.TotalKey,
    valueKey: config?.innerkey,
  };
}

function mergeBranch(formValues, values, key) {
  return {
    ...(formValues?.[key] || {}),
    ...(values?.[key] || {}),
  };
}

function buildInitialValues(sectionData = {}, noJoint = false, config = {}) {
  const customKeys = getCustomKeys(config);
  console.log(sectionData, "sectionData");
  if (customKeys.enabled) {
    return {
      [customKeys.valueKey]: {
        currentBalanceArray: sectionData?.[customKeys.valueKey] || [],
        currentBalance: sectionData?.[customKeys.totalKey] || "",
        costBase: sectionData?.[customKeys.totalKey] || "",
      },
    };
  }

  return {
    client: {
      currentBalanceArray: sectionData?.client || [],
      currentBalance: sectionData?.clientCurrentBalance || "",
      costBase: sectionData?.clientCostBaseTemp || "",
    },
    partner: {
      currentBalanceArray: sectionData?.partner || [],
      currentBalance: sectionData?.partnerCurrentBalance || "",
      costBase: sectionData?.partnerCostBaseTemp || "",
    },
    joint: noJoint
      ? undefined
      : {
          currentBalanceArray: sectionData?.joint || [],
          currentBalance: sectionData?.jointCurrentBalance || "",
          costBase: sectionData?.jointCostBaseTemp || "",
        },
  };
}

function calculateDisplayTotal(primaryBalance, jointBalance) {
  const primary = parseCurrencyValue(primaryBalance);
  const joint = parseCurrencyValue(jointBalance);
  return formatCurrencyValue(primary + joint / 2);
}

function buildSourceValues(formValues = {}, values = {}, config = {}) {
  const customKeys = getCustomKeys(config);

  return {
    ...formValues,
    ...values,
    client: mergeBranch(formValues, values, "client"),
    partner: mergeBranch(formValues, values, "partner"),
    joint: mergeBranch(formValues, values, "joint"),
    ...(customKeys.enabled
      ? {
          [customKeys.valueKey]: mergeBranch(
            formValues,
            values,
            customKeys.valueKey,
          ),
        }
      : {}),
  };
}

function buildStandardPayload({
  sectionData,
  discoveryData,
  sourceValues,
  showPartner,
  includeJoint,
  hasCostBase,
}) {
  return {
    ...sectionData,
    clientFK:
      sectionData?.clientFK ||
      discoveryData?.personalDetails?._id ||
      discoveryData?.personaldetails?._id ||
      undefined,
    client: sourceValues?.client?.currentBalanceArray || [],
    partner: showPartner
      ? sourceValues?.partner?.currentBalanceArray || []
      : [],
    ...(includeJoint
      ? {
          joint:
            showPartner && includeJoint
              ? sourceValues?.joint?.currentBalanceArray || []
              : [],
          jointCurrentBalance:
            showPartner && includeJoint
              ? sourceValues?.joint?.currentBalance || ""
              : "",
        }
      : {}),
    clientCurrentBalance: sourceValues?.client?.currentBalance || "",
    partnerCurrentBalance: showPartner
      ? sourceValues?.partner?.currentBalance || ""
      : "",
    clientTotal:
      showPartner && includeJoint
        ? calculateDisplayTotal(
            sourceValues?.client?.currentBalance,
            sourceValues?.joint?.currentBalance,
          )
        : sourceValues?.client?.currentBalance || "",
    partnerTotal:
      showPartner && includeJoint
        ? calculateDisplayTotal(
            sourceValues?.partner?.currentBalance,
            sourceValues?.joint?.currentBalance,
          )
        : showPartner
          ? sourceValues?.partner?.currentBalance || ""
          : "",
    ...(hasCostBase
      ? {
          clientCostBaseTemp: sourceValues?.client?.costBase || "",
          partnerCostBaseTemp: showPartner
            ? sourceValues?.partner?.costBase || ""
            : "",
          ...(includeJoint
            ? {
                jointCostBaseTemp:
                  showPartner && includeJoint
                    ? sourceValues?.joint?.costBase || ""
                    : "",
              }
            : {}),
        }
      : {}),
      _id:undefined
  };
}

function buildCustomPayload({
  sectionData,
  discoveryData,
  sourceValues,
  config,
  hasCostBase,
}) {
  const customKeys = getCustomKeys(config);
  const customSource = sourceValues?.[customKeys.valueKey] || {};

  return {
    clientFK:
      sectionData?.clientFK ||
      discoveryData?.personalDetails?._id ||
      discoveryData?.personaldetails?._id ||
      undefined,
    [customKeys.valueKey]: customSource?.currentBalanceArray || [],
    [customKeys.totalKey]: customSource?.currentBalance || "",
    ...(hasCostBase
      ? {
          [`${customKeys.totalKey}CostBase`]: customSource?.costBase || "",
        }
      : {}),
  };
}

const MiddleWare = ({ modalData }) => {
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailModalData, setDetailModalData] = useState(null);
  const [form] = Form.useForm();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const discoveryData = useAtomValue(discoveryDataAtom);
  const setDiscoveryData = useSetAtom(discoveryDataAtom);
  const setQuestionData = useSetAtom(discoverySectionQuestionsAtom);

  const { post, patch } = useApi();

  const renderTitleBlock = useTitleBlock({
    titleStyle: HEADING_STYLE,
  });
  const config = useMemo(
    () => ({
      ...(MIDDLEWARE_CONFIG[modalData?.key] ||
        MIDDLEWARE_CONFIG.bankAccountFinance),
      pageLimit: modalData?.tableRows || 10,
    }),
    [modalData?.key, modalData?.tableRows],
  );
  const includeJoint = !config.noJoint;
  const includePartner = !config.noPartner;
  const customKeys = useMemo(() => getCustomKeys(config), [config]);
  const hasCostBase = ["australianShareMarket", "managedFund"].includes(
    modalData?.key,
  );

  const showPartner = !["Single", "Widowed"].includes(
    discoveryData?.personalDetails?.client?.clientMaritalStatus,
  );
  const sectionData = discoveryData?.[modalData?.key] || {};

  const initialValues = useMemo(
    () => buildInitialValues(sectionData, config.noJoint, config),
    [config, sectionData],
  );

  const clientCurrentBalance = Form.useWatch(
    ["client", "currentBalance"],
    form,
  );
  const partnerCurrentBalance = Form.useWatch(
    ["partner", "currentBalance"],
    form,
  );

  const jointCurrentBalance = Form.useWatch(["joint", "currentBalance"], form);
  const clientCostBase = Form.useWatch(["client", "costBase"], form);
  const partnerCostBase = Form.useWatch(["partner", "costBase"], form);
  const jointCostBase = Form.useWatch(["joint", "costBase"], form);

  useEffect(() => {
    form.setFieldsValue(initialValues);
    setEditing(!sectionData?.clientFK);
  }, [form, initialValues, sectionData?.clientFK]);

  const openInnerModal = useCallback(
    ({ record, form: currentForm }) => {
      setDetailModalOpen(true);
      setDetailModalData({
        title: `${record?.owner || "Owner"} ${modalData?.title || ""}`.trim(),
        component: modalData?.innerComponent || null,
        icon: modalData?.icon || null,
        width: config.width || 680,
        ownerKey: record?.formPath?.[0],
        ownerLabel: record?.owner,
        parentForm: currentForm,
        sectionKey: modalData?.key,
        tableRows: modalData?.tableRows || 10,
        closeModal: () => {
          setDetailModalOpen(false);
          setEditing(true);
        },
      });
    },
    [
      config.width,
      modalData?.icon,
      modalData?.innerComponent,
      modalData?.key,
      modalData?.tableRows,
      modalData?.title,
    ],
  );

  const tableColumns = useMemo(() => {
    const columns = [
      {
        title: "Owner",
        dataIndex: "owner",
        key: "owner",
        editable: false,
      },
      {
        title: "Current Balance",
        dataIndex: "currentBalance",
        key: "currentBalance",
        field: "currentBalance",
        disabled: true,
        type: "input-action",
        placeholder: "Current Balance",
        action: {
          name: "Open Current Balance",
          onClick: openInnerModal,
        },
      },
    ];

    if (hasCostBase) {
      columns.push({
        title: "Cost Base",
        dataIndex: "costBase",
        key: "costBase",
        field: "costBase",
        disabled: true,
        type: "text",
        placeholder: "Cost Base",
      });
    }

    return columns;
  }, [hasCostBase, openInnerModal]);

  const rowData = useMemo(() => {
    let rows = [];

    if (customKeys.enabled) {
      console.log(initialValues?.[customKeys.valueKey], "initialValues");
      console.log(customKeys.valueKey, "customKeys.valueKey");
      rows = [
        {
          key: customKeys.displayKey,
          formPath: [customKeys.valueKey],
          owner: customKeys.displayKey,
          currentBalance:
            clientCurrentBalance ??
            initialValues?.[customKeys.valueKey]?.currentBalance,
          costBase:
            clientCostBase ?? initialValues?.[customKeys.valueKey]?.costBase,
        },
      ];
    } else {
      rows = [
        {
          key: "client",
          formPath: ["client"],
          owner: buildOwnerLabel("client", discoveryData),
          currentBalance:
            clientCurrentBalance ?? initialValues?.client?.currentBalance,
          costBase: clientCostBase ?? initialValues?.client?.costBase,
        },
      ];
    }

    if (includePartner && showPartner) {
      rows.push({
        key: "partner",
        formPath: ["partner"],
        owner: buildOwnerLabel("partner", discoveryData),
        currentBalance:
          partnerCurrentBalance ?? initialValues?.partner?.currentBalance,
        costBase: partnerCostBase ?? initialValues?.partner?.costBase,
      });

      if (includeJoint) {
        rows.push({
          key: "joint",
          formPath: ["joint"],
          owner: buildOwnerLabel("joint", discoveryData),
          currentBalance:
            jointCurrentBalance ?? initialValues?.joint?.currentBalance,
          costBase: jointCostBase ?? initialValues?.joint?.costBase,
        });
      }
    }

    return rows;
  }, [
    clientCurrentBalance,
    clientCostBase,
    discoveryData,
    customKeys,
    includeJoint,
    includePartner,
    initialValues,
    jointCurrentBalance,
    jointCostBase,
    partnerCurrentBalance,
    partnerCostBase,
    showPartner,
  ]);

  const handleFinish = async (values) => {
    const formValues = form.getFieldsValue(true);
    const sourceValues = buildSourceValues(formValues, values, config);
    const payload = customKeys.enabled
      ? buildCustomPayload({
          sectionData,
          discoveryData,
          sourceValues,
          config,
          hasCostBase,
        })
      : buildStandardPayload({
          sectionData,
          discoveryData,
          sourceValues,
          showPartner,
          includeJoint,
          hasCostBase,
        });

    try {
      setSaving(true);

      const saved = sectionData?.clientFK
        ? await patch(config.updateEndpoint, payload)
        : await post(config.addEndpoint, payload);

      if (modalData?.key === "superAnnuationIssues") {
        setDiscoveryData((prev) => ({
          ...(prev && typeof prev === "object" ? prev : {}),
          [modalData.key]: saved.superFunds || payload,
          personalInsurance: saved.personalInsurance,
        }));

        setQuestionData((prev) => ({
          ...(prev && typeof prev === "object" ? prev : {}),
          ...saved.questionDetails,
        }));
      } else {
        setDiscoveryData((prev) => ({
          ...(prev && typeof prev === "object" ? prev : {}),
          [modalData.key]: saved || payload,
        }));
      }

      message.success(
        `${modalData?.title || "Financial section"} updated successfully`,
      );
      modalData?.closeModal?.();
    } catch (error) {
      message.error(
        error?.response?.data?.message ||
          error?.message ||
          `Failed to update ${modalData?.title || "Financial section"}`,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <AppModal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={renderTitleBlock({
          title: detailModalData?.title,
          icon: detailModalData?.icon,
        })}
        width={detailModalData?.width}
      >
        {renderModalContent(detailModalData)}
      </AppModal>

      <Form
        form={form}
        initialValues={initialValues}
        onFinish={handleFinish}
        layout="vertical"
      >
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <EditableDynamicTable
              form={form}
              editing={editing}
              columns={tableColumns}
              data={rowData}
              tableProps={TABLE_PROPS}
            />
          </Col>

          <Col xs={24}>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 12,
                marginTop: 8,
              }}
            >
              <Space>
                <Button onClick={() => modalData?.closeModal?.()}>
                  Cancel
                </Button>
                {!editing ? (
                  <Button
                    type="primary"
                    htmlType="button"
                    key="edit"
                    onClick={() => setEditing(true)}
                  >
                    Edit <RiEdit2Fill />
                  </Button>
                ) : (
                  <Button
                    key="save"
                    type="primary"
                    htmlType="submit"
                    loading={saving}
                    disabled={saving}
                  >
                    Save
                  </Button>
                )}
              </Space>
            </div>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default MiddleWare;
