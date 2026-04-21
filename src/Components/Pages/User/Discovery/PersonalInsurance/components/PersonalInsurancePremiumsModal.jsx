import { Button, Col, Form, Row, Space } from "antd";
import { useEffect, useMemo, useState } from "react";
import { RiEdit2Fill } from "react-icons/ri";
import EditableDynamicTable from "../../../../../Common/EditableDynamicTable.jsx";

const TABLE_PROPS = {
  showCount: false,
  noPagination: true,
  horizontalScroll: true,
  tableStyle: { borderRadius: 12, overflow: "hidden" },
  headerFontSize: 11,
  bodyFontSize: 12,
};

const FREQUENCY_OPTIONS = [
  { value: "12", label: "Monthly" },
  { value: "4", label: "Quarterly" },
  { value: "6", label: "Half Yearly" },
  { value: "1", label: "Yearly" },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: "Credit Card", label: "Credit Card" },
  { value: "Direct Debit", label: "Direct Debit" },
  { value: "Rollover", label: "Rollover" },
  { value: "Manual", label: "Manual" },
];

function toNumber(value) {
  return Number(String(value ?? "").replace(/[^0-9.-]+/g, "")) || 0;
}

function formatCurrencyValue(value) {
  const numeric = toNumber(value);
  if (!numeric) return "$0";
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numeric);
}

function parsePercentToNumber(value) {
  return toNumber(value);
}

function formatPercentDisplay(value) {
  const n = parsePercentToNumber(value);
  return `${Number.isFinite(n) ? n.toFixed(2) : "0.00"}%`;
}

function recalculatePremiums(form) {
  if (!form?.getFieldsValue) return;
  const v = form.getFieldsValue(true);
  const life = toNumber(v.life);
  const tpd = toNumber(v.tpd);
  const trauma = toNumber(v.trauma);
  const ip = toNumber(v.ip);
  const frequency = Number(v.frequency) || 1;
  const payee = v.payeeOfPremiums;
  const commissionRate = parsePercentToNumber(v.commissionRate);

  const totalPremiums = life + tpd + trauma + ip;
  const rolloverFactor = payee === "Super Rollover" ? 0.85 : 1;
  const totalCostRaw = totalPremiums * frequency * rolloverFactor;
  const commissionPayableRaw = totalCostRaw * (commissionRate / 100);

  const nextTotal = formatCurrencyValue(totalCostRaw);
  const nextCommission = formatCurrencyValue(commissionPayableRaw);

  if (v.totalCost !== nextTotal) {
    form.setFieldValue("totalCost", nextTotal);
  }
  if (v.commissionPayable !== nextCommission) {
    form.setFieldValue("commissionPayable", nextCommission);
  }
  if (payee === "Super Rollover" && v.paymentMethod !== "Rollover") {
    form.setFieldValue("paymentMethod", "Rollover");
  }
}

function hasMeaningfulPremiumsValues(values = {}) {
  return Object.values(values || {}).some((value) => {
    if (value === null || value === undefined || value === "") return false;
    if (value === "No") return false;
    return String(value).trim() !== "";
  });
}

function isPremiumsDetailsMissing(row) {
  const d = row?.premiumsDetails;
  if (d == null) return true;
  if (typeof d !== "object") return true;
  return Object.keys(d).length === 0;
}

export default function PersonalInsurancePremiumsModal({ modalData }) {
  const [form] = Form.useForm();
  const payeeWatch = Form.useWatch("payeeOfPremiums", form);
  const record = modalData?.record || {};
  const fieldPath = Array.isArray(record?.formPath) ? record.formPath : null;
  const ownerKey = modalData?.owner || "client";
  const ownerLabel = modalData?.ownerLabel || ownerKey;
  const currentParentRow =
    (fieldPath ? modalData?.parentForm?.getFieldValue?.(fieldPath) : null) ||
    record;

  const details = currentParentRow?.premiumsDetails || {};

  const initialValues = useMemo(() => {
    return {
      life: formatCurrencyValue(details?.life ?? "$0"),
      tpd: formatCurrencyValue(details?.tpd ?? "$0"),
      trauma: formatCurrencyValue(details?.trauma ?? "$0"),
      ip: formatCurrencyValue(details?.ip ?? "$0"),
      frequency:
        details?.frequency != null && details?.frequency !== ""
          ? String(details.frequency)
          : "1",
      payeeOfPremiums: details?.payeeOfPremiums || ownerKey,
      paymentMethod: details?.paymentMethod || undefined,
      commissionRate: formatPercentDisplay(details?.commissionRate ?? "0"),
      totalCost: formatCurrencyValue(details?.totalCost ?? "$0"),
      commissionPayable: formatCurrencyValue(
        details?.commissionPayable ?? "$0",
      ),
    };
  }, [currentParentRow, details, ownerKey]);

  const [editing, setEditing] = useState(
    () =>
      isPremiumsDetailsMissing(currentParentRow) ||
      !hasMeaningfulPremiumsValues(initialValues),
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    form.setFieldsValue(initialValues);
    setEditing(
      isPremiumsDetailsMissing(currentParentRow) ||
        !hasMeaningfulPremiumsValues(initialValues),
    );
    const timerId = window.setTimeout(() => {
      recalculatePremiums(form);
    }, 0);
    return () => window.clearTimeout(timerId);
  }, [form, initialValues, currentParentRow]);

  const formatMoneyBlur = (event, _recordValue, column, currentForm) => {
    const name = column.field;
    const raw = event?.target?.value ?? currentForm.getFieldValue(name) ?? "";
    currentForm.setFieldValue(name, formatCurrencyValue(raw));
    recalculatePremiums(currentForm);
  };

  const formatCommissionBlur = (event, _recordValue, _column, currentForm) => {
    const raw =
      event?.target?.value ?? currentForm.getFieldValue("commissionRate") ?? "";
    currentForm.setFieldValue("commissionRate", formatPercentDisplay(raw));
    recalculatePremiums(currentForm);
  };

  const onFrequencyOrPayeeChange = (
    _nextValue,
    _record,
    _column,
    currentForm,
  ) => {
    recalculatePremiums(currentForm);
  };

  const payeeOptions = useMemo(
    () => [
      { value: ownerKey, label: ownerLabel },
      { value: "Super Rollover", label: "Super Rollover" },
      { value: "SMSF", label: "SMSF" },
      { value: "Business", label: "Business" },
      { value: "Company (Pty Ltd)", label: "Company (Pty Ltd)" },
      { value: "Family Trust", label: "Family Trust" },
      { value: "Other", label: "Other" },
    ],
    [ownerKey, ownerLabel],
  );

  const columns = useMemo(
    () => [
      {
        title: "No#",
        dataIndex: "index",
        key: "index",
        render: (_, __, i) => i + 1,
        justText: true,
        width: 50,
      },
      {
        title: "Life",
        dataIndex: "life",
        key: "life",
        field: "life",
        type: "text",
        placeholder: "$0",
        onChange: formatMoneyBlur,
      },
      {
        title: "TPD",
        dataIndex: "tpd",
        key: "tpd",
        field: "tpd",
        type: "text",
        placeholder: "$0",
        onChange: formatMoneyBlur,
      },
      {
        title: "Trauma",
        dataIndex: "trauma",
        key: "trauma",
        field: "trauma",
        type: "text",
        placeholder: "$0",
        onChange: formatMoneyBlur,
      },
      {
        title: "IP",
        dataIndex: "ip",
        key: "ip",
        field: "ip",
        type: "text",
        placeholder: "$0",
        onChange: formatMoneyBlur,
      },
      {
        title: "Frequency",
        dataIndex: "frequency",
        key: "frequency",
        field: "frequency",
        type: "select",
        options: FREQUENCY_OPTIONS,
        onChange: onFrequencyOrPayeeChange,
      },
      {
        title: "Total Cost p.a",
        dataIndex: "totalCost",
        key: "totalCost",
        field: "totalCost",
        type: "text",
        placeholder: "Total Cost p.a",
        disabled: true,
      },
      {
        title: "Payee of Premiums",
        dataIndex: "payeeOfPremiums",
        key: "payeeOfPremiums",
        field: "payeeOfPremiums",
        type: "select",
        options: payeeOptions,
        onChange: onFrequencyOrPayeeChange,
      },
      {
        title: "Payment Method",
        dataIndex: "paymentMethod",
        key: "paymentMethod",
        field: "paymentMethod",
        type: "select",
        options: PAYMENT_METHOD_OPTIONS,
        disabled: payeeWatch === "Super Rollover",
      },
      {
        title: "Commission Rate",
        dataIndex: "commissionRate",
        key: "commissionRate",
        field: "commissionRate",
        type: "text",
        placeholder: "0.00%",
        onChange: formatCommissionBlur,
      },
      {
        title: "Commission Payable",
        dataIndex: "commissionPayable",
        key: "commissionPayable",
        field: "commissionPayable",
        type: "text",
        disabled: true,
        placeholder: "Commission Payable",
      },
    ],
    [payeeOptions, payeeWatch],
  );

  const data = useMemo(
    () => [
      {
        key: "premiums-row",
        index: 1,
        life: initialValues?.life ?? "",
        tpd: initialValues?.tpd ?? "",
        trauma: initialValues?.trauma ?? "",
        ip: initialValues?.ip ?? "",
        frequency: initialValues?.frequency ?? "1",
        totalCost: initialValues?.totalCost ?? "",
        payeeOfPremiums: initialValues?.payeeOfPremiums ?? ownerKey,
        paymentMethod: initialValues?.paymentMethod,
        commissionRate: initialValues?.commissionRate ?? "0.00%",
        commissionPayable: initialValues?.commissionPayable ?? "",
      },
    ],
    [initialValues, ownerKey],
  );

  const handleFinish = async () => {
    recalculatePremiums(form);
    const v = form.getFieldsValue(true);
    const normalizedDetails = {
      life: formatCurrencyValue(v.life),
      tpd: formatCurrencyValue(v.tpd),
      trauma: formatCurrencyValue(v.trauma),
      ip: formatCurrencyValue(v.ip),
      frequency: String(v.frequency ?? "1"),
      payeeOfPremiums: v.payeeOfPremiums || ownerKey,
      paymentMethod: v.paymentMethod || "",
      commissionRate: formatPercentDisplay(v.commissionRate),
      totalCost: formatCurrencyValue(v.totalCost),
      commissionPayable: formatCurrencyValue(v.commissionPayable),
    };

    try {
      setSaving(true);
      if (!fieldPath) {
        modalData?.closeModal?.();
        return;
      }
      const parentForm = modalData?.parentForm;
      parentForm?.setFieldValue?.(
        [...fieldPath, "premiumsDetails"],
        normalizedDetails,
      );
      parentForm?.setFieldValue?.(
        [...fieldPath, "premiums"],
        normalizedDetails.totalCost,
      );
      setEditing(false);
      modalData?.closeModal?.();
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (editing) {
      form.setFieldsValue(initialValues);
      recalculatePremiums(form);
      if (hasMeaningfulPremiumsValues(initialValues)) {
        setEditing(false);
        return;
      }
    }
    modalData?.closeModal?.();
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      requiredMark={false}
      style={{ paddingTop: 20 }}
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} md={24}>
          <EditableDynamicTable
            form={form}
            editing={editing}
            columns={columns}
            data={data}
            tableProps={TABLE_PROPS}
          />
        </Col>
        <Col xs={24} md={24}>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Space>
              {!editing ? (
                <>
                  <Button onClick={handleCancel}>Cancel</Button>
                  <Button
                    type="primary"
                    htmlType="button"
                    key="edit"
                    onClick={() => setEditing(true)}
                  >
                    Edit <RiEdit2Fill />
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={handleCancel}>Cancel</Button>
                  <Button
                    type="primary"
                    key="save"
                    htmlType="submit"
                    loading={saving}
                    disabled={saving}
                  >
                    Confirm and Exit
                  </Button>
                </>
              )}
            </Space>
          </div>
        </Col>
      </Row>
    </Form>
  );
}
