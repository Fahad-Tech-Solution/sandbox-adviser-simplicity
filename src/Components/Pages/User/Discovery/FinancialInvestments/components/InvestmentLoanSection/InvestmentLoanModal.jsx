import { Button, Col, Form, message, Row, Select, Space } from "antd";
import { useAtomValue, useSetAtom } from "jotai";
import React, { useEffect, useMemo, useState } from "react";
import EditableDynamicTable from "../../../../../../Common/EditableDynamicTable.jsx";
import { RiEdit2Fill } from "react-icons/ri";
import {
  InvestmentOffersData,
  discoveryDataAtom,
} from "../../../../../../../store/authState.js";
import { formatNumber, toCommaAndDollar } from "../../../../../../../hooks/helpers.js";
import useApi from "../../../../../../../hooks/useApi.js";

const TABLE_PROPS = {
  showCount: false,
  noPagination: true,
  horizontalScroll: true,
  tableStyle: { borderRadius: 12, overflow: "hidden" },
  headerFontSize: 11,
  bodyFontSize: 12,
};

const DEFAULT_DEDUCTIBLE = "100.00%";

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





function buildInitialPerson(person = {}, totalValue = "") {
  return {
    lender: person?.lender || undefined,
    loanBalance: formatCurrencyValue(person?.loanBalance),
    loanType: person?.loanType || undefined,
    repaymentsAmount: formatCurrencyValue(person?.repaymentsAmount),
    frequency: person?.frequency || undefined,
    annualRepayments: formatCurrencyValue(person?.annualRepayments || totalValue),
    monthlyContribution: formatCurrencyValue(person?.monthlyContribution),
    annualLoan: formatCurrencyValue(person?.annualLoan),
    interestRate: formatPercentValue(person?.interestRate),
    loanTerm: person?.loanTerm || undefined,
    loanTermRemaining: person?.loanTermRemaining || undefined,
    deductibleLoanAmount: formatPercentValue(
      person?.deductibleLoanAmount,
      DEFAULT_DEDUCTIBLE,
    ),
  };
}

function buildInitialValues(sectionData, allowPartner) {
  const rawOwner = Array.isArray(sectionData?.owner) ? sectionData.owner : [];
  const owner = allowPartner
    ? rawOwner
    : rawOwner.filter((value) => value === "client");

  return {
    owner,
    client: buildInitialPerson(sectionData?.client, sectionData?.clientTotal),
    partner: buildInitialPerson(sectionData?.partner, sectionData?.partnerTotal),
    joint: buildInitialPerson(sectionData?.joint),
  };
}

function calculateAnnualRepayments(record, currentForm) {
  const repaymentsAmount = parseCurrencyValue(
    currentForm.getFieldValue([record.formPath, "repaymentsAmount"]),
  );
  const frequency = Number(
    currentForm.getFieldValue([record.formPath, "frequency"]) || 0,
  );

  if (repaymentsAmount === undefined || !frequency) {
    currentForm.setFieldValue([record.formPath, "annualRepayments"], "");
    return;
  }

  currentForm.setFieldValue(
    [record.formPath, "annualRepayments"],
    formatCurrencyValue(repaymentsAmount * frequency),
  );
}

function formulaSetting(record, currentForm) {
  const monthlyContribution = parseCurrencyValue(
    currentForm.getFieldValue([record.formPath, "monthlyContribution"]),
  );

  if (monthlyContribution === undefined) {
    currentForm.setFieldValue([record.formPath, "annualLoan"], "");
    return;
  }

  currentForm.setFieldValue(
    [record.formPath, "annualLoan"],
    formatCurrencyValue(monthlyContribution * 12),
  );
}


function buildLoanPayload(source, existing = {}, isMarginLoan) {
    const base = {
      ...(existing || {}),
      lender: source?.lender || "",
      loanBalance: formatCurrencyValue(source?.loanBalance),
      interestRate: formatPercentValue(source?.interestRate),
      loanTerm: source?.loanTerm || "",
      loanTermRemaining: source?.loanTermRemaining || "",
      deductibleLoanAmount: formatPercentValue(
        source?.deductibleLoanAmount,
        DEFAULT_DEDUCTIBLE
      ),
    };
  
    if (isMarginLoan) {
      return {
        ...base,
        monthlyContribution: formatCurrencyValue(source?.monthlyContribution),
        annualLoan: formatCurrencyValue(source?.annualLoan),
      };
    }
  
    // Investment Loan
    return {
      ...base,
      loanType: source?.loanType || "",
      repaymentsAmount: formatCurrencyValue(source?.repaymentsAmount),
      frequency: source?.frequency || "",
      annualRepayments: formatCurrencyValue(source?.annualRepayments),
    };
  }

export default function InvestmentLoanModal({ modalData }) {
  const [form] = Form.useForm();
  const investmentOffers = useAtomValue(InvestmentOffersData);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const { post, patch } = useApi();

  const discoveryData = useAtomValue(discoveryDataAtom);
  const setDiscoveryData = useSetAtom(discoveryDataAtom);
  const sectionData = discoveryData?.[modalData?.key] || {};
  const isMarginLoan = modalData?.key === "managedFundsMarginLoan";

  const allowPartner = !["Single", "Widowed"].includes(
    discoveryData?.personalDetails?.client?.clientMaritalStatus,
  );

  const ownerOptions = useMemo(() => {
    const options = [
      {
        label: discoveryData?.personalDetails?.client?.clientPreferredName || "Client",
        value: "client",
      },
    ];

    if (allowPartner) {
      options.push(
        {
          label:
            discoveryData?.personalDetails?.partner?.partnerPreferredName || "Partner",
          value: "partner",
        },
        { label: "Joint", value: "joint" },
      );
    }

    return options;
  }, [allowPartner, discoveryData]);

  const lenderOption = useMemo(() => {
    const institutions = investmentOffers?.FinancialInstitutions || [];
    const mapped = institutions
      .map((item) => ({
        value: String(item?._id ?? item?.value ?? ""),
        label: item?.platformName || item?.label || item?.name || item?._id || "",
      }))
      .filter((option) => option.value && option.label);

    const existingValues = [
      sectionData?.client?.lender,
      sectionData?.partner?.lender,
      sectionData?.joint?.lender,
    ].filter(Boolean);

    existingValues.forEach((value) => {
      if (!mapped.some((option) => option.value === value)) {
        mapped.unshift({ value, label: value });
      }
    });

    return mapped;
  }, [investmentOffers, sectionData]);

  const columns = useMemo(() => {
    const commonColumns = [
      { title: "Owner", key: "owner", kind: "owner", 
        // width: 150 
      },
      {
        title: "Lender",
        dataIndex: "lender",
        key: "lender",
        field: "lender",
        type: "select",
        options: lenderOption,
        // width: isMarginLoan ? 200 : 150,
      },
      {
        title: "Loan Balance",
        dataIndex: "loanBalance",
        key: "loanBalance",
        field: "loanBalance",
        type: "text",
        placeholder: "Loan Balance",
        // width: isMarginLoan ? 160 : 200,
        onChange: (value, record, column, currentForm) => {
          currentForm.setFieldValue(
            [record.formPath, column.field],
            formatNumericInput(value, { currency: true }),
          );
        },
      },
    ];

    const marginLoanColumns = [
      {
        title: "Monthly Contribution",
        dataIndex: "monthlyContribution",
        key: "monthlyContribution",
        field: "monthlyContribution",
        type: "text",
        placeholder: "Monthly Contribution",
        // width: 180,
        onChange: (value, record, column, currentForm) => {
          currentForm.setFieldValue(
            [record.formPath, column.field],
            formatNumericInput(value, { currency: true }),
          );
          formulaSetting(record, currentForm);
        },
      },
      {
        title: "Annual Loan Contributions",
        dataIndex: "annualLoan",
        key: "annualLoan",
        field: "annualLoan",
        type: "text",
        disabled: true,
        editable: true,
        // width: 200,
      },
      {
        title: "Interest Rate (p.a)",
        dataIndex: "interestRate",
        key: "interestRate",
        field: "interestRate",
        type: "text",
        placeholder: "Interest Rate",
        // width: 150,
        onChange: (value, record, column, currentForm) => {
          currentForm.setFieldValue(
            [record.formPath, column.field],
            formatPercentValue(getChangedValue(value)),
          );
        },
      },
      {
        title: "Loan Term",
        dataIndex: "loanTerm",
        key: "loanTerm",
        field: "loanTerm",
        type: "select",
        options: LOAN_TERM_OPTIONS,
        // width: 150,
      },
      {
        title: "Loan Term Remaining",
        dataIndex: "loanTermRemaining",
        key: "loanTermRemaining",
        field: "loanTermRemaining",
        type: "select",
        options: LOAN_TERM_OPTIONS,
        // width: 180,
      },
      {
        title: "Deductible Loan Amount",
        dataIndex: "deductibleLoanAmount",
        key: "deductibleLoanAmount",
        field: "deductibleLoanAmount",
        type: "text",
        placeholder: "Deductible Loan Amount",
        // width: 200,
        onChange: (value, record, column, currentForm) => {
          currentForm.setFieldValue(
            [record.formPath, column.field],
            formatPercentValue(getChangedValue(value), DEFAULT_DEDUCTIBLE),
          );
        },
      },
    ];

    const investmentLoanColumns = [
      {
        title: "Loan Type",
        dataIndex: "loanType",
        key: "loanType",
        field: "loanType",
        type: "select",
        options: LOAN_TYPE_OPTIONS,
        // width: 150,
      },
      {
        title: "Repayments Amount",
        dataIndex: "repaymentsAmount",
        key: "repaymentsAmount",
        field: "repaymentsAmount",
        type: "text",
        placeholder: "Repayments Amount",
        // width: 200,
        onChange: (value, record, column, currentForm) => {
          currentForm.setFieldValue(
            [record.formPath, column.field],
            formatNumericInput(value, { currency: true }),
          );
          calculateAnnualRepayments(record, currentForm);
        },
      },
      {
        title: "Frequency",
        dataIndex: "frequency",
        key: "frequency",
        field: "frequency",
        type: "select",
        options: FREQUENCY_OPTIONS,
        // width: 150,
        onChange: (_, record, __, currentForm) => {
          calculateAnnualRepayments(record, currentForm);
        },
      },
      {
        title: "Annual Repayments",
        dataIndex: "annualRepayments",
        key: "annualRepayments",
        field: "annualRepayments",
        type: "text",
        placeholder: "Annual Repayments",
        disabled: true,
        editable: true,
        // width: 150,
      },
      {
        title: "Interest Rate",
        dataIndex: "interestRate",
        key: "interestRate",
        field: "interestRate",
        type: "text",
        placeholder: "Interest Rate",
        // width: 200,
        onChange: (value, record, column, currentForm) => {
          currentForm.setFieldValue(
            [record.formPath, column.field],
            formatPercentValue(getChangedValue(value)),
          );
        },
      },
      {
        title: "Loan Term",
        dataIndex: "loanTerm",
        key: "loanTerm",
        field: "loanTerm",
        type: "select",
        options: LOAN_TERM_OPTIONS,
        // width: 150,
      },
      {
        title: "Loan Term Remaining",
        dataIndex: "loanTermRemaining",
        key: "loanTermRemaining",
        field: "loanTermRemaining",
        type: "select",
        options: LOAN_TERM_OPTIONS,
        // width: 150,
      },
      {
        title: "Deductible Loan Amount",
        dataIndex: "deductibleLoanAmount",
        key: "deductibleLoanAmount",
        field: "deductibleLoanAmount",
        type: "text",
        placeholder: "Deductible Loan Amount",
        // width: 200,
        onChange: (value, record, column, currentForm) => {
          currentForm.setFieldValue(
            [record.formPath, column.field],
            formatPercentValue(getChangedValue(value), DEFAULT_DEDUCTIBLE),
          );
        },
      },
    ];

    return isMarginLoan
      ? [...commonColumns, ...marginLoanColumns]
      : [...commonColumns, ...investmentLoanColumns];
  }, [isMarginLoan, lenderOption]);

  const initialValues = useMemo(
    () => buildInitialValues(sectionData, allowPartner),
    [allowPartner, sectionData],
  );

  const selectedOwners = Form.useWatch("owner", form) || initialValues.owner;

  const tableColumns = useMemo(
    () =>
      columns.map((column) =>
        column.kind === "owner"
          ? {
              ...column,
              dataIndex: "ownerLabel",
              editable: false,
            }
          : column,
      ),
    [columns],
  );

  const rows = useMemo(
    () =>
      (selectedOwners || [])
        .filter((owner) => allowPartner || owner === "client")
        .map((owner) => ({
          key: owner,
          formPath: owner,
          ownerLabel:
            ownerOptions.find((option) => option.value === owner)?.label || owner,
          lender: form.getFieldValue([owner, "lender"]),
          loanBalance: form.getFieldValue([owner, "loanBalance"]),
          loanType: form.getFieldValue([owner, "loanType"]),
          repaymentsAmount: form.getFieldValue([owner, "repaymentsAmount"]),
          frequency: form.getFieldValue([owner, "frequency"]),
          annualRepayments: form.getFieldValue([owner, "annualRepayments"]),
          monthlyContribution: form.getFieldValue([owner, "monthlyContribution"]),
          annualLoan: form.getFieldValue([owner, "annualLoan"]),
          interestRate: form.getFieldValue([owner, "interestRate"]),
          loanTerm: form.getFieldValue([owner, "loanTerm"]),
          loanTermRemaining: form.getFieldValue([owner, "loanTermRemaining"]),
          deductibleLoanAmount: form.getFieldValue([owner, "deductibleLoanAmount"]),
        })),
    [allowPartner, form, ownerOptions, selectedOwners],
  );

  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [form, initialValues]);

  useEffect(() => {
    if (!allowPartner && selectedOwners?.includes("partner")) {
      const filtered = selectedOwners.filter((owner) => owner === "client");
      form.setFieldValue("owner", filtered);
    }
  }, [allowPartner, form, selectedOwners]);

  const handleFinish = async (values) => {
    const formValues = form.getFieldsValue(true);
    const sourceValues = {
      ...formValues,
      ...values,
      client: { ...(formValues?.client || {}), ...(values?.client || {}) },
      partner: { ...(formValues?.partner || {}), ...(values?.partner || {}) },
      joint: { ...(formValues?.joint || {}), ...(values?.joint || {}) },
    };

    const owner = Array.isArray(sourceValues.owner) ? sourceValues.owner : [];
    const clientSelected = owner.includes("client");
    const partnerSelected = allowPartner && owner.includes("partner");
    const jointSelected = allowPartner && owner.includes("joint");

    const jointLoanBalance = parseCurrencyValue(sourceValues?.joint?.loanBalance) || 0;
    const jointHalf = jointSelected ? jointLoanBalance / 2 : 0;
    const clientLoanBalance = parseCurrencyValue(sourceValues?.client?.loanBalance) || 0;
    const partnerLoanBalance = parseCurrencyValue(sourceValues?.partner?.loanBalance) || 0;

    const payload = {
      ...sectionData,
      owner,
      clientFK:
        sectionData?.clientFK ||
        discoveryData?.personalDetails?._id ||
        undefined,

        client: clientSelected
  ? buildLoanPayload(sourceValues.client, sectionData.client, isMarginLoan)
  : {},

partner: partnerSelected
  ? buildLoanPayload(sourceValues.partner, sectionData.partner, isMarginLoan)
  : {},

joint: jointSelected
  ? buildLoanPayload(sourceValues.joint, sectionData.joint, isMarginLoan)
  : {},
    //   client: clientSelected
    //     ? {
    //         ...(sectionData?.client || {}),
    //         lender: sourceValues?.client?.lender || "",
    //         loanBalance: formatCurrencyValue(sourceValues?.client?.loanBalance),
    //         loanType: isMarginLoan ? undefined : sourceValues?.client?.loanType || "",
    //         repaymentsAmount: isMarginLoan
    //           ? ""
    //           : formatCurrencyValue(sourceValues?.client?.repaymentsAmount),
    //         frequency: isMarginLoan ? "" : sourceValues?.client?.frequency || "",
    //         annualRepayments: isMarginLoan
    //           ? ""
    //           : formatCurrencyValue(sourceValues?.client?.annualRepayments),
    //         monthlyContribution: isMarginLoan
    //           ? formatCurrencyValue(sourceValues?.client?.monthlyContribution)
    //           : "",
    //         annualLoan: isMarginLoan
    //           ? formatCurrencyValue(sourceValues?.client?.annualLoan)
    //           : "",
    //         interestRate: formatPercentValue(sourceValues?.client?.interestRate),
    //         loanTerm: sourceValues?.client?.loanTerm || "",
    //         loanTermRemaining: sourceValues?.client?.loanTermRemaining || "",
    //         deductibleLoanAmount: formatPercentValue(
    //           sourceValues?.client?.deductibleLoanAmount,
    //           DEFAULT_DEDUCTIBLE,
    //         ),
    //       }
    //     : {},
    //   partner: partnerSelected
    //     ? {
    //         ...(sectionData?.partner || {}),
    //         lender: sourceValues?.partner?.lender || "",
    //         loanBalance: formatCurrencyValue(sourceValues?.partner?.loanBalance),
    //         loanType: isMarginLoan ? "" : sourceValues?.partner?.loanType || "",
    //         repaymentsAmount: isMarginLoan
    //           ? ""
    //           : formatCurrencyValue(sourceValues?.partner?.repaymentsAmount),
    //         frequency: isMarginLoan ? "" : sourceValues?.partner?.frequency || "",
    //         annualRepayments: isMarginLoan
    //           ? ""
    //           : formatCurrencyValue(sourceValues?.partner?.annualRepayments),
    //         monthlyContribution: isMarginLoan
    //           ? formatCurrencyValue(sourceValues?.partner?.monthlyContribution)
    //           : "",
    //         annualLoan: isMarginLoan
    //           ? formatCurrencyValue(sourceValues?.partner?.annualLoan)
    //           : "",
    //         interestRate: formatPercentValue(sourceValues?.partner?.interestRate),
    //         loanTerm: sourceValues?.partner?.loanTerm || "",
    //         loanTermRemaining: sourceValues?.partner?.loanTermRemaining || "",
    //         deductibleLoanAmount: formatPercentValue(
    //           sourceValues?.partner?.deductibleLoanAmount,
    //           DEFAULT_DEDUCTIBLE,
    //         ),
    //       }
    //     : {},
    //   joint: jointSelected
    //     ? {
    //         ...(sectionData?.joint || {}),
    //         lender: sourceValues?.joint?.lender || "",
    //         loanBalance: formatCurrencyValue(sourceValues?.joint?.loanBalance),
    //         loanType: isMarginLoan ? "" : sourceValues?.joint?.loanType || "",
    //         repaymentsAmount: isMarginLoan
    //           ? ""
    //           : formatCurrencyValue(sourceValues?.joint?.repaymentsAmount),
    //         frequency: isMarginLoan ? "" : sourceValues?.joint?.frequency || "",
    //         annualRepayments: isMarginLoan
    //           ? ""
    //           : formatCurrencyValue(sourceValues?.joint?.annualRepayments),
    //         monthlyContribution: isMarginLoan
    //           ? formatCurrencyValue(sourceValues?.joint?.monthlyContribution)
    //           : "",
    //         annualLoan: isMarginLoan
    //           ? formatCurrencyValue(sourceValues?.joint?.annualLoan)
    //           : "",
    //         interestRate: formatPercentValue(sourceValues?.joint?.interestRate),
    //         loanTerm: sourceValues?.joint?.loanTerm || "",
    //         loanTermRemaining: sourceValues?.joint?.loanTermRemaining || "",
    //         deductibleLoanAmount: formatPercentValue(
    //           sourceValues?.joint?.deductibleLoanAmount,
    //           DEFAULT_DEDUCTIBLE,
    //         ),
    //       }
    //     : {},
      clientTotal: clientSelected || jointSelected
        ? formatCurrencyValue((clientSelected ? clientLoanBalance : 0) + jointHalf)
        : "",
      partnerTotal: partnerSelected || jointSelected
        ? formatCurrencyValue((partnerSelected ? partnerLoanBalance : 0) + jointHalf)
        : "",
    };

    try {
      setSaving(true);
      const saved = sectionData?.clientFK
        ? await patch(`/api/${modalData?.key}/Update`, payload)
        : await post(`/api/${modalData?.key}/Add`, payload);

      setDiscoveryData((prev) => ({
        ...(prev && typeof prev === "object" ? prev : {}),
        [modalData.key]: saved || payload,
      }));

      message.success(
        `${modalData?.title || "Investment Loan"} updated successfully`,
      );
      modalData?.closeModal?.();
    } catch (error) {
      message.error(
        error?.response?.data?.message ||
          error?.message ||
          `Failed to update ${modalData?.title || "Investment Loan"}`,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: "16px  4px 0 4px" }}>
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
          <Col xs={24} md={6}>
            <Form.Item
              label={modalData?.title !== "Investment Loan" ? "Members" : "Owner"}
              name="owner"
              style={{ marginBottom: 0 }}
              rules={[{ required: true, message: "Owner is required" }]}
            >
              <Select
                options={ownerOptions}
                mode="multiple"
                placeholder="Select owner"
                style={{ width: "100%" }}
                disabled={!editing}
              />
            </Form.Item>
          </Col>

          <Col xs={24}>
            <EditableDynamicTable
              form={form}
              editing={editing}
              columns={tableColumns}
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
                <Button onClick={() => modalData?.closeModal?.()}>Cancel</Button>
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
