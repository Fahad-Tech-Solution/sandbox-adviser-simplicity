import {
  Button,
  Col,
  Divider,
  Form,
  Row,
  Select,
  Space,
  Tabs,
  message,
} from "antd";
import React, { useEffect, useMemo, useState } from "react";
import useTitleBlock from "../../../../../../../hooks/useTitleBlock";
import { discoveryDataAtom } from "../../../../../../../store/authState";
import { useAtomValue, useSetAtom } from "jotai";
import EditableDynamicTable from "../../../../../../Common/EditableDynamicTable.jsx";
import useApi from "../../../../../../../hooks/useApi.js";
import { RiEdit2Fill } from "react-icons/ri";

const TABLE_PROPS = {
  showCount: false,
  noPagination: true,
  horizontalScroll: true,
  tableStyle: { borderRadius: 12, overflow: "hidden" },
  headerFontSize: 11,
  bodyFontSize: 12,
};

const ADVISER_TYPE_OPTIONS = [
  "Accountant",
  "Insurance Adviser",
  "Doctor",
  "Lawyer/Solicitor",
  "Other",
];

function buildProfessionalAdviserEntries(selectedTypes = [], entries = []) {
  return (selectedTypes || []).map((type) => {
    const existing = (entries || []).find((item) => item?.POAType === type);
    return (
      existing || {
        POAType: type,
        adviserName: "",
        company: "",
        phone: "",
        email: "",
      }
    );
  });
}

const InnerForm = ({ form, ownerKey, editing, initialOwnerData }) => {
  const watchedOwnerData =
    Form.useWatch(["professionalAdvisers", ownerKey], form) || {};
  const storedOwnerData =
    form.getFieldValue(["professionalAdvisers", ownerKey]) ||
    watchedOwnerData ||
    initialOwnerData ||
    {};

  const selectedTypes =
    storedOwnerData?.professionalAdvisersTypes ||
    initialOwnerData?.professionalAdvisersTypes ||
    [];

  const advisers =
    storedOwnerData?.professionalAdviser ||
    initialOwnerData?.professionalAdviser ||
    [];

  const rows = useMemo(
    () =>
      buildProfessionalAdviserEntries(selectedTypes, advisers).map(
        (item, index) => ({
          key: `${ownerKey}-adviser-${item?.POAType || index}`,
          formPath: [
            "professionalAdvisers",
            ownerKey,
            "professionalAdviser",
            index,
          ],
          rowNumber: index + 1,
          ...item,
        }),
      ),
    [advisers, ownerKey, selectedTypes],
  );

  const columns = [
    {
      title: "No#",
      dataIndex: "rowNumber",
      key: "rowNumber",
      width: 60,
      editable: false,
    },
    {
      title: "Adviser Type",
      dataIndex: "POAType",
      key: "POAType",
      field: "POAType",
      type: "text",
      placeholder: "Adviser Type",
      editable: false,
      justText: true,
    },
    {
      title: "Adviser Name",
      dataIndex: "adviserName",
      key: "adviserName",
      field: "adviserName",
      type: "text",
      placeholder: "Adviser Name",
    },
    {
      title: "Company",
      dataIndex: "company",
      key: "company",
      field: "company",
      type: "text",
      placeholder: "Company",
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      field: "phone",
      type: "text",
      placeholder: "Phone",
      onChange: (value, record, column, currentForm) => {
        const nextValue = String(value?.target?.value ?? value ?? "").replace(
          /[^0-9+]+/g,
          "",
        );
        currentForm.setFieldValue(
          [...record.formPath, column.field],
          nextValue,
        );
      },
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      field: "email",
      type: "text",
      placeholder: "Email",
    },
  ];

  const handleTypeChange = (nextTypes) => {
    const selectedValues = nextTypes || [];
    const currentEntries =
      form.getFieldValue([
        "professionalAdvisers",
        ownerKey,
        "professionalAdviser",
      ]) || advisers;
    const nextEntries = buildProfessionalAdviserEntries(
      selectedValues,
      currentEntries,
    );
    form.setFieldValue(
      ["professionalAdvisers", ownerKey, "professionalAdvisersTypes"],
      selectedValues,
    );
    form.setFieldValue(
      ["professionalAdvisers", ownerKey, "professionalAdviser"],
      nextEntries,
    );
  };

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={24}>
        <Row gutter={[16, 0]}>
          <Col xs={24} md={3}>
            <div
              style={{
                fontWeight: "600",
                fontSize: "13px",
                fontFamily: "Arial, serif",
              }}
            >
              Adviser Type
            </div>
          </Col>
          <Col width={"auto"}>
            <Form.Item
              name={[
                "professionalAdvisers",
                ownerKey,
                "professionalAdvisersTypes",
              ]}
              style={{ marginBottom: 0 }}
            >
              <Select
                mode="multiple"
                allowClear
                placeholder="Select Adviser Types"
                options={ADVISER_TYPE_OPTIONS.map((type) => ({
                  value: type,
                  label: type,
                }))}
                onChange={handleTypeChange}
                optionFilterProp="label"
                style={{ width: "autp", minWidth: "150px" }}
                disabled={!editing}
              />
            </Form.Item>
          </Col>
        </Row>
      </Col>
      {selectedTypes.length > 0 ? (
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
    </Row>
  );
};

function buildInitialOwnerData(entries = []) {
  const safeEntries = Array.isArray(entries) ? entries : [];
  return {
    professionalAdvisersTypes: safeEntries
      .map((item) => item?.POAType)
      .filter(Boolean),
    professionalAdviser: safeEntries,
  };
}

function sanitizeAdvisers(entries = [], types = []) {
  return (Array.isArray(entries) ? entries : []).map((item, index) => ({
    POAType: types[index] || item?.POAType || "",
    adviserName: item?.adviserName || "",
    company: item?.company || "",
    phone: item?.phone || "",
    email: item?.email || "",
  }));
}

export default function ProfessionalAdvisers({ modalData }) {
  const headingStyle = { fontFamily: "Georgia,serif" };
  const renderTitleBlock = useTitleBlock({
    titleStyle: headingStyle,
  });
  const discoveryData = useAtomValue(discoveryDataAtom);
  const setDiscoveryData = useSetAtom(discoveryDataAtom);
  const { post, patch } = useApi();
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

  const [form] = Form.useForm();
  const sectionData = discoveryData?.[modalData?.key] || {};
  const initialValues = useMemo(
    () => ({
      professionalAdvisers: {
        client: buildInitialOwnerData(sectionData?.client),
        partner: buildInitialOwnerData(sectionData?.partner),
      },
    }),
    [sectionData],
  );

  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [form, initialValues]);

  useEffect(() => {
    setEditing(!sectionData?.clientFK);
  }, [sectionData?.clientFK]);

  const handleFinish = async (values) => {
    const formValues = form.getFieldsValue(true);
    const sourceValues = {
      ...formValues,
      ...values,
      professionalAdvisers: {
        ...(formValues?.professionalAdvisers || {}),
        ...(values?.professionalAdvisers || {}),
      },
    };


    const clientAdvisers = sanitizeAdvisers(
      sourceValues?.professionalAdvisers?.client?.professionalAdviser,
      sourceValues?.professionalAdvisers?.client?.professionalAdvisersTypes
    );

    const partnerAdvisers = allowPartner
      ? sanitizeAdvisers(
          sourceValues?.professionalAdvisers?.partner?.professionalAdviser,
          sourceValues?.professionalAdvisers?.partner?.professionalAdvisersTypes
        )
      : [];

    const payload = {
      ...sectionData,
      clientFK:
        sectionData?.clientFK ||
        discoveryData?.personalDetails?._id ||
        discoveryData?.personaldetails?._id ||
        undefined,
      client: clientAdvisers,
      partner: partnerAdvisers,
      clientTotal: clientAdvisers.length > 0 ? "Yes" : "No",
      partnerTotal: allowPartner
        ? partnerAdvisers.length > 0
          ? "Yes"
          : "No"
        : "",
    };

    try {
      setSaving(true);

      const saved = sectionData?.clientFK
        ? await patch("/api/professionalAdviser/revamp/Update", payload)
        : await post("/api/professionalAdviser/revamp/Add", payload);

      setDiscoveryData((prev) => ({
        ...(prev && typeof prev === "object" ? prev : {}),
        [modalData?.key || "professionalAdviser"]: saved || payload,
      }));

      message.success(
        `${modalData?.title || "Professional Advisers"} updated successfully`,
      );
      modalData?.closeModal?.();
    } catch (error) {
      message.error(
        error?.response?.data?.message ||
          error?.message ||
          `Failed to update ${modalData?.title || "Professional Advisers"}`,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: "0px" }}>
      <Form
        form={form}
        initialValues={initialValues}
        onFinish={handleFinish}
        requiredMark={false}
        colon={false}
        layout="vertical"
        styles={{
          label: {
            fontWeight: "600",
            fontSize: "13px",
            fontFamily: "Arial, serif",
          },
        }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} className={"px-2"}>
            {renderTitleBlock({
              title: "Professional Advisers",
              icon: "👔",
            })}
            <Divider style={{ margin: "8px 0px 0px 0px" }} />
          </Col>

          <Col xs={24}>
            <Tabs
              defaultActiveKey="client"
              
              items={[
                {
                  key: "client",
                  label: clientName,
                  children: (
                    <InnerForm
                      form={form}
                      ownerKey="client"
                      editing={editing}
                      initialOwnerData={
                        initialValues?.professionalAdvisers?.client
                      }
                    />
                  ),
                },
                ...(allowPartner
                  ? [
                      {
                        key: "partner",
                        label: partnerName,
                        children: (
                          <InnerForm
                            form={form}
                            ownerKey="partner"
                            editing={editing}
                            initialOwnerData={
                              initialValues?.professionalAdvisers?.partner
                            }
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
