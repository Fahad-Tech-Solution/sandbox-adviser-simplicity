import { Button, Col, Form, message, Row, Select, Space } from "antd";
import { useAtomValue, useSetAtom } from "jotai";
import React, { useEffect, useMemo, useState } from "react";
import EditableDynamicTable from "../../../../../../Common/EditableDynamicTable.jsx";
import { RiEdit2Fill } from "react-icons/ri";
import { discoveryDataAtom } from "../../../../../../../store/authState.js";
import {
  formatNumber,
  toCommaAndDollar,
} from "../../../../../../../hooks/helpers.js";
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

const PAYMENT_TYPE_OPTIONS = [
  { value: "Age Pension", label: "Age Pension" },
  { value: "Disability Pension", label: "Disability Pension" },
  { value: "Carer Payment", label: "Carer Payment" },
  { value: "Carer Allowance", label: "Carer Allowance" },
  { value: "Jobseeker", label: "Jobseeker" },
  { value: "Family Tax Benefit A", label: "Family Tax Benefit A" },
  { value: "Family Tax Benefit B", label: "Family Tax Benefit B" },
  { value: "Rent Assistance", label: "Rent Assistance" },
];

const CONCESSION_CARD_OPTIONS = [
  { value: "Pensioner Card", label: "Pensioner Card" },
  { value: "Low Income Card", label: "Low Income Card" },
  { value: "Commonwealth Seniors Card", label: "Commonwealth Seniors Card" },
];

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

function setAnnualPayment(record, currentForm) {
  const fortnightly = parseCurrencyValue(
    currentForm.getFieldValue([record.formPath, "fortnightlyPayment"]),
  );

  if (fortnightly === undefined) {
    currentForm.setFieldValue([record.formPath, "annualPaymentAmount"], "");
    return;
  }

  currentForm.setFieldValue(
    [record.formPath, "annualPaymentAmount"],
    formatCurrencyValue(fortnightly * 26),
  );
}

function buildInitialPerson(person = {}, totalValue = "") {
  const fortnightlyPayment = formatCurrencyValue(person?.fortnightlyPayment);
  const annualPaymentAmount = formatCurrencyValue(
    person?.annualPaymentAmount ||
      totalValue ||
      (parseCurrencyValue(fortnightlyPayment) || 0) * 26,
  );

  return {
    CRN: person?.CRN || "",
    paymentType: Array.isArray(person?.paymentType) ? person.paymentType : [],
    fortnightlyPayment,
    annualPaymentAmount,
    centrelinkCardsHeld: Array.isArray(person?.centrelinkCardsHeld)
      ? person.centrelinkCardsHeld
      : [],
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

export default function CentrelinkModal({ modalData }) {
  const [form] = Form.useForm();
  const ownerOptions = useOwnerOptions();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const { post, patch } = useApi();

  const discoveryData = useAtomValue(discoveryDataAtom);
  const setDiscoveryData = useSetAtom(discoveryDataAtom);

  const CENTRELINK_COLUMNS = [
    { title: "Owner", key: "owner", kind: "owner", width: 80 },
    {
      title: "CRN",
      dataIndex: "CRN",
      key: "CRN",
      field: "CRN",
      type: "text",
      placeholder: "CRN",
    },
    {
      title: "Payment Type",
      dataIndex: "paymentType",
      key: "paymentType",
      field: "paymentType",
      type: "multiselect",
      placeholder: "Payment Type",
      options: PAYMENT_TYPE_OPTIONS,
    },
    {
      title: "Fortnightly Payment",
      dataIndex: "fortnightlyPayment",
      key: "fortnightlyPayment",
      field: "fortnightlyPayment",
      type: "text",
      placeholder: "Fortnightly Payment",
      onChange: (value, record, column, currentForm) => {
        currentForm.setFieldValue(
          [record.formPath, column.field],
          formatNumericInput(value, { currency: true }),
        );
        setAnnualPayment(record, currentForm);
      },
    },
    {
      title: "Annual Payment",
      dataIndex: "annualPaymentAmount",
      key: "annualPaymentAmount",
      field: "annualPaymentAmount",
      type: "text",
      placeholder: "Annual Payment Amount",
      disabled: true,
      editable: true,
    },
    {
      title: "Concession Cards",
      dataIndex: "centrelinkCardsHeld",
      key: "centrelinkCardsHeld",
      field: "centrelinkCardsHeld",
      type: "multiselect",
      placeholder: "Concession Cards",
      options: CONCESSION_CARD_OPTIONS,
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
      CENTRELINK_COLUMNS.map((column) =>
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
          CRN: form.getFieldValue([owner, "CRN"]),
          paymentType: form.getFieldValue([owner, "paymentType"]),
          fortnightlyPayment: form.getFieldValue([owner, "fortnightlyPayment"]),
          annualPaymentAmount: form.getFieldValue([
            owner,
            "annualPaymentAmount",
          ]),
          centrelinkCardsHeld: form.getFieldValue([
            owner,
            "centrelinkCardsHeld",
          ]),
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
            CRN: sourceValues?.client?.CRN || "",
            paymentType: Array.isArray(sourceValues?.client?.paymentType)
              ? sourceValues.client.paymentType
              : [],
            fortnightlyPayment: formatCurrencyValue(
              sourceValues?.client?.fortnightlyPayment,
            ),
            annualPaymentAmount: formatCurrencyValue(
              sourceValues?.client?.annualPaymentAmount,
            ),
            centrelinkCardsHeld: Array.isArray(
              sourceValues?.client?.centrelinkCardsHeld,
            )
              ? sourceValues.client.centrelinkCardsHeld
              : [],
          }
        : {},
      partner: partnerSelected
        ? {
            ...(sectionData?.partner || {}),
            CRN: sourceValues?.partner?.CRN || "",
            paymentType: Array.isArray(sourceValues?.partner?.paymentType)
              ? sourceValues.partner.paymentType
              : [],
            fortnightlyPayment: formatCurrencyValue(
              sourceValues?.partner?.fortnightlyPayment,
            ),
            annualPaymentAmount: formatCurrencyValue(
              sourceValues?.partner?.annualPaymentAmount,
            ),
            centrelinkCardsHeld: Array.isArray(
              sourceValues?.partner?.centrelinkCardsHeld,
            )
              ? sourceValues.partner.centrelinkCardsHeld
              : [],
          }
        : {},
      clientTotal: clientSelected
        ? formatCurrencyValue(sourceValues?.client?.annualPaymentAmount)
        : "",
      partnerTotal: partnerSelected
        ? formatCurrencyValue(sourceValues?.partner?.annualPaymentAmount)
        : "",
    };

    try {
      setSaving(true);

      const saved = sectionData?.clientFK
        ? await patch("/api/incomeFromCentrelink/Update", payload)
        : await post("/api/incomeFromCentrelink/Add", payload);

      setDiscoveryData((prev) => ({
        ...(prev && typeof prev === "object" ? prev : {}),
        [modalData.key]: saved || payload,
      }));

      message.success(
        `${modalData?.title || "Centrelink"} updated successfully`,
      );
      modalData?.closeModal?.();
    } catch (error) {
      message.error(
        error?.response?.data?.message ||
          error?.message ||
          `Failed to update ${modalData?.title || "Centrelink"}`,
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
