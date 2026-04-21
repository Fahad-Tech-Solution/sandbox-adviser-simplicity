import { Button, Col, Form, message, Row, Select, Space } from "antd";
import { useAtomValue, useSetAtom } from "jotai";
import React, { useEffect, useMemo, useState } from "react";
import { RiEdit2Fill } from "react-icons/ri";
import AppModal from "../../../../../../Common/AppModal.jsx";
import EditableDynamicTable from "../../../../../../Common/EditableDynamicTable.jsx";
import { renderModalContent } from "../../../../../../Common/renderModalContent.jsx";
import { discoveryDataAtom } from "../../../../../../../store/authState";
import useApi from "../../../../../../../hooks/useApi.js";
import EstatePlanningDescriptionModal from "./EstatePlanningDescriptionModal.jsx";
import ExecutorDetailsModal from "./ExecutorDetailsModal.jsx";

const TABLE_PROPS = {
  showCount: false,
  noPagination: true,
  horizontalScroll: true,
  tableStyle: { borderRadius: 12, overflow: "hidden" },
  headerFontSize: 11,
  bodyFontSize: 12,
};

function getClientName(discoveryData) {
  return (
    discoveryData?.personalDetails?.client?.clientPreferredName ||
    discoveryData?.personaldetails?.client?.clientPreferredName ||
    "Client"
  );
}

function getPartnerName(discoveryData) {
  return (
    discoveryData?.personalDetails?.partner?.partnerPreferredName ||
    discoveryData?.personaldetails?.partner?.partnerPreferredName ||
    "Partner"
  );
}

function buildOwnerOptions(discoveryData, allowPartner) {
  const clientName = getClientName(discoveryData);
  const partnerName = getPartnerName(discoveryData);

  return allowPartner
    ? [
        { value: "client", label: clientName },
        { value: "partner", label: partnerName },
        {
          value: "together",
          label: `Together (${clientName} & ${partnerName})`,
        },
      ]
    : [{ value: "client", label: clientName }];
}

function buildWillPerson(person = {}) {
  const executor = Array.isArray(person?.executor) ? person.executor : [];
  console.log("person", person);
  return {
    yearSetUp: person?.yearSetUp || "",
    willsCurrent: person?.willsCurrent || "",
    executor,
    executorDisplay: executor.length ? String(executor.length) : "",
    enduringGuardianship: person?.enduringGuardianship || "",
    testamentaryTrust: person?.testamentaryTrust || "",
    estatePlanningRadio: person?.estatePlanningRadio || "",
    estatePlanningdescription: person?.estatePlanningdescription || "",
  };
}

function buildInitialValues(sectionData = {}, allowPartner) {
  const rawOwner = Array.isArray(sectionData?.owner) ? sectionData.owner : [];

  const owner = allowPartner
    ? rawOwner
    : rawOwner.filter((value) => value === "client");

  return {
    owner,
    client: buildWillPerson(sectionData?.client),
    partner: buildWillPerson(sectionData?.partner),
  };
}

function buildPayloadPerson(person = {}, existing = {}) {
  return {
    ...existing,
    yearSetUp: person?.yearSetUp || "",
    willsCurrent: person?.willsCurrent || "",
    executor: Array.isArray(person?.executor) ? person.executor : [],
    enduringGuardianship: person?.enduringGuardianship || "",
    testamentaryTrust: person?.testamentaryTrust || "",
    estatePlanningRadio: person?.estatePlanningRadio || "",
    estatePlanningdescription: person?.estatePlanningdescription || "",
  };
}

function SwitchPopupDisplay({ value, onClick }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span>{value || "No"}</span>
      {value === "Yes" ? (
        <Button
          type="primary"
          size="small"
          style={{ width: 25, padding: 0 }}
          onClick={onClick}
        >
          ↗
        </Button>
      ) : null}
    </div>
  );
}

export default function EstatePlanningWill({ modalData }) {
  const [form] = Form.useForm();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailModalData, setDetailModalData] = useState(null);
  const { post, patch } = useApi();

  const discoveryData = useAtomValue(discoveryDataAtom);
  const setDiscoveryData = useSetAtom(discoveryDataAtom);

  const sectionData = discoveryData?.[modalData?.key] || {};

  const allowPartner = !["Single", "Widowed"].includes(
    discoveryData?.personalDetails?.client?.clientMaritalStatus,
  );

  const ownerOptions = useMemo(
    () => buildOwnerOptions(discoveryData, allowPartner),
    [allowPartner, discoveryData],
  );
  const initialValues = useMemo(
    () => buildInitialValues(sectionData, allowPartner),
    [allowPartner, sectionData],
  );
  const selectedOwners = Form.useWatch("owner", form) || initialValues.owner;

  useEffect(() => {
    form.setFieldsValue(initialValues);
    setEditing(!sectionData?.clientFK);
  }, [form, initialValues, sectionData?.clientFK]);

  useEffect(() => {
    if (!allowPartner && selectedOwners?.some((owner) => owner !== "client")) {
      form.setFieldValue("owner", ["client"]);
    }
  }, [allowPartner, form, selectedOwners]);

  const rows = useMemo(() => {
    const nextRows = [];
    const clientName = getClientName(discoveryData);
    const partnerName = getPartnerName(discoveryData);

    const watchedClient = form.getFieldValue("client");
    const watchedPartner = form.getFieldValue("partner");

    if (selectedOwners?.includes("client")) {
      nextRows.push({
        key: "client",
        formPath: "client",
        ownerLabel: clientName,
        yearSetUp: watchedClient?.yearSetUp || "",
        willsCurrent: watchedClient?.willsCurrent || "No",
        executorDisplay:
          Array.isArray(watchedClient?.executor) &&
          watchedClient.executor.length
            ? String(watchedClient.executor.length)
            : "",
        enduringGuardianship: watchedClient?.enduringGuardianship || "No",
        testamentaryTrust: watchedClient?.testamentaryTrust || "No",
        estatePlanningRadio: watchedClient?.estatePlanningRadio || "No",
      });
    }

    if (allowPartner && selectedOwners?.includes("partner")) {
      nextRows.push({
        key: "partner",
        formPath: "partner",
        ownerLabel: partnerName,
        yearSetUp: watchedPartner?.yearSetUp || "",
        willsCurrent: watchedPartner?.willsCurrent || "No",
        executorDisplay:
          Array.isArray(watchedPartner?.executor) &&
          watchedPartner.executor.length
            ? String(watchedPartner.executor.length)
            : "",
        enduringGuardianship: watchedPartner?.enduringGuardianship || "No",
        testamentaryTrust: watchedPartner?.testamentaryTrust || "No",
        estatePlanningRadio: watchedPartner?.estatePlanningRadio || "No",
      });
    }

    if (allowPartner && selectedOwners?.includes("together")) {
      nextRows.push({
        key: "together",
        formPath: "client",
        ownerLabel: `Together (${clientName} & ${partnerName})`,
        yearSetUp: watchedClient?.yearSetUp || "",
        willsCurrent: watchedClient?.willsCurrent || "",
        executorDisplay:
          Array.isArray(watchedClient?.executor) &&
          watchedClient.executor.length
            ? String(watchedClient.executor.length)
            : "",
        enduringGuardianship: watchedClient?.enduringGuardianship || "",
        testamentaryTrust: watchedClient?.testamentaryTrust || "",
        estatePlanningRadio: watchedClient?.estatePlanningRadio || "",
      });
    }

    return nextRows;
  }, [allowPartner, discoveryData, selectedOwners, form]);

  const openInnerModal = (type, record) => {
    const rowValues = form.getFieldValue(record?.formPath) || {};

    const detailMap = {
      executor: {
        title: `${record?.ownerLabel || "Owner"} Executor`,
        width: 900,
        question: "Number of Executors",
        component: <ExecutorDetailsModal />,
      },
      estatePlanning: {
        title: `${record?.ownerLabel || "Owner"} Estate Planning`,
        width: 760,
        component: <EstatePlanningDescriptionModal />,
      },
    };

    setDetailModalOpen(true);
    setDetailModalData({
      parentForm: form,
      fieldPath: record?.formPath,
      initialValues: rowValues,
      closeModal: () => {
        setDetailModalOpen(false);
        setEditing(true);
      },
      ...(detailMap[type] || {}),
    });
  };

  const columns = [
    {
      title: "Owner",
      dataIndex: "ownerLabel",
      key: "ownerLabel",
      editable: false,
    },
    {
      title: "Year Set Up",
      dataIndex: "yearSetUp",
      key: "yearSetUp",
      field: "yearSetUp",
      type: "number",
      placeholder: "Enter Year Set Up",
    },
    {
      title: "Are Your Wills Current",
      dataIndex: "willsCurrent",
      key: "willsCurrent",
      field: "willsCurrent",
      type: "yesNoSwitch",
      renderView: ({ value }) => value || "No",
    },
    {
      title: "Executor",
      dataIndex: "executorDisplay",
      key: "executorDisplay",
      field: "executorDisplay",
      type: "input-action",
      disabled: true,
      placeholder: "Executor",
      action: {
        name: "Open Executor",
        onClick: ({ record }) => openInnerModal("executor", record),
      },
    },
    {
      title: "Enduring Guardianship",
      dataIndex: "enduringGuardianship",
      key: "enduringGuardianship",
      field: "enduringGuardianship",
      type: "yesNoSwitch",
      renderView: ({ value }) => value || "No",
    },
    {
      title: "Testamentary Trust",
      dataIndex: "testamentaryTrust",
      key: "testamentaryTrust",
      field: "testamentaryTrust",
      type: "yesNoSwitch",
      renderView: ({ value }) => value || "No",
    },
    {
      title: "Estate Planning Requirements",
      dataIndex: "estatePlanningRadio",
      key: "estatePlanningRadio",
      field: "estatePlanningRadio",
      type: "yesNoSwitchWithButton",
      action: {
        name: "Open Estate Planning",
        onClick: ({ record }) => openInnerModal("estatePlanning", record),
      },
      renderView: ({ value, record }) => (
        <SwitchPopupDisplay
          value={value}
          onClick={() => openInnerModal("estatePlanning", record)}
        />
      ),
    },
  ];

  const handleOwnerChange = (values) => {
    const nextValues = Array.isArray(values) ? values.filter(Boolean) : [];

    if (nextValues.includes("together")) {
      form.setFieldValue("owner", ["together"]);
      return;
    }

    form.setFieldValue(
      "owner",
      allowPartner
        ? nextValues
        : nextValues.filter((value) => value === "client"),
    );
  };

  const handleFinish = async (values) => {
    const formValues = form.getFieldsValue(true);
    const sourceValues = {
      ...formValues,
      ...values,
      client: {
        ...(formValues?.client || {}),
        ...(values?.client || {}),
      },
      partner: {
        ...(formValues?.partner || {}),
        ...(values?.partner || {}),
      },
    };

    const owner = Array.isArray(sourceValues.owner) ? sourceValues.owner : [];
    const togetherSelected = allowPartner && owner.includes("together");
    const clientSelected = owner.includes("client") || togetherSelected;
    const partnerSelected =
      allowPartner && (owner.includes("partner") || togetherSelected);

    const clientPayload = clientSelected
      ? buildPayloadPerson(sourceValues?.client, sectionData?.client || {})
      : {};
    const partnerSource = togetherSelected
      ? sourceValues?.client
      : sourceValues?.partner;
    const partnerPayload = partnerSelected
      ? buildPayloadPerson(partnerSource, sectionData?.partner || {})
      : {};

    const payload = {
      ...sectionData,
      owner,
      clientFK:
        sectionData?.clientFK ||
        discoveryData?.personalDetails?._id ||
        discoveryData?.personaldetails?._id ||
        undefined,
      client: clientPayload,
      partner: partnerPayload,
      clientTotal: clientSelected ? "Yes" : "No",
      partnerTotal: allowPartner ? (partnerSelected ? "Yes" : "No") : "",
    };

    try {
      setSaving(true);

      const saved = sectionData?.clientFK
        ? await patch("/api/will/Update", payload)
        : await post("/api/will/Add", payload);

      setDiscoveryData((prev) => ({
        ...(prev && typeof prev === "object" ? prev : {}),
        [modalData.key]: saved || payload,
      }));

      message.success(`${modalData?.title || "Wills"} updated successfully`);
      modalData?.closeModal?.();
    } catch (error) {
      message.error(
        error?.response?.data?.message ||
          error?.message ||
          `Failed to update ${modalData?.title || "Wills"}`,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: "16px 4px 0px 4px" }}>
      <AppModal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={detailModalData?.title}
        width={detailModalData?.width || 900}
      >
        {renderModalContent(detailModalData)}
      </AppModal>

      <Form
        form={form}
        initialValues={initialValues}
        onFinish={handleFinish}
        requiredMark={false}
        colon={false}
        styles={{
          label: {
            fontWeight: "600",
            fontSize: "13px",
            fontFamily: "Arial, serif",
          },
        }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={7}>
            <Form.Item label="Owner" name="owner" style={{ marginBottom: 0 }}>
              <Select
                mode="multiple"
                placeholder="Select owner"
                options={ownerOptions}
                onChange={handleOwnerChange}
                disabled={!editing}
                optionFilterProp="label"
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>
          {rows.length > 0 ? (
            <Col xs={24}>
              <EditableDynamicTable
                form={form}
                editing={editing}
                columns={columns}
                data={rows}
                tableProps={TABLE_PROPS}
              />
            </Col>
          ) : null}
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
                {!editing ? (
                  <>
                    <Button onClick={() => modalData?.closeModal?.()}>
                      Cancel
                    </Button>
                    <Button
                      key={"edit"}
                      type="primary"
                      onClick={() => setEditing(true)}
                    >
                      Edit <RiEdit2Fill />
                    </Button>
                  </>
                ) : (
                  <Button
                    key={"save"}
                    type="primary"
                    htmlType="submit"
                    loading={saving}
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
}
