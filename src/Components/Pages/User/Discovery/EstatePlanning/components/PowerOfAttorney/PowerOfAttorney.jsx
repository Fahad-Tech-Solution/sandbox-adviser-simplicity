import { Button, Col, Form, message, Row, Select, Space } from "antd";
import { useAtomValue, useSetAtom } from "jotai";
import React, { useEffect, useMemo, useState } from "react";
import { RiEdit2Fill } from "react-icons/ri";
import AppModal from "../../../../../../Common/AppModal.jsx";
import EditableDynamicTable from "../../../../../../Common/EditableDynamicTable.jsx";
import { renderModalContent } from "../../../../../../Common/renderModalContent.jsx";
import { discoveryDataAtom } from "../../../../../../../store/authState";
import useApi from "../../../../../../../hooks/useApi.js";
import ExecutorDetailsModal from "../wills/ExecutorDetailsModal.jsx";

const TABLE_PROPS = {
  showCount: false,
  noPagination: true,
  horizontalScroll: true,
  tableStyle: { borderRadius: 12, overflow: "hidden" },
  headerFontSize: 11,
  bodyFontSize: 12,
};

const POA_TYPE_OPTIONS = [
  { value: "Enduring", label: "Enduring" },
  { value: "Financial & Personal", label: "Financial & Personal" },
  { value: "Medical Decision Maker", label: "Medical Decision Maker" },
  { value: "Limited", label: "Limited" },
  { value: "Other", label: "Other" },
];

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

function buildPOAPerson(person = {}) {
  const POAName = Array.isArray(person?.POAName) ? person.POAName : [];
  return {
    POAType: person?.POAType || "",
    yearSetUp: person?.yearSetUp || "",
    POAName,
    POADisplay: POAName.length ? String(POAName.length) : "",
  };
}

function buildInitialValues(sectionData = {}, allowPartner) {
  const rawOwner = Array.isArray(sectionData?.owner) ? sectionData.owner : [];
  const owner = allowPartner
    ? rawOwner
    : rawOwner.filter((value) => value === "client");

  return {
    owner,
    client: buildPOAPerson(sectionData?.client),
    partner: buildPOAPerson(sectionData?.partner),
  };
}

function buildPayloadPerson(person = {}, existing = {}) {
  return {
    ...existing,
    POAType: person?.POAType || "",
    yearSetUp: person?.yearSetUp || "",
    POAName: Array.isArray(person?.POAName) ? person.POAName : [],
  };
}

export default function PowerOfAttorney({ modalData }) {
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
        POAType: watchedClient?.POAType || "",
        yearSetUp: watchedClient?.yearSetUp || "",
        POADisplay:
          watchedClient?.POADisplay ||
          (Array.isArray(watchedClient?.POAName) && watchedClient.POAName.length
            ? String(watchedClient.POAName.length)
            : ""),
      });
    }

    if (allowPartner && selectedOwners?.includes("partner")) {
      nextRows.push({
        key: "partner",
        formPath: "partner",
        ownerLabel: partnerName,
        POAType: watchedPartner?.POAType || "",
        yearSetUp: watchedPartner?.yearSetUp || "",
        POADisplay:
          watchedPartner?.POADisplay ||
          (Array.isArray(watchedPartner?.POAName) &&
          watchedPartner.POAName.length
            ? String(watchedPartner.POAName.length)
            : ""),
      });
    }

    if (allowPartner && selectedOwners?.includes("together")) {
      nextRows.push({
        key: "together",
        formPath: "client",
        ownerLabel: `Together (${clientName} & ${partnerName})`,
        POAType: watchedClient?.POAType || "",
        yearSetUp: watchedClient?.yearSetUp || "",
        POADisplay:
          watchedClient?.POADisplay ||
          (Array.isArray(watchedClient?.POAName) && watchedClient.POAName.length
            ? String(watchedClient.POAName.length)
            : ""),
      });
    }

    return nextRows;
  }, [allowPartner, discoveryData, selectedOwners, form]);

  const openInnerModal = (record) => {
    const rowValues = form.getFieldValue(record?.formPath) || {};

    setDetailModalOpen(true);
    setDetailModalData({
      title: `${record?.ownerLabel || "Owner"} Name of POA`,
      width: 900,
      question: "Number of Power of Attorney's",
      component: <ExecutorDetailsModal />,
      arrayKey: "POAName",
      displayKey: "POADisplay",
      parentForm: form,
      fieldPath: record?.formPath,
      initialValues: rowValues,
      closeModal: () => {
        setDetailModalOpen(false);
        setEditing(true);
      },
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
      title: "POA Type",
      dataIndex: "POAType",
      key: "POAType",
      field: "POAType",
      type: "select",
      placeholder: "Select POA Type",
      options: POA_TYPE_OPTIONS,
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
      title: "Name of POA",
      dataIndex: "POADisplay",
      key: "POADisplay",
      field: "POADisplay",
      type: "input-action",
      disabled: true,
      placeholder: "Name of POA",
      action: {
        name: "Open Name of POA",
        onClick: ({ record }) => openInnerModal(record),
      },
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
        ? await patch("/api/POA/Update", payload)
        : await post("/api/POA/Add", payload);

      setDiscoveryData((prev) => ({
        ...(prev && typeof prev === "object" ? prev : {}),
        [modalData.key]: saved || payload,
      }));

      message.success(
        `${modalData?.title || "Power of Attorneys"} updated successfully`,
      );
      modalData?.closeModal?.();
    } catch (error) {
      message.error(
        error?.response?.data?.message ||
          error?.message ||
          `Failed to update ${modalData?.title || "Power of Attorneys"}`,
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
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={10}>
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
                    <Button type="primary" onClick={() => setEditing(true)}>
                      Edit <RiEdit2Fill />
                    </Button>
                  </>
                ) : (
                  <Button type="primary" htmlType="submit" loading={saving}>
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
