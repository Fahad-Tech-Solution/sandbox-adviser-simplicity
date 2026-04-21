import { Button, Col, Form, message, Row, Select, Space } from "antd";
import { useAtomValue, useSetAtom } from "jotai";
import React, { useEffect, useMemo, useState } from "react";
import { RiEdit2Fill } from "react-icons/ri";
import EditableDynamicTable from "../../../../../../Common/EditableDynamicTable.jsx";
import {
  formatNumber,
  toCommaAndDollar,
} from "../../../../../../../hooks/helpers.js";
import {
  InvestmentOffersData,
  discoveryDataAtom,
} from "../../../../../../../store/authState.js";
import useApi from "../../../../../../../hooks/useApi.js";

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

const LOAN_TERM_OPTIONS = Array.from({ length: 30 }, (_, index) => ({
  value: `Year ${index + 1}`,
  label: `Year ${index + 1}`,
}));

const COUNT_OPTIONS = [
  { value: 1, label: "1" },
  { value: 2, label: "2" },
];

function parseCurrencyValue(value) {
  if (value === null || value === undefined || value === "") return undefined;
  const numeric = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numeric) ? numeric : undefined;
}

function formatCurrencyValue(value) {
  const numeric = parseCurrencyValue(value);
  return numeric ? toCommaAndDollar(numeric) : "";
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

function formatPercentValue(value) {
  const digits = String(getChangedValue(value) ?? "").replace(/[^0-9]/g, "");
  if (!digits) return "";
  return `${Math.min(Number(digits), 100)}%`;
}

function buildEmptyCard() {
  return {
    LenderCurrent: undefined,
    LoanBalance: "",
    LoanType: undefined,
    RepaymentsAmount: "",
    Frequency: undefined,
    AnnualRepayments: "",
    InterestRate: "",
    LoanTerm: undefined,
    LoanTermRemaining: undefined,
  };
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
    formatCurrencyValue(repaymentsAmount * frequency),
  );
}

function normalizeCard(entry = {}) {
  return {
    LenderCurrent: entry?.LenderCurrent || undefined,
    LoanBalance: formatCurrencyValue(entry?.LoanBalance),
    LoanType: entry?.LoanType || undefined,
    RepaymentsAmount: formatCurrencyValue(entry?.RepaymentsAmount),
    Frequency: entry?.Frequency || undefined,
    AnnualRepayments: formatCurrencyValue(entry?.AnnualRepayments),
    InterestRate: entry?.InterestRate || "",
    LoanTerm: entry?.LoanTerm || undefined,
    LoanTermRemaining: entry?.LoanTermRemaining || undefined,
  };
}

function buildInitialValues(sectionData) {
  const cards = Array.isArray(sectionData?.client)
    ? sectionData.client.map(normalizeCard)
    : [];
  const count = Math.min(Math.max(cards.length || 1, 1), 2);

  return {
    numberOfCards: count,
    creditCards: Array.from({ length: count }, (_, idx) =>
      cards[idx] ? cards[idx] : buildEmptyCard(),
    ),
  };
}

export default function CreditCardModal({ modalData }) {
  const [form] = Form.useForm();
  const investmentOffers = useAtomValue(InvestmentOffersData);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const { post, patch } = useApi();

  const discoveryData = useAtomValue(discoveryDataAtom);
  const setDiscoveryData = useSetAtom(discoveryDataAtom);
  const sectionData = discoveryData?.[modalData?.key] || {};

  const lenderOption = useMemo(() => {
    const institutions = investmentOffers?.FinancialInstitutions || [];
    const mapped = institutions
      .map((item) => ({
        value: String(item?._id ?? item?.value ?? ""),
        label:
          item?.platformName || item?.label || item?.name || item?._id || "",
      }))
      .filter((option) => option.value && option.label);

    const existingValues = (
      Array.isArray(sectionData?.client) ? sectionData.client : []
    )
      .map((card) => card?.LenderCurrent)
      .filter(Boolean);

    existingValues.forEach((value) => {
      if (!mapped.some((option) => option.value === value)) {
        mapped.unshift({ value, label: value });
      }
    });

    return mapped;
  }, [investmentOffers, sectionData?.client]);

  const initialValues = useMemo(
    () => buildInitialValues(sectionData),
    [sectionData],
  );
  const numberOfCards =
    Form.useWatch("numberOfCards", form) || initialValues.numberOfCards;
  const creditCards =
    Form.useWatch("creditCards", form) || initialValues.creditCards;

  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [form, initialValues]);

  useEffect(() => {
    const count = Number(numberOfCards) || 1;
    const current = Array.isArray(creditCards) ? [...creditCards] : [];
    if (current.length === count) return;

    const nextCards = Array.from({ length: count }, (_, idx) =>
      current[idx] ? current[idx] : buildEmptyCard(),
    );
    form.setFieldValue("creditCards", nextCards);
  }, [creditCards, form, numberOfCards]);

  const handleDeleteRow = (rowIndex) => {
    const current = Array.isArray(form.getFieldValue("creditCards"))
      ? [...form.getFieldValue("creditCards")]
      : [];

    if (current.length <= 1) {
      form.setFieldValue("creditCards", [buildEmptyCard()]);
      form.setFieldValue("numberOfCards", 1);
      return;
    }

    const filtered = current.filter((_, idx) => idx !== rowIndex);
    form.setFieldValue("creditCards", filtered);
    form.setFieldValue("numberOfCards", filtered.length);
  };

  const columns = useMemo(
    () => [
      {
        title: "No#",
        dataIndex: "index",
        key: "owner",
        width: 60,
        editable: false,
        renderView: ({ record }) => record.rowIndex + 1,
      },
      {
        title: "Lender",
        dataIndex: "LenderCurrent",
        key: "LenderCurrent",
        field: "LenderCurrent",
        type: "select",
        options: lenderOption,
        placeholder: "Lender",
      },
      {
        title: "Outstanding Balance",
        dataIndex: "LoanBalance",
        key: "LoanBalance",
        field: "LoanBalance",
        type: "text",
        placeholder: "Outstanding Balance",
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
        title: "Interest Rate (p.a)",
        dataIndex: "InterestRate",
        key: "InterestRate",
        field: "InterestRate",
        type: "text",
        placeholder: "Interest Rate (p.a)",
        onChange: (value, record, column, currentForm) => {
          currentForm.setFieldValue(
            [...record.formPath, column.field],
            formatPercentValue(value),
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
        title: "Action",
        dataIndex: "action",
        key: "action",
        editable: false,
        renderEdit: ({ record }) => (
          <Button
            type="text"
            danger
            onClick={() => handleDeleteRow(record.rowIndex)}
            disabled={!editing}
          >
            🗑️
          </Button>
        ),
        renderView: () => "--",
      },
    ],
    [editing, lenderOption],
  );

  const rows = useMemo(
    () =>
      Array.from({ length: Number(numberOfCards) || 0 }, (_, rowIndex) => {
        const row = creditCards?.[rowIndex] || {};
        return {
          key: `credit-card-${rowIndex}`,
          rowIndex,
          formPath: ["creditCards", rowIndex],
          ...row,
        };
      }),
    [creditCards, numberOfCards],
  );

  const handleFinish = async (values) => {
    const cards = (Array.isArray(values?.creditCards) ? values.creditCards : [])
      .slice(0, Number(values?.numberOfCards) || 0)
      .map((card) => ({
        ...card,
        LoanBalance: formatCurrencyValue(card?.LoanBalance),
        RepaymentsAmount: formatCurrencyValue(card?.RepaymentsAmount),
        AnnualRepayments: formatCurrencyValue(card?.AnnualRepayments),
      }));

    const payload = {
      ...sectionData,
      clientFK:
        sectionData?.clientFK ||
        discoveryData?.personalDetails?._id ||
        undefined,
      client: cards,
      clientTotal: formatCurrencyValue(
        cards.reduce(
          (total, card) => total + (parseCurrencyValue(card?.LoanBalance) || 0),
          0,
        ),
      ),
     
    };

    try {
      setSaving(true);
      const saved = sectionData?.clientFK
        ? await patch("/api/creditCards/Update", payload)
        : await post("/api/creditCards/Add", payload);

      setDiscoveryData((prev) => ({
        ...(prev && typeof prev === "object" ? prev : {}),
        [modalData.key]: saved || payload,
      }));

      message.success(
        `${modalData?.title || "Credit Card"} updated successfully`,
      );
      modalData?.closeModal?.();
    } catch (error) {
      message.error(
        error?.response?.data?.message ||
          error?.message ||
          `Failed to update ${modalData?.title || "Credit Card"}`,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: "16px 4px 0px 4px" }}>
      <Form
        form={form}
        initialValues={initialValues}
        onFinish={handleFinish}
        styles={{
          label: {
            fontWeight: "600",
            fontSize: "13px",
            fontFamily: "Arial, serif",
          },
        }}
        colon={false}
        requiredMark={false}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Form.Item
              label="Number of Credit Cards :"
              name="numberOfCards"
              style={{ marginBottom: 0 }}
              rules={[
                {
                  required: true,
                  message: "Number of Credit Cards is required",
                },
              ]}
            >
              <Select
                options={COUNT_OPTIONS}
                placeholder="Select number"
                style={{ width: "100%" }}
                disabled={!editing}
              />
            </Form.Item>
          </Col>

          <Col xs={24}>
            <EditableDynamicTable
              form={form}
              editing={editing}
              columns={columns}
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
                <Button onClick={() => modalData?.closeModal?.()}>
                  Cancel
                </Button>
                {!editing ? (
                  <Button
                    type="primary"
                    htmlType="button"
                    key="edit"
                    onClick={() => setEditing(true)}
                  >
                    Edit <RiEdit2Fill />
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    htmlType="submit"
                    key="save"
                    loading={saving}
                    disabled={saving}
                  >
                    Save
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
