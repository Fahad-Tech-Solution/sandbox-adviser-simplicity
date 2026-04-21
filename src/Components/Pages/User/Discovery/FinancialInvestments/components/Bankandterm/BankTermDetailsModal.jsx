import { Alert, Button, Col, Form, Row, Select, Space } from "antd";
import { InvestmentOffersData } from "../../../../../../../store/authState";
import { useAtomValue } from "jotai";
import React, { useEffect, useMemo, useState } from "react";
import EditableDynamicTable from "../../../../../../Common/EditableDynamicTable";
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

function parseCurrencyValue(value) {
  if (value === null || value === undefined || value === "") return 0;
  const numeric = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

function formatCurrencyValue(value) {
  const numeric = parseCurrencyValue(value);
  return numeric ? toCommaAndDollar(numeric) : "";
}

function calculateTotalBalance(entries = []) {
  return entries.reduce(
    (sum, item) => sum + parseCurrencyValue(item?.currentBalance),
    0,
  );
}

function buildEntries(count, entries = []) {
  return Array.from({ length: count }, (_, index) => ({
    Institution: entries?.[index]?.Institution || "",
    accountNumber: entries?.[index]?.accountNumber || "",
    currentBalance: entries?.[index]?.currentBalance || "",
  }));
}

function hasMeaningfulValues(initialValues = {}) {
  const entries = initialValues?.entries || [];
  if ((initialValues?.NumberOfMap || 0) > 0) return true;

  return entries.some((entry) =>
    [entry?.Institution, entry?.accountNumber, entry?.currentBalance].some(
      (value) => String(value ?? "").trim() !== "",
    ),
  );
}

function buildInstitutionOptions(investmentOffers, initialValues) {
  const institutions = investmentOffers?.FinancialInstitutions || [];
  const options = institutions.map((item) => ({
    value: String(item?._id ?? item?.value ?? ""),
    label: item?.platformName || item?.label || item?.name || item?._id || "",
  }));

  (initialValues?.entries || []).forEach((entry) => {
    const currentValue = String(entry?.Institution || "").trim();
    if (
      currentValue &&
      !options.some((option) => String(option.value) === currentValue)
    ) {
      options.unshift({
        value: currentValue,
        label: currentValue,
      });
    }
  });

  return options.filter((option) => option.value && option.label);
}

export default function BankTermDetailsModal({ modalData }) {
  const investmentOffers = useAtomValue(InvestmentOffersData);
  const [form] = Form.useForm();
  const [editing, setEditing] = useState(false);
  const config = {
    countLabel:
      modalData?.sectionKey === "bankAccountFinance"
        ? "Number of Bank Accounts"
        : "Number of Term Deposits",
    pageLimit: modalData?.tableRows || 10,
  };
  const ownerArray =
    modalData?.parentForm?.getFieldValue?.([
      modalData?.ownerKey,
      "currentBalanceArray",
    ]) || [];

  const initialValues = useMemo(
    () => ({
      NumberOfMap: ownerArray.length || undefined,
      entries: ownerArray,
    }),
    [ownerArray],
  );

  const institutionOptions = useMemo(
    () => buildInstitutionOptions(investmentOffers, initialValues),
    [initialValues, investmentOffers],
  );

  console.log(ownerArray, "ownerArray");

  const count = Form.useWatch("NumberOfMap", form);
  const entries = Form.useWatch("entries", form) || initialValues.entries || [];

  useEffect(() => {
    form.setFieldsValue(initialValues);
    setEditing(!hasMeaningfulValues(initialValues));
  }, [form, initialValues]);

  const detailRows = useMemo(
    () =>
      buildEntries(Number(count) || 0, entries).map((item, index) => ({
        key: `${modalData?.ownerKey || "owner"}-${index}`,
        formPath: ["entries", index],
        rowNumber: index + 1,
        ...item,
      })),
    [count, entries, modalData?.ownerKey],
  );

  const detailColumns = [
    {
      title: "No#",
      key: "rowNumber",
      dataIndex: "rowNumber",
      width: 60,
      editable: false,
    },
    {
      title: "Name of Institution",
      key: "Institution",
      dataIndex: "Institution",
      field: "Institution",
      type: "select",
      options: institutionOptions,
      placeholder: "Name of Institution",
    },
    {
      title: "Account Number",
      key: "accountNumber",
      dataIndex: "accountNumber",
      field: "accountNumber",
      type: "text",
      placeholder: "Account Number",
    },
    {
      title: "Current Balance",
      key: "currentBalance",
      dataIndex: "currentBalance",
      field: "currentBalance",
      type: "text",
      placeholder: "Current Balance",
      onChange: (value, record, column, currentForm) => {
        currentForm.setFieldValue(
          [...(record?.formPath || []), column.field],
          formatCurrencyValue(value?.target?.value),
        );
      },
    },
    {
      title: "Action",
      key: "action",
      dataIndex: "action",
      editable: false,
      renderView: () => "--",
      renderEdit: ({ record }) => (
        <Button
          type="text"
          danger
          aria-label={`Remove row ${record?.rowNumber}`}
          onClick={() => handleRemoveRow((record?.rowNumber || 1) - 1)}
        >
          🗑️
        </Button>
      ),
    },
  ];

  const validationErrors = form
    .getFieldsError()
    .filter((field) => field.errors.length > 0);

  const handleCountChange = (nextValue) => {
    const numericValue = Number(nextValue) || 0;
    form.setFieldValue("NumberOfMap", nextValue);
    form.setFieldValue("entries", buildEntries(numericValue, entries));
  };

  const handleRemoveRow = (rowIndex) => {
    const currentEntries = form.getFieldValue("entries") || [];
    const nextEntries = currentEntries.filter((_, index) => index !== rowIndex);
    const nextCount = nextEntries.length;

    form.setFieldValue("entries", nextEntries);
    form.setFieldValue("NumberOfMap", nextCount || undefined);
  };

  const handleConfirmAndExit = async () => {
    const values = await form.validateFields();
    const countValue = Number(values?.NumberOfMap) || 0;
    const savedEntries = buildEntries(countValue, values?.entries || []);
    const totalBalance = calculateTotalBalance(savedEntries);

    modalData?.parentForm?.setFieldValue?.(
      [modalData?.ownerKey, "currentBalanceArray"],
      savedEntries,
    );
    modalData?.parentForm?.setFieldValue?.(
      [modalData?.ownerKey, "currentBalance"],
      totalBalance ? toCommaAndDollar(totalBalance) : "",
    );

    setEditing(false);
    modalData?.closeModal?.();
  };

  return (
    <div style={{ padding: "16px 4px 0px 4px" }}>
      <Form
        form={form}
        initialValues={initialValues}
        requiredMark={false}
        styles={{
          label: {
            fontWeight: "600",
            fontSize: "13px",
            fontFamily: "Arial, serif",
          },
        }}
      >
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

          <Col xs={24} md={10}>
            <Form.Item
              label={config.countLabel}
              name="NumberOfMap"
              style={{ marginBottom: 0 }}
            >
              <Select
                placeholder="Select"
                onChange={handleCountChange}
                disabled={!editing}
                style={{ width: "100%", borderRadius: "8px" }}
                options={Array.from(
                  { length: config.pageLimit },
                  (_, index) => ({
                    value: index + 1,
                    label: index + 1,
                  }),
                )}
              />
            </Form.Item>
          </Col>

          <Col xs={24}>
            <EditableDynamicTable
              form={form}
              editing={editing}
              columns={detailColumns}
              data={detailRows}
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
