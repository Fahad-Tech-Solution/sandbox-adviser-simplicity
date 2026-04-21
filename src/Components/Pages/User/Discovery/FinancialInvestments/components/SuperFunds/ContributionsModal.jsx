import { Button, Col, DatePicker, Form, Row, Space } from "antd";
import dayjs from "dayjs";
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

function parseCurrencyValue(value) {
  if (value === null || value === undefined || value === "") return 0;
  const numeric = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

function formatCurrencyValue(value) {
  const numeric = parseCurrencyValue(value);
  return numeric ? toCommaAndDollar(numeric) : "";
}

function buildFinancialYears(startYear) {
  const parsedYear = Number(startYear);
  if (!parsedYear) return [];

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentFYEnd = currentMonth >= 6 ? currentYear + 1 : currentYear;

  const years = [];
  for (let year = parsedYear; year < currentFYEnd; year += 1) {
    years.push(`${year}/${year + 1}`);
  }
  return years;
}

function buildInitialValues(rowValues = {}) {
  return {
    startYear: rowValues?.contributionsStartYear || undefined,
    entries: Array.isArray(rowValues?.contributionsArray)
      ? rowValues.contributionsArray
      : [],
  };
}

function hasMeaningfulValues(initialValues = {}) {
  return (
    Boolean(initialValues?.startYear) ||
    (initialValues?.entries || []).length > 0
  );
}

function buildContributionEntries(financialYears, entries = []) {
  return financialYears.map((financialYear, index) => ({
    financialYear,
    employerContributions: entries?.[index]?.employerContributions || "",
    concessional: entries?.[index]?.concessional || "",
    totalConcessional: entries?.[index]?.totalConcessional || "",
    nonConcessionalContributions:
      entries?.[index]?.nonConcessionalContributions || "",
  }));
}

export default function ContributionsModal({ modalData }) {
  const [form] = Form.useForm();
  const initialValues = useMemo(() => {
    const values = buildInitialValues(modalData?.initialValues || {});
    return {
      ...values,
      entries: buildContributionEntries(
        buildFinancialYears(values.startYear),
        values.entries,
      ),
    };
  }, [modalData]);
  const [editing, setEditing] = useState(
    () => !hasMeaningfulValues(initialValues),
  );

  const startYear = Form.useWatch("startYear", form);
  const entries = Form.useWatch("entries", form) || initialValues.entries || [];
  const financialYears = useMemo(
    () => buildFinancialYears(startYear),
    [startYear],
  );

  useEffect(() => {
    form.setFieldsValue(initialValues);
    setEditing(!hasMeaningfulValues(initialValues));
  }, [form, initialValues]);

  const rows = useMemo(
    () =>
      buildContributionEntries(financialYears, entries).map((item, index) => ({
        key: `contribution-${index}`,
        formPath: ["entries", index],
        rowNumber: index + 1,
        ...item,
      })),
    [entries, financialYears],
  );

  const handleStartYearChange = (date) => {
    const nextYear = date?.year();
    const currentEntries = form.getFieldValue("entries") || [];
    form.setFieldValue(
      "entries",
      buildContributionEntries(buildFinancialYears(nextYear), currentEntries),
    );
  };

  const recalculateTotals = (
    record,
    currentForm,
    changedField,
    changedValue,
  ) => {
    const path = record?.formPath || [];
    const employer =
      changedField === "employerContributions"
        ? changedValue
        : currentForm.getFieldValue([...path, "employerContributions"]);
    const concessional =
      changedField === "concessional"
        ? changedValue
        : currentForm.getFieldValue([...path, "concessional"]);

    currentForm.setFieldValue(
      [...path, "totalConcessional"],
      formatCurrencyValue(
        parseCurrencyValue(employer) + parseCurrencyValue(concessional),
      ),
    );
  };

  const handleMoneyChange = (value, record, column, currentForm) => {
    const formatted = formatCurrencyValue(value?.target?.value);
    currentForm.setFieldValue([...record.formPath, column.field], formatted);
    if (["employerContributions", "concessional"].includes(column.field)) {
      recalculateTotals(record, currentForm, column.field, formatted);
    }
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
      title: "Financial Years",
      dataIndex: "financialYear",
      key: "financialYear",
      editable: false,
    },
    {
      title: "Employer Contributions",
      dataIndex: "employerContributions",
      key: "employerContributions",
      field: "employerContributions",
      type: "text",
      placeholder: "Employer Contributions",
      onChange: handleMoneyChange,
    },
    {
      title: "Concessional (Inc. Salary Sac)",
      dataIndex: "concessional",
      key: "concessional",
      field: "concessional",
      type: "text",
      placeholder: "Concessional",
      onChange: handleMoneyChange,
    },
    {
      title: "Total Concessional Contributions",
      dataIndex: "totalConcessional",
      key: "totalConcessional",
      field: "totalConcessional",
      type: "text",
      placeholder: "Total Concessional",
      disabled: true,
    },
    {
      title: "Non-Concessional Contributions",
      dataIndex: "nonConcessionalContributions",
      key: "nonConcessionalContributions",
      field: "nonConcessionalContributions",
      type: "text",
      placeholder: "Non-Concessional Contributions",
      onChange: handleMoneyChange,
    },
  ];

  const handleConfirmAndExit = async () => {
    const values = form.getFieldsValue(true);
    const savedEntries = buildContributionEntries(
      financialYears,
      values?.entries || [],
    );
    const currentRow =
      modalData?.parentForm?.getFieldValue?.(modalData?.fieldPath) || {};
    const updatedRow = {
      ...currentRow,
      contributions: "Yes",
      contributionsStartYear: values?.startYear,
      contributionsArray: savedEntries,
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
            <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
              <Form.Item
                label="Financial year Start Date"
                name="startYear"
                style={{ margin: 0, paddingTop: 8 }}
                getValueProps={(value) => ({
                  value: value ? dayjs(String(value), "YYYY") : null,
                })}
                getValueFromEvent={(date) => date?.year()}
              >
                <DatePicker
                  picker="year"
                  placeholder="Select Year"
                  disabled={!editing}
                  onChange={handleStartYearChange}
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </div>
          </Col>
          <Col xs={24}>
            {financialYears.length > 0 ? (
              <EditableDynamicTable
                form={form}
                editing={editing}
                columns={columns}
                data={rows}
                tableProps={TABLE_PROPS}
              />
            ) : null}
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
