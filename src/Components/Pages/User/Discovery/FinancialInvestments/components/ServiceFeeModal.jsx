import { Button, Col, Form, Row, Space } from "antd";
import React, { useEffect, useMemo, useState } from "react";
import { RiEdit2Fill } from "react-icons/ri";
import EditableDynamicTable from "../../../../../Common/EditableDynamicTable";
import { toCommaAndDollar } from "../../../../../../hooks/helpers";

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

function calculateAnnualServiceFee(serviceFee, frequency) {
  const baseValue = parseCurrencyValue(serviceFee);
  if (!baseValue) return "";
  const annualFee =
    normalizeSelectValue(frequency) === "Monthly" ? baseValue * 12 : baseValue;
  return annualFee ? toCommaAndDollar(annualFee) : "";
}

function buildServiceFeeInitialValues(rowValues = {}) {
  const savedValues =
    rowValues?.serviceFeeArray && typeof rowValues.serviceFeeArray === "object"
      ? rowValues.serviceFeeArray
      : {};

  const serviceFee = savedValues?.serviceFee || "";
  const frequency =
    normalizeSelectValue(savedValues?.frequency) ||
    normalizeSelectValue(rowValues?.serviceFeeType);
  const annualAdviserServiceFee =
    savedValues?.annualAdviserServiceFee ||
    rowValues?.serviceFee ||
    calculateAnnualServiceFee(serviceFee, frequency);

  return {
    serviceFee,
    frequency,
    annualAdviserServiceFee,
  };
}

function hasServiceFeeValues(initialValues = {}) {
  return [
    initialValues?.serviceFee,
    initialValues?.frequency,
    initialValues?.annualAdviserServiceFee,
  ].some((value) => String(value ?? "").trim() !== "");
}

export default function ServiceFeeModal({ modalData }) {
  const [form] = Form.useForm();
  const initialValues = useMemo(
    () => buildServiceFeeInitialValues(modalData?.initialValues || {}),
    [modalData],
  );
  const [editing, setEditing] = useState(
    () => !hasServiceFeeValues(initialValues),
  );

  useEffect(() => {
    form.setFieldsValue(initialValues);
    setEditing(!hasServiceFeeValues(initialValues));
  }, [form, initialValues]);

  const rowData = useMemo(
    () => [
      {
        key: "service-fee",
        formPath: [],
        rowNumber: 1,
        serviceFee: initialValues?.serviceFee || "",
        frequency: initialValues?.frequency || "",
        annualAdviserServiceFee: initialValues?.annualAdviserServiceFee || "",
      },
    ],
    [initialValues],
  );

  const updateAnnualFee = (changedValue, record, column, currentForm) => {
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
      calculateAnnualServiceFee(nextServiceFee, nextFrequency),
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
      title: "Ongoing Fee",
      dataIndex: "serviceFee",
      key: "serviceFee",
      field: "serviceFee",
      type: "text",
      placeholder: "Ongoing Fee",
      onChange: updateAnnualFee,
    },
    {
      title: "Frequency",
      dataIndex: "frequency",
      key: "frequency",
      field: "frequency",
      type: "select",
      options: FREQUENCY_OPTIONS,
      placeholder: "Select Frequency",
      onChange: updateAnnualFee,
    },
    {
      title: "Annual Ongoing Fee",
      dataIndex: "annualAdviserServiceFee",
      key: "annualAdviserServiceFee",
      field: "annualAdviserServiceFee",
      type: "text",
      placeholder: "Annual Ongoing Fee",
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
      serviceFeeArray: savedValues,
      serviceFee: savedValues.annualAdviserServiceFee,
      serviceFeeType: savedValues.frequency,
    };

    modalData?.parentForm?.setFieldValue?.(modalData?.fieldPath, updatedRow);

    setEditing(false);
    modalData?.closeModal?.();
  };

  return (
    <div style={{ padding: "16px 4px 0px 4px" }}>
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
            <div
              style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}
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
