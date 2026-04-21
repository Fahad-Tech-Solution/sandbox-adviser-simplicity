


import { Button, Col, Form, message, Row, Select, Space } from "antd";
import { useAtomValue, useSetAtom } from "jotai";
import React, { useEffect, useMemo, useState } from "react";
import EditableDynamicTable from "../../../../../../Common/EditableDynamicTable.jsx";
import { RiEdit2Fill } from "react-icons/ri";
import { discoveryDataAtom } from "../../../../../../../store/authState.js";
import { formatNumber, toCommaAndDollar } from "../../../../../../../hooks/helpers.js";
import { useOwnerOptions } from "../../../../../../../hooks/useUserDashboardData.js";
import useApi from "../../../../../../../hooks/useApi.js";

const TABLE_PROPS = {
  showCount: false,
  noPagination: true,
  horizontalScroll: true,
  tableStyle: { borderRadius: 12, overflow: "hidden" },
  headerFontSize: 11,
  bodyFontSize: 12,
};

function parseCurrencyValue(value) {
  if (value === null || value === undefined || value === "") return undefined;
  const numeric = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numeric) ? numeric : undefined;
}

function formatCurrencyValue(value) {
  const numeric = parseCurrencyValue(value);
  return numeric ? toCommaAndDollar(numeric) : "";
}

function parseDigitsValue(value) {
  return String(value ?? "").replace(/[^0-9]/g, "");
}

function getChangedValue(value) {
  return value?.target?.value ?? value;
}

function formatNumericInput(value, { currency = false } = {}) {
  const digits = parseDigitsValue(getChangedValue(value));

  if (!digits) return "";

  return currency ? toCommaAndDollar(digits) : formatNumber(Number(digits));
}

function parsePercentValue(value) {
  if (value === null || value === undefined || value === "") return undefined;
  const numeric = Number(String(value).replace(/[^0-9.]/g, ""));
  return Number.isFinite(numeric) ? numeric : undefined;
}

function formatPercentValue(value) {
  const numeric = parsePercentValue(value);
  if (numeric === undefined) return "";
  const bounded = Math.min(Math.max(numeric, 0), 100);
  return `${bounded}%`;
}

function Formula(record, currentForm) {
  const totalValue = parseCurrencyValue(
    currentForm.getFieldValue([record.formPath, "totalNetPartnershipIncome"]),
  );
  const sharePercent = parsePercentValue(
    currentForm.getFieldValue([record.formPath, "shareOfPartnership"]),
  );

  if (totalValue === undefined || sharePercent === undefined) {
    currentForm.setFieldValue([record.formPath, "share"], "");
    return;
  }

  const calculatedShare = (totalValue * sharePercent) / 100;
  currentForm.setFieldValue(
    [record.formPath, "share"],
    formatCurrencyValue(calculatedShare),
  );
}

function buildInitialPerson(person = {}, totalValue = "") {
  return {
    businessName: person?.businessName || "",
    ABN: person?.ABN || undefined,
    businessAddress: person?.businessAddress || "",
    postCode: person?.postCode || "",
    totalNetPartnershipIncome: formatCurrencyValue(
      person?.totalNetPartnershipIncome || totalValue,
    ),
    shareOfPartnership: formatPercentValue(person?.shareOfPartnership),
    share: formatCurrencyValue(person?.share),
    goodWill: formatCurrencyValue(person?.goodWill),
  };
}

function buildInitialValues(sectionData, allowPartner) {
  const rawOwner = Array.isArray(sectionData?.owner) ? sectionData.owner : [];
  const owner = allowPartner
    ? rawOwner
    : rawOwner.filter((value) => value === "client");

  return {
    owner,
    client: buildInitialPerson(sectionData?.client, sectionData?.clientTotal),
    partner: buildInitialPerson(
      sectionData?.partner,
      sectionData?.partnerTotal,
    ),
  };
}

export default function PartnershipModal({ modalData }) {
  console.log("modalData", modalData);
  const [form] = Form.useForm();
  const ownerOptions = useOwnerOptions();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const { post, patch } = useApi();

  const discoveryData = useAtomValue(discoveryDataAtom);
  const setDiscoveryData = useSetAtom(discoveryDataAtom);

  const PARTNERSHIP_COLUMNS = [
    { title: "Owner", key: "owner", kind: "owner", width: 80 },
    {
      title: "Business Name",
      dataIndex: "businessName",
      key: "businessName",
      field: "businessName",
      type: "text",
      placeholder: "Business Name",
    },
    {
      title: "ABN",
      dataIndex: "ABN",
      key: "ABN",
      field: "ABN",
      type: "number",
      placeholder: "ABN",
    },
    {
      title: "Business Address",
      dataIndex: "businessAddress",
      key: "businessAddress",
      field: "businessAddress",
      type: "textarea",
      placeholder: "Business Address",
    },
    {
      title: "Postcode/Suburb",
      dataIndex: "postCode",
      key: "postCode",
      field: "postCode",
      type: "postalcode-search",
      placeholder: "Postcode/Suburb",
    },
    {
      title: "Total Net Partnership Income",
      dataIndex: "totalNetPartnershipIncome",
      key: "totalNetPartnershipIncome",
      field: "totalNetPartnershipIncome",
      type: "text",
      placeholder: "Total Net Partnership Income",
      onChange: (value, record, column, currentForm) => {
        currentForm.setFieldValue(
          [record.formPath, column.field],
          formatNumericInput(value, { currency: true }),
        );
        Formula(record, currentForm);
      },
    },
    {
      title: "Share Of Partnership (%)",
      dataIndex: "shareOfPartnership",
      key: "shareOfPartnership",
      field: "shareOfPartnership",
      type: "text",
      placeholder: "Share Of Partnership",
      onChange: (value, record, column, currentForm) => {
        currentForm.setFieldValue(
          [record.formPath, column.field],
          formatPercentValue(getChangedValue(value)),
        );
        Formula(record, currentForm);
      },
    },
    {
      title: "Share Amount",
      dataIndex: "share",
      key: "share",
      field: "share",
      type: "text",
      placeholder: "Share",
      disabled: true,
      editable: true,
      onChange: (value, record, column, currentForm) => {
        currentForm.setFieldValue(
          [record.formPath, column.field],
          formatNumericInput(value, { currency: true }),
        );
      },
    },
    {
      title: "Goodwill/Business Valuation",
      dataIndex: "goodWill",
      key: "goodWill",
      field: "goodWill",
      type: "text",
      placeholder: "GoodWill Business Valuation",
      onChange: (value, record, column, currentForm) => {
        currentForm.setFieldValue(
          [record.formPath, column.field],
          formatNumericInput(value, { currency: true }),
        );
      },
    },
  ];

  const sectionData = discoveryData?.[modalData?.key] || {};
  const allowPartner = !["Single", "Widowed"].includes(
    discoveryData?.personalDetails?.client?.clientMaritalStatus,
  );

  const availableOwnerOptions = useMemo(
    () =>
      allowPartner
        ? ownerOptions
        : ownerOptions.filter((option) => option.value === "client"),
    [allowPartner, ownerOptions],
  );
  const initialValues = useMemo(
    () => buildInitialValues(sectionData, allowPartner),
    [allowPartner, sectionData],
  );
  const selectedOwners = Form.useWatch("owner", form) || initialValues.owner;
  const tableColumns = useMemo(
    () =>
      PARTNERSHIP_COLUMNS.map((column) =>
        column.kind === "owner"
          ? {
              ...column,
              dataIndex: "ownerLabel",
              editable: false,
            }
          : column,
      ),
    [],
  );
  const rows = useMemo(
    () =>
      (selectedOwners || [])
        .filter((owner) => allowPartner || owner === "client")
        .map((owner) => ({
          key: owner,
          formPath: owner,
          ownerLabel:
            availableOwnerOptions.find((option) => option.value === owner)
              ?.label || owner,
          businessName: form.getFieldValue([owner, "businessName"]),
          ABN: form.getFieldValue([owner, "ABN"]),
          businessAddress: form.getFieldValue([owner, "businessAddress"]),
          postCode: form.getFieldValue([owner, "postCode"]),
          totalNetPartnershipIncome: form.getFieldValue([
            owner,
            "totalNetPartnershipIncome",
          ]),
          shareOfPartnership: form.getFieldValue([owner, "shareOfPartnership"]),
          share: form.getFieldValue([owner, "share"]),
          goodWill: form.getFieldValue([owner, "goodWill"]),
        })),
    [allowPartner, availableOwnerOptions, form, selectedOwners],
  );

  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [form, initialValues]);

  useEffect(() => {
    if (!allowPartner && selectedOwners?.includes("partner")) {
      form.setFieldValue(
        "owner",
        selectedOwners.filter((owner) => owner === "client"),
      );
    }
  }, [allowPartner, form, selectedOwners]);

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
    const clientSelected = owner.includes("client");
    const partnerSelected = allowPartner && owner.includes("partner");

    const payload = {
      ...sectionData,
      owner,
      clientFK:
        sectionData?.clientFK ||
        discoveryData?.personalDetails?._id ||
        undefined,
      client: clientSelected
        ? {
            ...(sectionData?.client || {}),
            businessName: sourceValues?.client?.businessName || "",
            ABN: sourceValues?.client?.ABN || "",
            businessAddress: sourceValues?.client?.businessAddress || "",
            postCode: sourceValues?.client?.postCode || "",
            totalNetPartnershipIncome: formatCurrencyValue(
              sourceValues?.client?.totalNetPartnershipIncome,
            ),
            shareOfPartnership: formatPercentValue(
              sourceValues?.client?.shareOfPartnership,
            ),
            share: formatCurrencyValue(sourceValues?.client?.share),
            goodWill: formatCurrencyValue(sourceValues?.client?.goodWill),
          }
        : {},
      partner: partnerSelected
        ? {
            ...(sectionData?.partner || {}),
            businessName: sourceValues?.partner?.businessName || "",
            ABN: sourceValues?.partner?.ABN || "",
            businessAddress: sourceValues?.partner?.businessAddress || "",
            postCode: sourceValues?.partner?.postCode || "",
            totalNetPartnershipIncome: formatCurrencyValue(
              sourceValues?.partner?.totalNetPartnershipIncome,
            ),
            shareOfPartnership: formatPercentValue(
              sourceValues?.partner?.shareOfPartnership,
            ),
            share: formatCurrencyValue(sourceValues?.partner?.share),
            goodWill: formatCurrencyValue(sourceValues?.partner?.goodWill),
          }
        : {},
      clientTotal: clientSelected
        ? formatCurrencyValue(sourceValues?.client?.share)
        : "",
      partnerTotal: partnerSelected
        ? formatCurrencyValue(sourceValues?.partner?.share)
        : "",
    };

    try {
      setSaving(true);

      const saved = sectionData?.clientFK
        ? await patch("/api/incomeFromPartnership/Update", payload)
        : await post("/api/incomeFromPartnership/Add", payload);

      setDiscoveryData((prev) => ({
        ...(prev && typeof prev === "object" ? prev : {}),
        [modalData.key]: saved || payload,
      }));

      message.success(
        `${modalData?.title || "Partnership"} updated successfully`,
      );
      modalData?.closeModal?.();
    } catch (error) {
      message.error(
        error?.response?.data?.message ||
          error?.message ||
          `Failed to update ${modalData?.title || "Partnership"}`,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: "16px 4px 0px 4px" }}>
      <Form
        form={form}
        initialValues={initialValues}
        onFinish={handleFinish}
        styles={{
          label: {
            fontWeight: "600",
            fontSize: "13px",
            fontFamily: "Arial, serif",
          },
        }}
        colon={false}
        requiredMark={false}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Form.Item
              label="Owner"
              name="owner"
              style={{ marginBottom: 0 }}
              rules={[{ required: true, message: "Owner is required" }]}
            >
              <Select
                options={availableOwnerOptions}
                mode="multiple"
                placeholder="Select owner"
                style={{ width: "100%" }}
                styles={{
                  items: {
                    fontSize: "11px",
                  },
                }}
                disabled={!editing}
              />
            </Form.Item>
          </Col>

          <Col xs={24}>
            <EditableDynamicTable
              form={form}
              editing={editing}
              columns={tableColumns}
              data={rows}
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
                    key={"edit"}
                    onClick={() => setEditing(true)}
                  >
                    Edit <RiEdit2Fill />
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    htmlType="submit"
                    key={"save"}
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
}
