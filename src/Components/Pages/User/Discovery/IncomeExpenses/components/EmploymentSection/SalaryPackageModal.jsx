import { Alert, Button, Col, Form, Row, Space } from "antd";
import React, { useEffect, useMemo, useState } from "react";
import EditableDynamicTable from "../../../../../../Common/EditableDynamicTable.jsx";
import { toCommaAndDollar } from "../../../../../../../hooks/helpers";
import { RiEdit2Fill } from "react-icons/ri";

const TABLE_PROPS = {
  showCount: false,
  noPagination: true,
  horizontalScroll: true,
  tableStyle: { borderRadius: 12, overflow: "hidden" },
  headerFontSize: 11,
  bodyFontSize: 12,
};

const EMPLOYER_FBT_STATUS_OPTIONS = [
  "Full FBT",
  "Exempt (17K Cap)",
  "Exempt (30K Cap)",
  "Rebatable",
];

function parseDigitsValue(value) {
  return String(value ?? "").replace(/[^0-9]/g, "");
}

function getChangedValue(value) {
  return value?.target?.value ?? value;
}

function formatCurrencyValue(value) {
  const digits = parseDigitsValue(getChangedValue(value));
  return digits ? toCommaAndDollar(digits) : "";
}

function buildInitialValues(initialValues = {}) {
  return {
    employerFBTStatus: initialValues?.employerFBTStatus || undefined,
    creditCardMortgageRepayments:
      initialValues?.creditCardMortgageRepayments || "",
    costBaseOfCar: initialValues?.costBaseOfCar || "",
    FBTPaidByEmployer: initialValues?.FBTPaidByEmployer || undefined,
    runningCostsOfCar: initialValues?.runningCostsOfCar || "",
  };
}

function getInitialValues(modalData) {
  const ownerKey = modalData?.ownerKey;
  const parentForm = modalData?.parentForm;
  const packaging =
    ownerKey && parentForm
      ? parentForm.getFieldValue([ownerKey, "SalaryPackagingModal"]) ||
        parentForm.getFieldValue([ownerKey, "salaryPackagingModal"]) ||
        {}
      : modalData?.initialValues || {};

  return buildInitialValues(packaging);
}

function hasMeaningfulValues(values) {
  return [
    values?.employerFBTStatus,
    values?.creditCardMortgageRepayments,
    values?.costBaseOfCar,
    values?.FBTPaidByEmployer,
    values?.runningCostsOfCar,
  ].some((value) => String(value ?? "").trim() !== "");
}

const SALARY_PACKAGING_COLUMNS = [
  {
    title: "Employer FBT Status",
    key: "employerFBTStatus",
    dataIndex: "employerFBTStatus",
    field: "employerFBTStatus",
    type: "select",
    options: EMPLOYER_FBT_STATUS_OPTIONS,
    rules: [{ required: true, message: "Employer FBT Status is required" }],
    width: 190,
  },
  {
    title: "Credit Card/Mortgage Repayments",
    key: "creditCardMortgageRepayments",
    dataIndex: "creditCardMortgageRepayments",
    field: "creditCardMortgageRepayments",
    type: "text",
    width: 190,
    onChange: (value, record, column, form) => {
      form.setFieldValue([column.field], formatCurrencyValue(value));
    },
  },
  {
    title: "Cost Base of Car",
    key: "costBaseOfCar",
    dataIndex: "costBaseOfCar",
    field: "costBaseOfCar",
    type: "text",
    width: 140,
    onChange: (value, record, column, form) => {
      form.setFieldValue([column.field], formatCurrencyValue(value));
    },
  },
  {
    title: "FBT Paid By Employer",
    key: "FBTPaidByEmployer",
    dataIndex: "FBTPaidByEmployer",
    field: "FBTPaidByEmployer",
    type: "yesNoSwitch",
    width: 140,
  },
  {
    title: "Running Costs of Car",
    key: "runningCostsOfCar",
    dataIndex: "runningCostsOfCar",
    field: "runningCostsOfCar",
    type: "text",
    width: 150,
    onChange: (value, record, column, form) => {
      form.setFieldValue([column.field], formatCurrencyValue(value));
    },
  },
];

export default function SalaryPackageModal({ modalData }) {
  const [form] = Form.useForm();
  const initialValues = useMemo(
    () => getInitialValues(modalData),
    [modalData],
  );
  const [editing, setEditing] = useState(
    () => !hasMeaningfulValues(initialValues),
  );

  const employerFBTStatus = Form.useWatch("employerFBTStatus", form);
  const creditCardMortgageRepayments = Form.useWatch(
    "creditCardMortgageRepayments",
    form,
  );
  const costBaseOfCar = Form.useWatch("costBaseOfCar", form);
  const FBTPaidByEmployer = Form.useWatch("FBTPaidByEmployer", form);
  const runningCostsOfCar = Form.useWatch("runningCostsOfCar", form);

  useEffect(() => {
    form.setFieldsValue(initialValues);
    setEditing(!hasMeaningfulValues(initialValues));
  }, [form, initialValues]);

  const rows = useMemo(
    () => [
      {
        key: modalData?.ownerKey || "salaryPackaging",
        formPath: [],
        employerFBTStatus:
          employerFBTStatus ?? initialValues.employerFBTStatus,
        creditCardMortgageRepayments:
          creditCardMortgageRepayments ??
          initialValues.creditCardMortgageRepayments,
        costBaseOfCar: costBaseOfCar ?? initialValues.costBaseOfCar,
        FBTPaidByEmployer: FBTPaidByEmployer ?? initialValues.FBTPaidByEmployer,
        runningCostsOfCar: runningCostsOfCar ?? initialValues.runningCostsOfCar,
      },
    ],
    [
      FBTPaidByEmployer,
      costBaseOfCar,
      creditCardMortgageRepayments,
      employerFBTStatus,
      initialValues,
      modalData?.ownerKey,
      runningCostsOfCar,
    ],
  );

  const handleCancel = () => {
    modalData?.closeModal?.();
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleConfirmAndExit = async () => {
    const values = await form.validateFields();
    modalData?.parentForm?.setFieldValue?.(
      [modalData?.ownerKey, "SalaryPackagingModal"],
      values,
    );
    setEditing(false);
    modalData?.closeModal?.();
  };

  const validationErrors = form
    .getFieldsError()
    .filter((field) => field.errors.length > 0);

  return (
    <div style={{ padding: "16px 0px 0px 0px" }}>
      <Form form={form} initialValues={initialValues} layout="vertical">
        <Row gutter={[16, 16]}>
          {editing && validationErrors.length > 0 ? (
            <Col xs={24}>
              <Alert
                type="error"
                showIcon
                message="Validation Errors"
                description={
                  <ul style={{ marginBottom: 0, paddingLeft: 18 }}>
                    {validationErrors.map((field) => (
                      <li key={field.name.join(".")}>{field.errors[0]}</li>
                    ))}
                  </ul>
                }
              />
            </Col>
          ) : null}

          <Col xs={24}>
            <EditableDynamicTable
              form={form}
              editing={editing}
              columns={SALARY_PACKAGING_COLUMNS}
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
                {!editing ? (
                  <>
                    <Button onClick={handleCancel}>Cancel</Button>
                    <Button type="primary" onClick={handleEdit}>
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
