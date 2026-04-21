import { Button, Form, Space } from "antd";
import React, { useEffect, useMemo, useState } from "react";
import EditableDynamicTable from "../../../../../../Common/EditableDynamicTable.jsx";
import { formatNumber, toCommaAndDollar } from "../../../../../../../hooks/helpers.js";
// import { formatNumber, toCommaAndDollar } from "../../../../../../../hooks/helpers.js";

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

function normalizeEntry(entry = {}) {
  return {
    councilRates: entry?.councilRates || "",
    waterRates: entry?.waterRates || "",
    landTax: entry?.landTax || "",
    insuranceCorporate: entry?.insuranceCorporate || "",
    repairsMaintenance: entry?.repairsMaintenance || "",
    allOther: entry?.allOther || "",
    totalExpance: entry?.totalExpance || "",
  };
}

function hasMeaningfulValues(initialValues = {}) {
  const row = initialValues?.expenseRows?.[0] || {};
  return [
    row?.councilRates,
    row?.waterRates,
    row?.landTax,
    row?.insuranceCorporate,
    row?.repairsMaintenance,
    row?.allOther,
    row?.totalExpance,
  ].some((value) => String(value ?? "").trim() !== "");
}

function computeTotal(entry) {
  const parts = [
    entry.councilRates,
    entry.waterRates,
    entry.landTax,
    entry.insuranceCorporate,
    entry.repairsMaintenance,
    entry.allOther,
  ].map((v) => parseCurrencyValue(v) || 0);

  return parts.reduce((a, b) => a + b, 0);
}

function updateTotal(record, currentForm) {
  const row = currentForm.getFieldValue([...record.formPath]) || {};
  const entry = normalizeEntry(row);
  const total = computeTotal(entry);
  currentForm.setFieldValue([...record.formPath, "totalExpance"], toCommaAndDollar(total));
}

export default function InvestmentPropertyExpenseModal({
  modalData,
  open,
  onClose,
  editing,
  valueArray,
  onSave,
  title = "Expense Details",
}) {
  const resolvedValueArray = modalData?.valueArray ?? valueArray ?? [];
  const resolvedOnSave = modalData?.onSave ?? onSave;
  const resolvedOnClose = modalData?.closeModal ?? onClose;

  const [form] = Form.useForm();
  const [localEditing, setLocalEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const initialValues = useMemo(() => {
    const first =
      Array.isArray(resolvedValueArray) && resolvedValueArray.length
        ? resolvedValueArray[0]
        : {};
    return {
      expenseRows: [normalizeEntry(first)],
    };
  }, [resolvedValueArray]);

  useEffect(() => {
    form.setFieldsValue(initialValues);
    setLocalEditing(!hasMeaningfulValues(initialValues));
    // ensure total is set on open if missing
    const entry = normalizeEntry(form.getFieldValue(["expenseRows", 0]) || {});
    if (!entry.totalExpance) {
      form.setFieldValue(["expenseRows", 0, "totalExpance"], toCommaAndDollar(computeTotal(entry)));
    }
  }, [form, initialValues]);

  const columns = useMemo(
    () => [
      {
        title: "Council Rates",
        dataIndex: "councilRates",
        key: "councilRates",
        field: "councilRates",
        type: "text",
        placeholder: "Council Rates",
        onChange: (value, record, column, currentForm) => {
          currentForm.setFieldValue(
            [...record.formPath, column.field],
            formatNumericInput(value, { currency: true }),
          );
          updateTotal(record, currentForm);
        },
      },
      {
        title: "Water Rates",
        dataIndex: "waterRates",
        key: "waterRates",
        field: "waterRates",
        type: "text",
        placeholder: "Water Rates",
        onChange: (value, record, column, currentForm) => {
          currentForm.setFieldValue(
            [...record.formPath, column.field],
            formatNumericInput(value, { currency: true }),
          );
          updateTotal(record, currentForm);
        },
      },
      {
        title: "Land tax",
        dataIndex: "landTax",
        key: "landTax",
        field: "landTax",
        type: "text",
        placeholder: "Land tax",
        onChange: (value, record, column, currentForm) => {
          currentForm.setFieldValue(
            [...record.formPath, column.field],
            formatNumericInput(value, { currency: true }),
          );
          updateTotal(record, currentForm);
        },
      },
      {
        title: "Insurance/Body Corporate",
        dataIndex: "insuranceCorporate",
        key: "insuranceCorporate",
        field: "insuranceCorporate",
        type: "text",
        placeholder: "Insurance/Body Corporate",
        onChange: (value, record, column, currentForm) => {
          currentForm.setFieldValue(
            [...record.formPath, column.field],
            formatNumericInput(value, { currency: true }),
          );
          updateTotal(record, currentForm);
        },
      },
      {
        title: "Repairs and Maintenance",
        dataIndex: "repairsMaintenance",
        key: "repairsMaintenance",
        field: "repairsMaintenance",
        type: "text",
        placeholder: "Repairs and Maintenance",
        onChange: (value, record, column, currentForm) => {
          currentForm.setFieldValue(
            [...record.formPath, column.field],
            formatNumericInput(value, { currency: true }),
          );
          updateTotal(record, currentForm);
        },
      },
      {
        title: "All Other",
        dataIndex: "allOther",
        key: "allOther",
        field: "allOther",
        type: "text",
        placeholder: "All Other",
        onChange: (value, record, column, currentForm) => {
          currentForm.setFieldValue(
            [...record.formPath, column.field],
            formatNumericInput(value, { currency: true }),
          );
          updateTotal(record, currentForm);
        },
      },
      {
        title: "Total Expenses",
        dataIndex: "totalExpance",
        key: "totalExpance",
        field: "totalExpance",
        type: "text",
        placeholder: "Total Expenses",
        disabled: true,
        editable: true,
      },
    ],
    [],
  );

  const rows = useMemo(
    () => [
      {
        key: "expenseRow0",
        formPath: ["expenseRows", 0],
        ...(form.getFieldValue(["expenseRows", 0]) || initialValues.expenseRows[0]),
      },
    ],
    [form, initialValues.expenseRows],
  );

  const handleOk = async () => {
    try {
      setSaving(true);
      const values = await form.validateFields();
      const entry = normalizeEntry(values?.expenseRows?.[0] || {});
      const total = parseCurrencyValue(entry.totalExpance) ?? computeTotal(entry);
      resolvedOnSave?.({
        array: [{ ...entry, totalExpance: toCommaAndDollar(total) }],
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

