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

const FREQUENCY_OPTIONS = [
  { value: "Fortnightly", label: "Fortnightly" },
  { value: "Monthly", label: "Monthly" },

];

const FREQUENCY_MULTIPLIERS = {
  Fortnightly: 26,
  Monthly: 12,

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

function calculateAnnualRepayments(record, currentForm) {
  const frequency = currentForm.getFieldValue([record.formPath, "frequency"]);
  const regularPayment = parseCurrencyValue(
    currentForm.getFieldValue([record.formPath, "regularPayment"]),
  );
  const multiplier = FREQUENCY_MULTIPLIERS[frequency] || 0;

  if (regularPayment === undefined || !multiplier) {
    currentForm.setFieldValue([record.formPath, "annualPayment"], "");
    return;
  }

  currentForm.setFieldValue(
    [record.formPath, "annualPayment"],
    formatCurrencyValue(regularPayment * multiplier),
  );
}

function buildInitialPerson(person = {}, totalValue = "") {
  return {
    country: person?.country || "",
    frequency: person?.frequency || undefined,
    regularPayment: formatCurrencyValue(person?.regularPayment),
    annualPayment: formatCurrencyValue(person?.annualPayment || totalValue),
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
    partner: buildInitialPerson(sectionData?.partner, sectionData?.partnerTotal),
  };
}

export default function OverseasPensionModal({ modalData }) {
  const [form] = Form.useForm();
  const ownerOptions = useOwnerOptions();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const { post, patch } = useApi();

  const discoveryData = useAtomValue(discoveryDataAtom);
  const setDiscoveryData = useSetAtom(discoveryDataAtom);
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

  const optionsFrequency = useMemo(
    () =>
      Array.isArray(modalData?.optionsFrequency) && modalData.optionsFrequency.length
        ? modalData.optionsFrequency.map((option) =>
            typeof option === "string"
              ? { value: option, label: option }
              : option,
          )
        : FREQUENCY_OPTIONS,
    [modalData?.optionsFrequency],
  );

  const OVERSEAS_PENSION_COLUMNS = [
    { title: "Owner", key: "owner", kind: "owner", width: 80},
    {
      title: "Country",
      dataIndex: "country",
      key: "country",
      field: "country",
      type: "text",
      placeholder: "Country",
    },
    {
      title: "Frequency",
      dataIndex: "frequency",
      key: "frequency",
      field: "frequency",
      type: "select",
      options: optionsFrequency,
      onChange: (_, record, __, currentForm) => {
        calculateAnnualRepayments(record, currentForm);
      },
    },
    {
      title: "Regular Payment",
      dataIndex: "regularPayment",
      key: "regularPayment",
      field: "regularPayment",
      type: "text",
      placeholder: "Regular Payment",
      onChange: (value, record, column, currentForm) => {
        currentForm.setFieldValue(
          [record.formPath, column.field],
          formatNumericInput(value, { currency: true }),
        );
        calculateAnnualRepayments(record, currentForm);
      },
    },
    {
      title: "Annual Payment",
      dataIndex: "annualPayment",
      key: "annualPayment",
      field: "annualPayment",
      type: "text",
      placeholder: "Annual Payment",
      disabled: true,
    },
  ];

  const initialValues = useMemo(
    () => buildInitialValues(sectionData, allowPartner),
    [allowPartner, sectionData],
  );
  const selectedOwners = Form.useWatch("owner", form) || initialValues.owner;

  const tableColumns = useMemo(
    () =>
      OVERSEAS_PENSION_COLUMNS.map((column) =>
        column.kind === "owner"
          ? {
              ...column,
              dataIndex: "ownerLabel",
              editable: false,
            }
          : column,
      ),
    [OVERSEAS_PENSION_COLUMNS],
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
          country: form.getFieldValue([owner, "country"]),
          frequency: form.getFieldValue([owner, "frequency"]),
          regularPayment: form.getFieldValue([owner, "regularPayment"]),
          annualPayment: form.getFieldValue([owner, "annualPayment"]),
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
            country: sourceValues?.client?.country || "",
            frequency: sourceValues?.client?.frequency || "",
            regularPayment: formatCurrencyValue(sourceValues?.client?.regularPayment),
            annualPayment: formatCurrencyValue(sourceValues?.client?.annualPayment),
          }
        : {},
      partner: partnerSelected
        ? {
            ...(sectionData?.partner || {}),
            country: sourceValues?.partner?.country || "",
            frequency: sourceValues?.partner?.frequency || "",
            regularPayment: formatCurrencyValue(sourceValues?.partner?.regularPayment),
            annualPayment: formatCurrencyValue(sourceValues?.partner?.annualPayment),
          }
        : {},
      clientTotal: clientSelected
        ? formatCurrencyValue(sourceValues?.client?.annualPayment)
        : "",
      partnerTotal: partnerSelected
        ? formatCurrencyValue(sourceValues?.partner?.annualPayment)
        : "",
    };

    try {
      setSaving(true);

      const saved = sectionData?.clientFK
        ? await patch("/api/incomeFromOverseasPension/Update", payload)
        : await post("/api/incomeFromOverseasPension/Add", payload);

      setDiscoveryData((prev) => ({
        ...(prev && typeof prev === "object" ? prev : {}),
        [modalData.key]: saved || payload,
      }));

      message.success(
        `${modalData?.title || "Overseas Pension"} updated successfully`,
      );
      modalData?.closeModal?.();
    } catch (error) {
      message.error(
        error?.response?.data?.message ||
          error?.message ||
          `Failed to update ${modalData?.title || "Overseas Pension"}`,
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
                <Button onClick={() => modalData?.closeModal?.()}>Cancel</Button>
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
