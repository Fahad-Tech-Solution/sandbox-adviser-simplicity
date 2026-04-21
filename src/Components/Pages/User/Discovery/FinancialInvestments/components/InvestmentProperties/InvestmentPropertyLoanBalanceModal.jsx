import { Button, Form, Space } from "antd";
import React, { useEffect, useMemo, useState } from "react";
import EditableDynamicTable from "../../../../../../Common/EditableDynamicTable.jsx";
import { formatNumber, toCommaAndDollar } from "../../../../../../../hooks/helpers.js";

const TABLE_PROPS = {
  showCount: false,
  noPagination: true,
  horizontalScroll: true,
  tableStyle: { borderRadius: 12, overflow: "hidden" },
  headerFontSize: 11,
  bodyFontSize: 12,
};

const LOAN_TYPE_OPTIONS = [
  { value: "i/only", label: "i/only" },
  { value: "P&I", label: "P&I" },
];

const FREQUENCY_OPTIONS = [
  { value: "52", label: "Weekly" },
  { value: "26", label: "Fortnightly" },
  { value: "12", label: "Monthly" },
  { value: "1", label: "Annually" },
];

const LOAN_TERM_OPTIONS = Array.from({ length: 30 }, (_, i) => ({
  value: (i + 1).toString(),
  label: `Year ${i + 1}`,
}));

function parseCurrencyValue(value) {
  if (value === null || value === undefined || value === "") return undefined;
  const numeric = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numeric) ? numeric : undefined;
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

function formatPercentValue(value, fallback = "") {
  const numeric = parsePercentValue(value);
  if (numeric === undefined) return fallback;
  const bounded = Math.min(Math.max(numeric, 0), 100);
  return `${bounded.toFixed(2)}%`;
}

function normalizeEntry(entry = {}) {
  return {
    LenderCurrent: entry?.LenderCurrent || undefined,
    LoanBalance: entry?.LoanBalance || "",
    LoanType: entry?.LoanType || undefined,
    RepaymentsAmount: entry?.RepaymentsAmount || "",
    Frequency: entry?.Frequency || undefined,
    AnnualRepayments: entry?.AnnualRepayments || "",
    InterestRate: entry?.InterestRate || "",
    LoanTerm: entry?.LoanTerm || undefined,
    LoanTermRemaining: entry?.LoanTermRemaining || undefined,
    DeductibleLoanAmount: entry?.DeductibleLoanAmount || "100.00%",
  };
}

function hasMeaningfulValues(initialValues = {}) {
  const row = initialValues?.loanRows?.[0] || {};
  return [
    row?.LenderCurrent,
    row?.LoanBalance,
    row?.LoanType,
    row?.RepaymentsAmount,
    row?.Frequency,
    row?.AnnualRepayments,
    row?.InterestRate,
    row?.LoanTerm,
    row?.LoanTermRemaining,
    row?.DeductibleLoanAmount,
  ].some((value) => String(value ?? "").trim() !== "");
}

function calculateAnnualRepayments(record, currentForm) {
  const repaymentsAmount = parseCurrencyValue(
    currentForm.getFieldValue([...record.formPath, "RepaymentsAmount"]),
  );
  const frequency = Number(
    currentForm.getFieldValue([...record.formPath, "Frequency"]) || 0,
  );

  if (repaymentsAmount === undefined || !frequency) {
    currentForm.setFieldValue([...record.formPath, "AnnualRepayments"], "");
    return;
  }

  currentForm.setFieldValue(
    [...record.formPath, "AnnualRepayments"],
    toCommaAndDollar(repaymentsAmount * frequency),
  );
}

export default function InvestmentPropertyLoanBalanceModal({
  modalData
}) {

  console.log("modalData", modalData);

  const resolvedValueArray = modalData?.valueArray ?? valueArray ?? [];
  const resolvedOnSave = modalData?.onSave ?? onSave;
  const resolvedOnClose = modalData?.closeModal ?? onClose;
  const resolvedLenderOptions = modalData?.lenderOptions ?? lenderOptions ?? [];

  const [form] = Form.useForm();
  const [localEditing, setLocalEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const initialValues = useMemo(() => {
    const first =
      Array.isArray(resolvedValueArray) && resolvedValueArray.length
        ? resolvedValueArray[0]
        : {};
    return {
      loanRows: [normalizeEntry(first)],
    };
  }, [resolvedValueArray]);

  useEffect(() => {
    form.setFieldsValue(initialValues);
    setLocalEditing(!hasMeaningfulValues(initialValues));
  }, [form, initialValues]);

  const columns = useMemo(
    () => [
      {
        title: "Lender",
        dataIndex: "LenderCurrent",
        key: "LenderCurrent",
        field: "LenderCurrent",
        type: "select",
        options: resolvedLenderOptions,
      },
      {
        title: "Loan Balance",
        dataIndex: "LoanBalance",
        key: "LoanBalance",
        field: "LoanBalance",
        type: "text",
        placeholder: "Loan Balance",
        onChange: (value, record, column, currentForm) => {
          currentForm.setFieldValue(
            [...record.formPath, column.field],
            formatNumericInput(value, { currency: true }),
          );
        },
      },
      {
        title: "Loan Type",
        dataIndex: "LoanType",
        key: "LoanType",
        field: "LoanType",
        type: "select",
        options: LOAN_TYPE_OPTIONS,
      },
      {
        title: "Repayments Amount",
        dataIndex: "RepaymentsAmount",
        key: "RepaymentsAmount",
        field: "RepaymentsAmount",
        type: "text",
        placeholder: "Repayments Amount",
        onChange: (value, record, column, currentForm) => {
          currentForm.setFieldValue(
            [...record.formPath, column.field],
            formatNumericInput(value, { currency: true }),
          );
          calculateAnnualRepayments(record, currentForm);
        },
      },
      {
        title: "Frequency",
        dataIndex: "Frequency",
        key: "Frequency",
        field: "Frequency",
        type: "select",
        options: FREQUENCY_OPTIONS,
        onChange: (_, record, __, currentForm) => {
          calculateAnnualRepayments(record, currentForm);
        },
      },
      {
        title: "Annual Repayments",
        dataIndex: "AnnualRepayments",
        key: "AnnualRepayments",
        field: "AnnualRepayments",
        type: "text",
        placeholder: "Annual Repayments",
        disabled: true,
        editable: true,
      },
      {
        title: "Interest Rate",
        dataIndex: "InterestRate",
        key: "InterestRate",
        field: "InterestRate",
        type: "text",
        placeholder: "Interest Rate",
        onChange: (value, record, column, currentForm) => {
          currentForm.setFieldValue(
            [...record.formPath, column.field],
            formatPercentValue(getChangedValue(value)),
          );
        },
      },
      {
        title: "Loan Term",
        dataIndex: "LoanTerm",
        key: "LoanTerm",
        field: "LoanTerm",
        type: "select",
        options: LOAN_TERM_OPTIONS,
      },
      {
        title: "Loan Term Remaining",
        dataIndex: "LoanTermRemaining",
        key: "LoanTermRemaining",
        field: "LoanTermRemaining",
        type: "select",
        options: LOAN_TERM_OPTIONS,
      },
      {
        title: "Deductible Loan Amount",
        dataIndex: "DeductibleLoanAmount",
        key: "DeductibleLoanAmount",
        field: "DeductibleLoanAmount",
        type: "text",
        placeholder: "Deductible Loan Amount",
        onChange: (value, record, column, currentForm) => {
          currentForm.setFieldValue(
            [...record.formPath, column.field],
            formatPercentValue(getChangedValue(value), "100.00%"),
          );
        },
      },
    ],
    [resolvedLenderOptions],
  );

  const rows = useMemo(
    () => [
      {
        key: "loanRow0",
        formPath: ["loanRows", 0],
        ...(form.getFieldValue(["loanRows", 0]) || initialValues.loanRows[0]),
      },
    ],
    [form, initialValues.loanRows],
  );

  const handleOk = async () => {
    try {
      setSaving(true);
      const values = await form.validateFields();
      const entry = normalizeEntry(values?.loanRows?.[0] || {});
      const total = parseCurrencyValue(entry.LoanBalance) || 0;
      resolvedOnSave?.({
        array: [entry],
        total: toCommaAndDollar(total),
      });
      // setLocalEditing(false);
      resolvedOnClose?.();
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (localEditing) {
      form.setFieldsValue(initialValues);
      setLocalEditing(false);
      return;
    }
    resolvedOnClose?.();
  };

  return (
    <div style={{ padding: "16px 4px 0px 4px" }}>
      <Form form={form} initialValues={initialValues} layout="vertical">
        <EditableDynamicTable
          form={form}
          editing={localEditing}
          columns={columns}
          data={rows}
          tableProps={TABLE_PROPS}
          rowPathKey="formPath"
        />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
          <Space>
            {!localEditing ? (
              <>
                <Button onClick={handleCancel} disabled={saving}>
                  Cancel
                </Button>
                <Button type="primary" onClick={() => setLocalEditing(true)} disabled={saving}>
                  Edit
                </Button>
              </>
            ) : (
              <Button type="primary" onClick={handleOk} loading={saving} disabled={saving}>
                Confirm and Exit
              </Button>
            )}
          </Space>
        </div>
      </Form>
    </div>
  );
}

