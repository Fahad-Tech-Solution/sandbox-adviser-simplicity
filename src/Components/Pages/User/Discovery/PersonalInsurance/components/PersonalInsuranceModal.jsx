import { Button, Col, Form, message, Row, Select, Tabs } from "antd";
import { useAtomValue, useSetAtom } from "jotai";
import React, { useEffect, useMemo, useState } from "react";
import {
  discoveryDataAtom,
  InvestmentOffersData,
} from "../../../../../../store/authState.js";
import { toCommaAndDollar } from "../../../../../../hooks/helpers.js";
import useApi from "../../../../../../hooks/useApi.js";
import EditableDynamicTable from "../../../../../Common/EditableDynamicTable.jsx";
import SwitchPopupDisplay from "../../../../../Common/SwitchPopupDisplay.jsx";
import { RiEdit2Fill } from "react-icons/ri";
import { GoArrowUpRight } from "react-icons/go";
import PersonalInsuranceGroupCoverModal from "./PersonalInsuranceGroupCoverModal.jsx";
import { renderModalContent } from "../../../../../Common/renderModalContent.jsx";
import AppModal from "../../../../../Common/AppModal.jsx";
import PersonalInsuranceLumpSumModal from "./PersonalInsuranceLumpSumModal.jsx";
import PersonalInsuranceIncomeProtectionModal from "./PersonalInsuranceIncomeProtectionModal.jsx";
import PersonalInsurancePremiumsModal from "./PersonalInsurancePremiumsModal.jsx";
import EstatePlanningDescriptionModal from "../../EstatePlanning/components/wills/EstatePlanningDescriptionModal.jsx";
import BeneficiariesModal from "../../FinancialInvestments/components/SuperFunds/BeneficiariesModal.jsx";

const TABLE_PROPS = {
  showCount: false,
  noPagination: true,
  horizontalScroll: true,
  tableStyle: { borderRadius: 12, overflow: "hidden" },
  headerFontSize: 11,
  bodyFontSize: 12,
};

/** Stable fallbacks so useMemo/useEffect deps do not change every render. */
const EMPTY_OBJECT = Object.freeze({});
const EMPTY_SUPER_ANNUATION_ISSUES = Object.freeze({
  client: [],
  joint: [],
  partner: [],
});

function currencyToNumber(val) {
  return Number(String(val ?? "$0").replace(/[^0-9.-]+/g, "")) || 0;
}

function slicePoliciesForOwner(branch) {
  if (!branch || typeof branch !== "object") return [];
  const policies = Array.isArray(branch.policies) ? branch.policies : [];
  const n = Number(branch.NumberOfMaps);
  const count =
    Number.isFinite(n) && n > 0 ? Math.min(n, policies.length) : policies.length;
  return policies.slice(0, count);
}

function computeOwnerTotals(policies, groupCoverDetails = {}) {
  const gd = groupCoverDetails || {};
  const LifeInsuranceTotal =
    policies.reduce((sum, item) => sum + currencyToNumber(item?.life), 0) +
    currencyToNumber(gd?.lifeCover);
  const TPDTotal =
    policies.reduce(
      (sum, item) =>
        sum +
        currencyToNumber(
          item?.LifeTPDTraumaDetails?.TPDDefinition !== "Split (Own)"
            ? item?.TPD
            : 0,
        ),
      0,
    ) + currencyToNumber(gd?.TPDCover);
  const TraumaTotal = policies.reduce(
    (sum, item) => sum + currencyToNumber(item?.trauma),
    0,
  );
  const IncomeProtectionTotal =
    policies.reduce(
      (sum, item) =>
        sum +
        currencyToNumber(
          item?.IPDetails?.superlinked === "No" ? item?.IP : 0,
        ),
      0,
    ) + currencyToNumber(gd?.monthlyIncome);
  return {
    LifeInsuranceTotal,
    TPDTotal,
    TraumaTotal,
    IncomeProtectionTotal,
  };
}

/** Policies array length matches NumberOfMaps (1–10): pad with `{}` or slice. */
function alignPoliciesToMapCount(policies, mapCount) {
  const raw = Array.isArray(policies) ? [...policies] : [];
  const n = Number(mapCount);
  if (!Number.isFinite(n) || n < 1 || n > 10) {
    return raw;
  }
  if (raw.length < n) {
    const next = [...raw];
    while (next.length < n) {
      next.push({});
    }
    return next;
  }
  if (raw.length > n) {
    return raw.slice(0, n);
  }
  return raw;
}

function setOwnerPoliciesToMapCount(form, ownerKey, mapCount) {
  const n = Number(mapCount);
  if (!Number.isFinite(n) || n < 1 || n > 10) return;
  const ownerBlock = form.getFieldValue(ownerKey) || {};
  const prev = Array.isArray(ownerBlock.policies)
    ? ownerBlock.policies
    : [];
  const newPolicies = alignPoliciesToMapCount(prev, n);
  if (
    prev.length === newPolicies.length &&
    Number(ownerBlock.NumberOfMaps) === n
  ) {
    return;
  }
  form.setFieldValue(ownerKey, {
    ...ownerBlock,
    NumberOfMaps: n,
    policies: newPolicies,
  });
}

function OwnerTabContent({
  form,
  ownerKey,
  ownerLabel,
  editing,
  setEditing,
  activeTabKey,
}) {
  let [openModal, setOpenModal] = useState(false);
  let [modalData, setModalData] = useState(null);
  const investmentOffers = useAtomValue(InvestmentOffersData);
  const watchedPolicies = Form.useWatch([ownerKey, "policies"], form);
  const watchedMapCount = Form.useWatch([ownerKey, "NumberOfMaps"], form);

  useEffect(() => {
    if (!editing || activeTabKey !== ownerKey) return;
    setOwnerPoliciesToMapCount(form, ownerKey, watchedMapCount);
  }, [activeTabKey, editing, form, ownerKey, watchedMapCount]);

  const providerOptions = useMemo(() => {
    const funds = Array.isArray(investmentOffers?.PersonalInsurances)
      ? investmentOffers.PersonalInsurances
      : [];

    return funds.map((item) => ({
      value: item?._id || item?.value || item?.platformName || item?.name || "",
      label: item?.platformName || item?.label || item?.name || "Unknown",
    }));
  }, [investmentOffers]);

  const handleRemoveRow = (rowIndex) => {
    const ownerBlock = form.getFieldValue(ownerKey) || {};
    const currentPolicies = Array.isArray(ownerBlock.policies)
      ? ownerBlock.policies
      : [];
    const nextPolicies = currentPolicies.filter(
      (_, index) => index !== rowIndex,
    );

    form.setFieldValue(ownerKey, {
      ...ownerBlock,
      policies: nextPolicies,
      NumberOfMaps: nextPolicies.length,
    });
  };

  const handleOpenLoadingExclusion = (record) => {
    const providerLabel =
      providerOptions.find((option) => option.value === record.provider)
        ?.label || "";
    const fieldPath = record?.formPath;
    setOpenModal(true);
    setModalData({
      title: `${ownerLabel}_${providerLabel}_Loading/ Exclusion`,
      component: EstatePlanningDescriptionModal,
      key: "loadingExclusion",
      width: 1000,
      parentForm: form,
      owner: ownerKey,
      record,
      fieldPath,
      initialValues:
        (fieldPath ? form.getFieldValue(fieldPath) : null) || record || {},
      rowDescriptionKey: "loadingExclusiondescription",
      descriptionLabel: "Loading / Exclusion Description",
      descriptionPlaceholder: "Enter loading or exclusion details",
      closeModal: () => {
        setOpenModal(false);
        setEditing(true);
      },
    });
  };

  const handleOpenBeneficiary = (record) => {
    const providerLabel =
      providerOptions.find((option) => option.value === record.provider)
        ?.label || "";
    const fieldPath = record?.formPath;

    setOpenModal(true);
    setModalData({
      title: `${ownerLabel}_${providerLabel}_Beneficiary`,
      component: BeneficiariesModal,
      key: "beneficiary",
      width: 1000,
      parentForm: form,
      owner: ownerKey,
      record,
      fieldPath,
      beneficiaryDetailsShape: "personalInsurance",
      initialValues:
        (fieldPath ? form.getFieldValue(fieldPath) : null) || record || {},
      closeModal: () => {
        setOpenModal(false);
        setEditing(true);
      },
    });
  };

  const columns = [
    {
      title: "No#",
      dataIndex: "index",
      key: "index",
      justText: true,
      width: 40,
    },
    {
      title: "Provider",
      dataIndex: "provider",
      key: "provider",
      type: "select",
      placeholder: "Select Provider",
      options: providerOptions,
    },
    {
      title: "Policy No",
      dataIndex: "policyNo",
      key: "policyNo",
      type: "number",
      width: 100,
      placeholder: "Policy No",
    },
    {
      title: "Owner",
      dataIndex: "Owner",
      key: "Owner",
      type: "select",
      placeholder: "Select Owner",
      options: [
        {
          value: ownerKey,
          label: ownerLabel,
        },
        { value: "SMSF", label: "SMSF" },
        { value: "Super Trustees", label: "Super Trustees" },
        { value: "Company (Pty Ltd)", label: "Company (Pty Ltd)" },
        { value: "Family Trust", label: "Family Trust" },
      ],
    },
    {
      title: "Start Date",
      dataIndex: "startDate",
      key: "startDate",
      type: "date",
      width: 130,
      placeholder: "dd/mm/yyyy",
    },
    {
      title: "Smoker",
      dataIndex: "smoker",
      key: "smoker",
      type: "yesNoSwitch",
    },
    {
      title: "Life",
      dataIndex: "life",
      key: "life",
      type: "text",
      placeholder: "Life",
      disabled: true,
      width: 100,
    },
    {
      title: "TPD",
      dataIndex: "TPD",
      key: "TPD",
      type: "text",
      placeholder: "TPD",
      width: 100,
      disabled: true,
    },
    {
      title: "Trauma",
      dataIndex: "trauma",
      key: "trauma",
      type: "input-action",
      placeholder: "Trauma",
      disabled: true,
      action: {
        name: "Open Trauma",
        onClick: ({ record }) => {
          setOpenModal(true);
          setModalData({
            title:
              ownerLabel +
              "_" +
              providerOptions.find((option) => option.value === record.provider)
                ?.label +
              "_Lumpsum Cover (Life/TPD/Trauma)",
            component: PersonalInsuranceLumpSumModal,
            key: "trauma",
            width: 1000,
            parentForm: form,
            owner: ownerKey,
            record,
            closeModal: () => {
              setOpenModal(false);
              setEditing(true);
            },
          });
        },
      },
    },
    {
      title: "IP",
      dataIndex: "IP",
      key: "IP",
      type: "input-action",
      placeholder: "IP",
      disabled: true,
      action: {
        name: "Open IP",
        onClick: ({ record }) => {
          setOpenModal(true);
          setModalData({
            title:
              ownerLabel +
              "_" +
              providerOptions.find((option) => option.value === record.provider)
                ?.label +
              "_Income Protection",
            component: PersonalInsuranceIncomeProtectionModal,
            key: "IP",
            width: 1500,
            parentForm: form,
            owner: ownerKey,
            record,
            closeModal: () => {
              setOpenModal(false);
              setEditing(true);
            },
          });
        },
      },
    },
    {
      title: "Premiums p.a",
      dataIndex: "premiums",
      key: "premiums",
      type: "input-action",
      placeholder: "Premiums p.a",
      disabled: true,
      action: {
        name: "Open Premiums",
        onClick: ({ record }) => {
          setOpenModal(true);
          const providerLabel =
            providerOptions.find((option) => option.value === record.provider)
              ?.label || "";
          setModalData({
            title: `${ownerLabel}_${providerLabel}_Premiums`,
            component: PersonalInsurancePremiumsModal,
            key: "premiums",
            width: 1200,
            parentForm: form,
            owner: ownerKey,
            ownerLabel,
            record,
            closeModal: () => {
              setOpenModal(false);
              setEditing(true);
            },
          });
        },
      },
    },
    {
      title: "Loading/ Exclusion",
      dataIndex: "loadingExclusion",
      key: "loadingExclusion",
      type: "yesNoSwitchWithButton",
      action: {
        name: "Open Loading/ Exclusion",
        onClick: ({ record }) => {
          handleOpenLoadingExclusion(record);
        },
      },
      renderView: ({ value, record }) => (
        <SwitchPopupDisplay
          value={value}
          onClick={() => {
            handleOpenLoadingExclusion(record);
          }}
        />
      ),
    },
    {
      title: "Beneficiary",
      dataIndex: "beneficiary",
      key: "beneficiary",
      type: "yesNoSwitchWithButton",
      action: {
        name: "Open Beneficiary",
        onClick: ({ record }) => {
          handleOpenBeneficiary(record);
        },
      },
      renderView: ({ value, record }) => (
        <SwitchPopupDisplay
          value={value}
          onClick={() => {
            handleOpenBeneficiary(record);
          }}
        />
      ),
    },
    {
      //action button
      title: "Action",
      dataIndex: "action",
      key: "action",
      type: "text",
      editable: false,
      renderView: () => "--",
      renderEdit: ({ record }) => (
        <Button
          type="text"
          danger
          onClick={() => handleRemoveRow(record.rowIndex)}
        >
          🗑️
        </Button>
      ),
    },
  ];

  const rows = useMemo(() => {
    const raw = Array.isArray(watchedPolicies)
      ? watchedPolicies
      : form.getFieldValue([ownerKey, "policies"]) || [];
    const sourcePolicies =
      editing && activeTabKey === ownerKey
        ? alignPoliciesToMapCount(raw, watchedMapCount)
        : raw;

    return sourcePolicies.map((item, index) => ({
      ...item,
      key: `${ownerKey}-policy-${index}`,
      rowIndex: index,
      index: index + 1,
      formPath: [ownerKey, "policies", index],
    }));
  }, [
    activeTabKey,
    editing,
    form,
    ownerKey,
    watchedMapCount,
    watchedPolicies,
  ]);

  const onOpenGroupCover = () => {
    setOpenModal(true);
    setModalData({
      title: ownerLabel + "_Group Cover Details",
      component: PersonalInsuranceGroupCoverModal,
      icon: "🏢",
      key: "groupCover",
      width: 1000,
      parentForm: form,
      closeModal: () => setOpenModal(false),
    });
  };

  return (
    <Row gutter={[16, 0]}>
      <AppModal
        open={openModal}
        onClose={modalData?.closeModal}
        title={modalData?.title}
        width={modalData?.width}
      >
        {renderModalContent(modalData)}
      </AppModal>

      <Col xs={24} md={6}>
        <Form.Item name={[ownerKey, "NumberOfMaps"]} label="Number of Maps">
          <Select
            options={Array.from({ length: 10 }, (_, index) => ({
              value: index + 1,
              label: index + 1,
            }))}
            disabled={!editing}
            onChange={(value) => {
              if (editing && activeTabKey === ownerKey) {
                setOwnerPoliciesToMapCount(form, ownerKey, value);
              }
            }}
          />
        </Form.Item>
      </Col>
      <Col xs={24} md={6}>
        <Form.Item label="Insurance Cover (Group) :" name="groupCover">
          <Button
            key="groupCover"
            type={"primary"}
            size={"small"}
            style={{ width: "25px", padding: 0 }}
            onClick={() => onOpenGroupCover(ownerKey)}
          >
            <GoArrowUpRight />
          </Button>
        </Form.Item>
      </Col>
      <Col xs={24} md={24}>
        <Form.Item
          // Add a dependency so this field re-renders when NumberOfMaps changes for this owner
          shouldUpdate={(prevValues, currentValues) => {
            return (
              prevValues?.[ownerKey]?.NumberOfMaps !== currentValues?.[ownerKey]?.NumberOfMaps
            );
          }}
          noStyle
        >
          {() => {
            
            return(
            <EditableDynamicTable
              key={`${ownerKey}-policies-${Array.isArray(watchedPolicies) ? watchedPolicies.length : 0}`}
              form={form}
              editing={editing}
              columns={columns}
              data={rows}
              tableProps={TABLE_PROPS}
            />
          )}}
        </Form.Item>
      </Col>
    </Row>
  );
}

export default function PersonalInsuranceModal({ modalData }) {
  const discoveryData = useAtomValue(discoveryDataAtom);
  const setDiscoveryData = useSetAtom(discoveryDataAtom);
  const { post, patch } = useApi();
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState("client");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const clientName =
    discoveryData?.personalDetails?.client?.clientPreferredName ||
    discoveryData?.personaldetails?.client?.clientPreferredName ||
    "Client";

  const partnerName =
    discoveryData?.personalDetails?.partner?.partnerPreferredName ||
    discoveryData?.personaldetails?.partner?.partnerPreferredName ||
    "Partner";

  const allowPartner = !["Single", "Widowed"].includes(
    discoveryData?.personalDetails?.client?.clientMaritalStatus,
  );

  const personalInsurance = discoveryData?.personalInsurance ?? EMPTY_OBJECT;

  const superAnnuationIssues = useMemo(() => {
    const raw = discoveryData?.superAnnuationIssues;
    if (raw && Object.keys(raw).length > 0) return raw;
    return EMPTY_SUPER_ANNUATION_ISSUES;
  }, [discoveryData?.superAnnuationIssues]);

  const groupInsuranceDetailsAll = useMemo(() => {
    return ["client", "partner", "joint"].reduce((acc, key) => {
      acc[key] = (superAnnuationIssues[key] || [])
        .filter((item) => item.groupInsurance === "Yes")
        .map((item) => item || {});
      return acc;
    }, {});
  }, [superAnnuationIssues]);

  const initialValues = useMemo(() => {
    const clientPolicies = personalInsurance?.client?.PersonalInsurance;
    const partnerPolicies = personalInsurance?.partner?.PersonalInsurance;
    const groupCoverDetails = groupInsuranceDetailsAll[activeTab]?.[0] || {};

    return {
      client: {
        NumberOfMaps: Array.isArray(clientPolicies) ? clientPolicies.length : 0,
        policies: Array.isArray(clientPolicies) ? clientPolicies : [],
      },
      partner: allowPartner
        ? {
            NumberOfMaps: Array.isArray(partnerPolicies)
              ? partnerPolicies.length
              : 0,
            policies: Array.isArray(partnerPolicies) ? partnerPolicies : [],
          }
        : undefined,
      groupCover: groupCoverDetails || {},
    };
  }, [personalInsurance, activeTab, allowPartner, groupInsuranceDetailsAll]);

  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [form, initialValues]);

  const handleFinish = async (values) => {
    const pi = personalInsurance && typeof personalInsurance === "object"
      ? personalInsurance
      : {};

    const clientPolicies = slicePoliciesForOwner(values?.client);
    const partnerPolicies = allowPartner
      ? slicePoliciesForOwner(values?.partner)
      : Array.isArray(pi?.partner?.PersonalInsurance)
        ? pi.partner.PersonalInsurance
        : [];

    const clientGroupDetails =
      groupInsuranceDetailsAll?.client?.[0]?.groupInsuranceDetails || {};
    const partnerGroupDetails =
      groupInsuranceDetailsAll?.partner?.[0]?.groupInsuranceDetails || {};

    const clientTotals = computeOwnerTotals(clientPolicies, clientGroupDetails);
    const partnerTotals = allowPartner
      ? computeOwnerTotals(partnerPolicies, partnerGroupDetails)
      : null;

    const payload = {
      ...(pi._id ? { _id: pi._id } : {}),
      clientFK: pi.clientFK || discoveryData?.clientFK,
      selectedStakeholders: Array.isArray(pi.selectedStakeholders)
        ? pi.selectedStakeholders
        : ["client"],
      client: {
        ...(pi.client && typeof pi.client === "object" ? pi.client : {}),
        PersonalInsurance: clientPolicies,
        numberOfPolicies: clientPolicies.length,
      },
      clientLifeInsuranceTotal: toCommaAndDollar(clientTotals.LifeInsuranceTotal),
      clientTPDTotal: toCommaAndDollar(clientTotals.TPDTotal),
      clientTraumaTotal: toCommaAndDollar(clientTotals.TraumaTotal),
      clientIncomeProtectionTotal: toCommaAndDollar(
        clientTotals.IncomeProtectionTotal,
      ),
      clientHasPersonalInsurance: clientPolicies.length > 0 ? "Yes" : "No",
      ...(allowPartner && partnerTotals
        ? {
            partner: {
              ...(pi.partner && typeof pi.partner === "object"
                ? pi.partner
                : {}),
              PersonalInsurance: partnerPolicies,
              numberOfPolicies: partnerPolicies.length,
            },
            partnerLifeInsuranceTotal: toCommaAndDollar(
              partnerTotals.LifeInsuranceTotal,
            ),
            partnerTPDTotal: toCommaAndDollar(partnerTotals.TPDTotal),
            partnerTraumaTotal: toCommaAndDollar(partnerTotals.TraumaTotal),
            partnerIncomeProtectionTotal: toCommaAndDollar(
              partnerTotals.IncomeProtectionTotal,
            ),
            partnerHasPersonalInsurance:
              partnerPolicies.length > 0 ? "Yes" : "No",
          }
        : {
            partner: pi.partner,
            partnerLifeInsuranceTotal: pi.partnerLifeInsuranceTotal,
            partnerTPDTotal: pi.partnerTPDTotal,
            partnerTraumaTotal: pi.partnerTraumaTotal,
            partnerIncomeProtectionTotal: pi.partnerIncomeProtectionTotal,
            partnerHasPersonalInsurance: pi.partnerHasPersonalInsurance,
          }),
    };

    try {
      setSaving(true);
      const saved = pi.clientFK
        ? await patch("/api/personalInsurance/Update", payload)
        : await post("/api/personalInsurance/Add", payload);

      setDiscoveryData((prev) => ({
        ...(prev && typeof prev === "object" ? prev : {}),
        personalInsurance:
          saved?.personalInsurance !== undefined
            ? saved.personalInsurance
            : saved ?? payload,
      }));

      message.success("Personal insurance saved successfully");
      setEditing(false);
      modalData?.closeModal?.();
    } catch (error) {
      message.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to save personal insurance",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 0 }}>
      <Form
        form={form}
        initialValues={initialValues}
        onFinish={handleFinish}
        requiredMark={false}
        colon={false}
        layout="horizontal"
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={24}>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={[
                {
                  key: "client",
                  label: clientName,
                  children: (
                    <OwnerTabContent
                      form={form}
                      ownerKey="client"
                      ownerLabel={clientName}
                      editing={editing}
                      setEditing={setEditing}
                      activeTabKey={activeTab}
                    />
                  ),
                },
                ...(allowPartner
                  ? [
                      {
                        key: "partner",
                        label: partnerName,
                        children: (
                          <OwnerTabContent
                            form={form}
                            ownerKey="partner"
                            ownerLabel={partnerName}
                            editing={editing}
                            setEditing={setEditing}
                            activeTabKey={activeTab}
                          />
                        ),
                      },
                    ]
                  : []),
              ]}
            />
          </Col>
          <Col xs={24}>
            <div
              style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}
            >
              <Button onClick={() => modalData?.closeModal?.()}>Cancel</Button>
              {!editing ? (
                <Button
                  key="edit"
                  type="primary"
                  htmlType="button"
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
            </div>
          </Col>
        </Row>
      </Form>
    </div>
  );
}
