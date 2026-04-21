import { Alert, Button, Col, Form, Row, Space } from "antd";
import { useAtomValue } from "jotai";
import React, { useEffect, useMemo, useState } from "react";
import { RiEdit2Fill } from "react-icons/ri";
import EditableDynamicTable from "../../../../../../Common/EditableDynamicTable.jsx";
import { toCommaAndDollar } from "../../../../../../../hooks/helpers";
import {
  InvestmentOffersData,
  loggedInUser,
} from "../../../../../../../store/authState";

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
  { value: "P&i", label: "P&i" },
];

const FREQUENCY_OPTIONS = [
  { value: "52", label: "Weekly" },
  { value: "26", label: "Fortnightly" },
  { value: "12", label: "Monthly" },
  { value: "1", label: "Annually" },
];

const LOAN_TERM_OPTIONS = Array.from({ length: 30 }, (_, index) => ({
  value: String(index + 1),
  label: `Year ${index + 1}`,
}));

function getChangedValue(value) {
  return value?.target?.value ?? value;
}

function parseNumericValue(value) {
  const parsed = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrencyValue(value) {
  const numeric = parseNumericValue(getChangedValue(value));
  return numeric ? toCommaAndDollar(numeric) : "";
}

function formatPercentValue(value) {
  const digits = String(getChangedValue(value) ?? "").replace(/[^0-9]/g, "");
  if (!digits) return "";
  return `${Math.min(Number(digits), 100)}%`;
}

function normalizeSelectValue(value) {
  return value === null || value === undefined || value === ""
    ? undefined
    : String(value);
}

function buildInitialValues(initialValues = {}) {
  return {
    lender: normalizeSelectValue(initialValues?.lender),
    loanBalance: initialValues?.loanBalance || initialValues?.loanAmount || "",
    loanType: normalizeSelectValue(initialValues?.loanType),
    repaymentsAmount: initialValues?.repaymentsAmount || "",
    frequency: normalizeSelectValue(initialValues?.frequency),
    annualRepayments: initialValues?.annualRepayments || "",
    interestRatePA: initialValues?.interestRatePA || "",
    loanTerm: normalizeSelectValue(initialValues?.loanTerm),
    loanTermRemaining: normalizeSelectValue(initialValues?.loanTermRemaining),
  };
}

function getInitialValues(modalData) {
  const parentForm = modalData?.parentForm;
  const storedValues =
    parentForm?.getFieldValue?.(["HomeLoanModal"]) ||
    modalData?.initialValues ||
    {};

  return buildInitialValues(storedValues);
}

function hasMeaningfulValues(values) {
  return [
    values?.lender,
    values?.loanBalance,
    values?.loanType,
    values?.repaymentsAmount,
    values?.frequency,
    values?.annualRepayments,
    values?.interestRatePA,
    values?.loanTerm,
    values?.loanTermRemaining,
  ].some((value) => String(value ?? "").trim() !== "");
}

function calculateAnnualRepayments(repaymentsAmount, frequency) {
  const annualValue =
    parseNumericValue(repaymentsAmount) * parseNumericValue(frequency);
  return annualValue ? toCommaAndDollar(annualValue) : "";
}

function buildLenderOptions(session, investmentOffers, initialValues) {
  const institutions = investmentOffers?.FinancialInstitutions || [];
  const mappedOptions = institutions.map((item) => ({
    value: String(item?._id ?? item?.value ?? ""),
    label: item?.platformName || item?.label || item?.name || item?._id || "",
  }));

  const currentLender = normalizeSelectValue(initialValues?.lender);
  if (
    currentLender &&
    !mappedOptions.some((option) => String(option.value) === currentLender)
  ) {
    mappedOptions.unshift({ value: currentLender, label: currentLender });
  }

  return mappedOptions.filter((option) => option.value && option.label);
}

export default function HomeLoanModal({ modalData }) {
  const session = useAtomValue(loggedInUser);
  const investmentOffers = useAtomValue(InvestmentOffersData);

  const [form] = Form.useForm();
  const initialValues = useMemo(() => getInitialValues(modalData), [modalData]);
  const [editing, setEditing] = useState(
    () => !hasMeaningfulValues(initialValues),
  );

  const lender = Form.useWatch("lender", form);
  const loanBalance = Form.useWatch("loanBalance", form);
  const loanType = Form.useWatch("loanType", form);
  const repaymentsAmount = Form.useWatch("repaymentsAmount", form);
  const frequency = Form.useWatch("frequency", form);
  const annualRepayments = Form.useWatch("annualRepayments", form);
  const interestRatePA = Form.useWatch("interestRatePA", form);
  const loanTerm = Form.useWatch("loanTerm", form);
  const loanTermRemaining = Form.useWatch("loanTermRemaining", form);

  const lenderOptions = useMemo(
    () => buildLenderOptions(session, investmentOffers, initialValues),
    [initialValues, modalData, session],
  );

  useEffect(() => {
    form.setFieldsValue(initialValues);
    setEditing(!hasMeaningfulValues(initialValues));
  }, [form, initialValues]);

  const annualFormula = (changedValue, record, column, currentForm) => {
    const nextValue = getChangedValue(changedValue);

    if (column.field === "repaymentsAmount") {
      currentForm.setFieldValue(
        "repaymentsAmount",
        formatCurrencyValue(nextValue),
      );
    }

    if (column.field === "frequency") {
      currentForm.setFieldValue("frequency", normalizeSelectValue(nextValue));
    }

    const nextRepaymentsAmount =
      column.field === "repaymentsAmount"
        ? nextValue
        : currentForm.getFieldValue("repaymentsAmount");
    const nextFrequency =
      column.field === "frequency"
        ? nextValue
        : currentForm.getFieldValue("frequency");

    currentForm.setFieldValue(
      "annualRepayments",
      calculateAnnualRepayments(nextRepaymentsAmount, nextFrequency),
    );
  };

  const HOME_LOAN_COLUMNS = [
    {
      title: "Lender",
      key: "lender",
      dataIndex: "lender",
      field: "lender",
      type: "select",
      options: lenderOptions,
      placeholder: "Lender",
    },
    {
      title: "Loan Balance",
      key: "loanBalance",
      dataIndex: "loanBalance",
      field: "loanBalance",
      type: "text",
      placeholder: "Loan Balance",
      onChange: (value, record, column, currentForm) => {
        currentForm.setFieldValue(column.field, formatCurrencyValue(value));
      },
    },
    {
      title: "Loan Type",
      key: "loanType",
      dataIndex: "loanType",
      field: "loanType",
      type: "select",
      options: LOAN_TYPE_OPTIONS,
    },
    {
      title: "Repayments Amount",
      key: "repaymentsAmount",
      dataIndex: "repaymentsAmount",
      field: "repaymentsAmount",
      type: "text",
      placeholder: "Repayments Amount",
      onChange: annualFormula,
    },
    {
      title: "Frequency",
      key: "frequency",
      dataIndex: "frequency",
      field: "frequency",
      type: "select",
      options: FREQUENCY_OPTIONS,
      onChange: annualFormula,
    },
    {
      title: "Annual Repayments",
      key: "annualRepayments",
      dataIndex: "annualRepayments",
      field: "annualRepayments",
      type: "text",
      placeholder: "Annual Repayments",
      disabled: true,
    },
    {
      title: "Interest Rate (p.a)",
      key: "interestRatePA",
      dataIndex: "interestRatePA",
      field: "interestRatePA",
      type: "text",
      placeholder: "Interest Rate (p.a)",
      onChange: (value, record, column, currentForm) => {
        currentForm.setFieldValue(column.field, formatPercentValue(value));
      },
    },
    {
      title: "Loan Term",
      key: "loanTerm",
      dataIndex: "loanTerm",
      field: "loanTerm",
      type: "select",
      options: LOAN_TERM_OPTIONS,
    },
    {
      title: "Loan Term Remaining",
      key: "loanTermRemaining",
      dataIndex: "loanTermRemaining",
      field: "loanTermRemaining",
      type: "select",
      options: LOAN_TERM_OPTIONS,
    },
  ];

  const rows = useMemo(
    () => [
      {
        key: "homeLoan",
        formPath: [],
        lender: lender ?? initialValues.lender,
        loanBalance: loanBalance ?? initialValues.loanBalance,
        loanType: loanType ?? initialValues.loanType,
        repaymentsAmount: repaymentsAmount ?? initialValues.repaymentsAmount,
        frequency: frequency ?? initialValues.frequency,
        annualRepayments: annualRepayments ?? initialValues.annualRepayments,
        interestRatePA: interestRatePA ?? initialValues.interestRatePA,
        loanTerm: loanTerm ?? initialValues.loanTerm,
        loanTermRemaining: loanTermRemaining ?? initialValues.loanTermRemaining,
      },
    ],
    [
      annualRepayments,
      frequency,
      initialValues,
      interestRatePA,
      lender,
      loanBalance,
      loanTerm,
      loanTermRemaining,
      loanType,
      repaymentsAmount,
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

    modalData?.parentForm?.setFieldValue?.(["HomeLoanModal"], values);
    modalData?.parentForm?.setFieldValue?.(
      ["loanAttached"],
      values?.loanBalance ? "Yes" : "",
    );
    modalData?.parentForm?.setFieldValue?.(
      ["loanAmount"],
      formatCurrencyValue(values?.loanBalance),
    );
    modalData?.parentForm?.setFieldValue?.(
      ["annualRepayments"],
      calculateAnnualRepayments(values?.repaymentsAmount, values?.frequency),
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
              columns={HOME_LOAN_COLUMNS}
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
