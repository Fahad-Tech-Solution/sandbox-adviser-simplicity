import { Button, Col, Form, Row, Select, Space } from "antd";
import React, { useEffect, useMemo, useState } from "react";
import { RiEdit2Fill } from "react-icons/ri";
import EditableDynamicTable from "../../../../../../Common/EditableDynamicTable";
import { toCommaAndDollar } from "../../../../../../../hooks/helpers";

const TABLE_PROPS = {
  showCount: false,
  noPagination: true,
  horizontalScroll: true,
  tableStyle: { borderRadius: 12, overflow: "hidden" },
  headerFontSize: 11,
  bodyFontSize: 12,
};

const FREQUENCY_OPTIONS = [
  { value: "Monthly", label: "Monthly" },
  { value: "Annualy", label: "Annually" },
];

function getValueField(modalData) {
  return modalData?.valueKey || "annualAdvice";
}

function getArrayField(modalData) {
  return modalData?.arrayKey || "annualAdviceArray";
}

function getFeeLabel(modalData) {
  return modalData?.feeLabel || "Ongoing Fee";
}

function getTotalLabel(modalData) {
  return modalData?.totalLabel || "Annual Ongoing Fee";
}

function parseCurrencyValue(value) {
  if (value === null || value === undefined || value === "") return 0;
  const numeric = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

function formatCurrencyValue(value) {
  const numeric = parseCurrencyValue(value);
  return numeric ? toCommaAndDollar(numeric) : "";
}

function normalizeSelectValue(value) {
  return value === null || value === undefined || value === ""
    ? ""
    : String(value);
}

function calculateAnnualAdvice(serviceFee, frequency) {
  const baseValue = parseCurrencyValue(serviceFee);
  if (!baseValue) return "";
  return normalizeSelectValue(frequency) === "Monthly"
    ? toCommaAndDollar(baseValue * 12)
    : toCommaAndDollar(baseValue);
}

function buildInitialValues(rowValues = {}, modalData) {
  const valueField = getValueField(modalData);
  const arrayField = getArrayField(modalData);
  const savedValues =
    rowValues?.[arrayField] && typeof rowValues[arrayField] === "object"
      ? rowValues[arrayField]
      : {};

  const serviceFee = savedValues?.serviceFee || "";
  const frequency = normalizeSelectValue(savedValues?.frequency);
  const annualAdviserServiceFee =
    savedValues?.annualAdviserServiceFee ||
    rowValues?.[valueField] ||
    calculateAnnualAdvice(serviceFee, frequency);

  return {
    serviceFee,
    frequency,
    annualAdviserServiceFee,
  };
}

function hasMeaningfulValues(initialValues = {}) {
  return [
    initialValues?.serviceFee,
    initialValues?.frequency,
    initialValues?.annualAdviserServiceFee,
  ].some((value) => String(value ?? "").trim() !== "");
}

export default function AnnualAdviceModal({ modalData }) {
  const [form] = Form.useForm();
  const valueField = getValueField(modalData);
  const arrayField = getArrayField(modalData);
  const feeLabel = getFeeLabel(modalData);
  const totalLabel = getTotalLabel(modalData);
  const initialValues = useMemo(
    () => buildInitialValues(modalData?.initialValues || {}, modalData),
    [arrayField, modalData, valueField],
  );
  const [editing, setEditing] = useState(() => !hasMeaningfulValues(initialValues));

  const serviceFee = Form.useWatch("serviceFee", form);
  const frequency = Form.useWatch("frequency", form);
  const annualAdviserServiceFee = Form.useWatch("annualAdviserServiceFee", form);

  useEffect(() => {
    form.setFieldsValue(initialValues);
    setEditing(!hasMeaningfulValues(initialValues));
  }, [form, initialValues]);

  const rowData = useMemo(
    () => [
      {
        key: "annual-advice",
        formPath: [],
        rowNumber: 1,
        serviceFee: serviceFee ?? initialValues?.serviceFee ?? "",
        frequency: frequency ?? initialValues?.frequency ?? "",
        annualAdviserServiceFee:
          annualAdviserServiceFee ?? initialValues?.annualAdviserServiceFee ?? "",
      },
    ],
    [annualAdviserServiceFee, frequency, initialValues, serviceFee],
  );

  const handleAnnualFeeChange = (changedValue, record, column, currentForm) => {
    const nextValue = changedValue?.target?.value ?? changedValue;

    if (column.field === "serviceFee") {
      currentForm.setFieldValue("serviceFee", formatCurrencyValue(nextValue));
    }

    if (column.field === "frequency") {
      currentForm.setFieldValue("frequency", normalizeSelectValue(nextValue));
    }

    const nextServiceFee =
      column.field === "serviceFee"
        ? nextValue
        : currentForm.getFieldValue("serviceFee");
    const nextFrequency =
      column.field === "frequency"
        ? nextValue
        : currentForm.getFieldValue("frequency");

    currentForm.setFieldValue(
      "annualAdviserServiceFee",
      calculateAnnualAdvice(nextServiceFee, nextFrequency),
    );
  };

  const columns = [
    {
      title: "No#",
      dataIndex: "rowNumber",
      key: "rowNumber",
      width: 60,
      editable: false,
    },
    {
      title: feeLabel,
      dataIndex: "serviceFee",
      key: "serviceFee",
      field: "serviceFee",
      type: "text",
      placeholder: feeLabel,
      width: 180,
      onChange: handleAnnualFeeChange,
    },
    {
      title: "Frequency",
      dataIndex: "frequency",
      key: "frequency",
      field: "frequency",
      type: "select",
      options: FREQUENCY_OPTIONS,
      placeholder: "Select Frequency",
      width: 180,
      onChange: handleAnnualFeeChange,
    },
    {
      title: totalLabel,
      dataIndex: "annualAdviserServiceFee",
      key: "annualAdviserServiceFee",
      field: "annualAdviserServiceFee",
      type: "text",
      placeholder: totalLabel,
      width: 200,
      disabled: true,
    },
  ];

  const handleConfirmAndExit = async () => {
    const values = await form.validateFields();
    const savedValues = {
      serviceFee: values?.serviceFee || "",
      frequency: normalizeSelectValue(values?.frequency),
      annualAdviserServiceFee: values?.annualAdviserServiceFee || "",
    };

    const currentRow =
      modalData?.parentForm?.getFieldValue?.(modalData?.fieldPath) || {};
    const updatedRow = {
      ...currentRow,
      [arrayField]: savedValues,
      [valueField]: savedValues.annualAdviserServiceFee,
    };

    modalData?.parentForm?.setFieldValue?.(modalData?.fieldPath, updatedRow);
    setEditing(false);
    modalData?.closeModal?.();
  };

  return (
    <div style={{ padding: "16px 4px" }}>
      <Form form={form} initialValues={initialValues} requiredMark={false}>
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <EditableDynamicTable
              form={form}
              editing={editing}
              columns={columns}
              data={rowData}
              tableProps={TABLE_PROPS}
            />
          </Col>
          <Col xs={24}>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <Space>
                {!editing ? (
                  <>
                    <Button onClick={() => modalData?.closeModal?.()}>Cancel</Button>
                    <Button type="primary" onClick={() => setEditing(true)}>
                      Edit <RiEdit2Fill />
                    </Button>
                  </>
                ) : (
                  <Button type="primary" onClick={handleConfirmAndExit}>
                    Confirm and Exit
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
