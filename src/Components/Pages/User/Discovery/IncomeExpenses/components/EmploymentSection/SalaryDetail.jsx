import { Button, Col, Form, Row, Space } from "antd";
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

const REMUNERATION_OPTIONS = ["Gross Salary", "Total Package"];

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

function formatPercentValue(value) {
  const digits = parseDigitsValue(getChangedValue(value));
  if (!digits) return "";
  const limited = Math.min(Number(digits), 100);
  return `${limited}%`;
}

function parseCurrencyNumber(value) {
  return Number(String(value ?? "").replace(/[^0-9.-]/g, "")) || 0;
}

function parsePercentNumber(value) {
  return Math.min(
    Number(String(value ?? "").replace(/[^0-9.-]/g, "")) || 0,
    100,
  );
}

function buildInitialValues(initialValues = {}) {
  return {
    remunerationType: initialValues?.remunerationType || "Gross Salary",
    amount: initialValues?.amount || "",
    SG: initialValues?.SG || "12%",
    grossSalary: initialValues?.grossSalary || "",
    SGC: initialValues?.SGC || "",
    salarySacrificeContributions:
      initialValues?.salarySacrificeContributions || "",
    afterTaxContributions: initialValues?.afterTaxContributions || "",
  };
}

function getInitialValues(modalData) {
  const ownerKey = modalData?.ownerKey;
  const parentForm = modalData?.parentForm;
  const detail =
    ownerKey && parentForm
      ? parentForm.getFieldValue([ownerKey, "SalaryPackageModal"]) || {}
      : modalData?.initialValues || {};
  const hasExistingDetail =
    detail && typeof detail === "object" && Object.keys(detail).length > 0;

  return {
    ...buildInitialValues({
      ...detail,
      amount:
        detail?.amount ||
        modalData?.totalValue ||
        detail?.grossSalary ||
        "",
      grossSalary: detail?.grossSalary || modalData?.totalValue || "",
    }),
    _hasExistingDetail: hasExistingDetail,
  };
}

function hasMeaningfulValues(values) {
  return [
    values?.amount,
    values?.grossSalary,
    values?.SGC,
    values?.salarySacrificeContributions,
    values?.afterTaxContributions,
  ].some((value) => String(value ?? "").trim() !== "");
}

function applySalaryFormula(form, nextPartialValues = {}) {
  const current = {
    remunerationType: form.getFieldValue(["remunerationType"]),
    amount: form.getFieldValue(["amount"]),
    SG: form.getFieldValue(["SG"]),
    ...nextPartialValues,
  };

  const remunerationType = current.remunerationType || "Gross Salary";
  const amount = parseCurrencyNumber(current.amount);
  const sg = parsePercentNumber(current.SG);

  let grossSalary = 0;
  let sgc = 0;

  if (remunerationType === "Gross Salary") {
    grossSalary = amount;
    sgc = amount * (sg / 100);
  } else {
    grossSalary = amount / (1 + sg / 100 || 1);
    sgc = amount - grossSalary;
  }

  form.setFieldValue(
    ["grossSalary"],
    grossSalary ? toCommaAndDollar(grossSalary) : "",
  );
  form.setFieldValue(["SGC"], sgc ? toCommaAndDollar(sgc) : "");
}

const SALARY_DETAIL_COLUMNS = [
  {
    title: "Remuneration Type",
    key: "remunerationType",
    dataIndex: "remunerationType",
    field: "remunerationType",
    type: "select",
    options: REMUNERATION_OPTIONS,
    width: 140,
    onChange: (value, record, column, form) => {
      form.setFieldValue([column.field], value);
      applySalaryFormula(form, { remunerationType: value });
    },
  },
  {
    title: "Amount",
    key: "amount",
    dataIndex: "amount",
    field: "amount",
    type: "text",
    width: 120,
    onChange: (value, record, column, form) => {
      const formatted = formatCurrencyValue(value);
      form.setFieldValue([column.field], formatted);
      applySalaryFormula(form, { amount: formatted });
    },
  },
  {
    title: "SG",
    key: "SG",
    dataIndex: "SG",
    field: "SG",
    type: "text",
    width: 80,
    onChange: (value, record, column, form) => {
      const formatted = formatPercentValue(value);
      form.setFieldValue([column.field], formatted);
      applySalaryFormula(form, { SG: formatted });
    },
  },
  {
    title: "Gross Salary",
    key: "grossSalary",
    dataIndex: "grossSalary",
    field: "grossSalary",
    type: "text",
    disabled: true,
    width: 120,
  },
  {
    title: "SGC",
    key: "SGC",
    dataIndex: "SGC",
    field: "SGC",
    type: "text",
    disabled: true,
    width: 120,
  },
  {
    title: "Salary Sacrifice Contributions",
    key: "salarySacrificeContributions",
    dataIndex: "salarySacrificeContributions",
    field: "salarySacrificeContributions",
    type: "text",
    width: 170,
    onChange: (value, record, column, form) => {
      form.setFieldValue([column.field], formatCurrencyValue(value));
    },
  },
  {
    title: "After Tax Contributions",
    key: "afterTaxContributions",
    dataIndex: "afterTaxContributions",
    field: "afterTaxContributions",
    type: "text",
    width: 160,
    onChange: (value, record, column, form) => {
      form.setFieldValue([column.field], formatCurrencyValue(value));
    },
  },
];

export default function SalaryDetail({ modalData }) {
  const [form] = Form.useForm();
  const initialValues = useMemo(
    () => getInitialValues(modalData),
    [modalData],
  );
  const [editing, setEditing] = useState(
    () => !hasMeaningfulValues(initialValues),
  );
  const remunerationTypeValue = Form.useWatch("remunerationType", form);
  const amountValue = Form.useWatch("amount", form);
  const sgValue = Form.useWatch("SG", form);
  const grossSalaryValue = Form.useWatch("grossSalary", form);
  const sgcValue = Form.useWatch("SGC", form);
  const salarySacrificeContributionsValue = Form.useWatch(
    "salarySacrificeContributions",
    form,
  );
  const afterTaxContributionsValue = Form.useWatch(
    "afterTaxContributions",
    form,
  );

  useEffect(() => {
    form.setFieldsValue(initialValues);
    setEditing(!hasMeaningfulValues(initialValues));
  }, [form, initialValues]);

  useEffect(() => {
    if (initialValues.amount) {
      applySalaryFormula(form, initialValues);
    }
  }, [form, initialValues]);

  const rowData = useMemo(
    () => [
      {
        key: modalData?.ownerKey || "salaryDetail",
        formPath: [],
        remunerationType:
          remunerationTypeValue ?? initialValues.remunerationType,
        amount: amountValue ?? initialValues.amount,
        SG: sgValue ?? initialValues.SG,
        grossSalary: grossSalaryValue ?? initialValues.grossSalary,
        SGC: sgcValue ?? initialValues.SGC,
        salarySacrificeContributions:
          salarySacrificeContributionsValue ??
          initialValues.salarySacrificeContributions,
        afterTaxContributions:
          afterTaxContributionsValue ??
          initialValues.afterTaxContributions,
      },
    ],
    [
      afterTaxContributionsValue,
      amountValue,
      grossSalaryValue,
      initialValues,
      modalData?.ownerKey,
      remunerationTypeValue,
      salarySacrificeContributionsValue,
      sgValue,
      sgcValue,
    ],
  );

  const handleSave = async () => {
    const values = await form.validateFields();
    modalData?.parentForm?.setFieldValue?.(
      [modalData?.ownerKey, "SalaryPackageModal"],
      values,
    );
    modalData?.parentForm?.setFieldValue?.(
      [modalData?.ownerKey, "grossSalary"],
      values?.grossSalary || "",
    );
    modalData?.closeModal?.();
    setEditing(false);
  };

  return (
    <div style={{ padding: "16px 0px 0px 0px" }}>
      <Form form={form} initialValues={initialValues} layout="vertical">
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <EditableDynamicTable
              form={form}
              editing={editing}
              columns={SALARY_DETAIL_COLUMNS}
              data={rowData}
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
                    <Button onClick={() => modalData?.closeModal?.()}>
                      Cancel
                    </Button>
                    <Button type="primary" onClick={() => setEditing(true)}>
                      Edit <RiEdit2Fill />
                    </Button>
                  </>
                ) : (
                  <Button type="primary" onClick={handleSave}>
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
