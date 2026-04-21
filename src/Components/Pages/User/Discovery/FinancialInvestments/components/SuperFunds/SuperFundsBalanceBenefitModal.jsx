import { Button, Col, Form, Row, Space } from "antd";
import dayjs from "dayjs";
import React, { useEffect, useMemo, useState } from "react";
import { RiEdit2Fill } from "react-icons/ri";
import AppModal from "../../../../../../Common/AppModal";
import EditableDynamicTable from "../../../../../../Common/EditableDynamicTable";
import { renderModalContent } from "../../../../../../Common/renderModalContent";
import { toCommaAndDollar } from "../../../../../../../hooks/helpers";
import PortfolioValueModal from "../PortfolioValueModal.jsx";

const TABLE_PROPS = {
  showCount: false,
  noPagination: true,
  horizontalScroll: true,
  tableStyle: { borderRadius: 12, overflow: "hidden" },
  headerFontSize: 11,
  bodyFontSize: 12,
};

const FUND_TYPE_OPTIONS = [
  { value: "Accumulation", label: "Accumulation" },
  { value: "Defined Benefit", label: "Defined Benefit" },
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

function hasMeaningfulValues(initialValues = {}) {
  return Object.values(initialValues || {}).some((value) => {
    if (Array.isArray(value)) return value.length > 0;
    return String(value ?? "").trim() !== "";
  });
}

export default function SuperFundsBalanceBenefitModal({ modalData }) {
  const [form] = Form.useForm();
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailModalData, setDetailModalData] = useState(null);
  const initialValues = useMemo(
    () => modalData?.initialValues?.balanceBenefitDetails || {},
    [modalData],
  );
  const [editing, setEditing] = useState(
    () => !hasMeaningfulValues(initialValues),
  );

  const fundType = Form.useWatch("fundType", form);
  const portfolioValue = Form.useWatch("portfolioValue", form);
  const commencementDate = Form.useWatch("commencementDate", form);
  const eligibleServiceDate = Form.useWatch("eligibleServiceDate", form);
  const taxFreeComponent = Form.useWatch("taxFreeComponent", form);
  const taxableComponent = Form.useWatch("taxableComponent", form);
  const restrictedNonPreserved = Form.useWatch("restrictedNonPreserved", form);
  const unrestrictedNonPreserved = Form.useWatch(
    "unrestrictedNonPreserved",
    form,
  );
  const preservedAmount = Form.useWatch("preservedAmount", form);

  useEffect(() => {
    form.setFieldsValue(initialValues);
    setEditing(!hasMeaningfulValues(initialValues));
  }, [form, initialValues]);

  const rowData = useMemo(
    () => [
      {
        key: "balance-benefit",
        formPath: [],
        rowNumber: 1,
        fundType: fundType ?? initialValues?.fundType ?? "",
        portfolioValue: portfolioValue ?? initialValues?.portfolioValue ?? "",
        commencementDate:
          commencementDate ?? initialValues?.commencementDate ?? "",
        eligibleServiceDate:
          eligibleServiceDate ?? initialValues?.eligibleServiceDate ?? "",
        taxFreeComponent:
          taxFreeComponent ?? initialValues?.taxFreeComponent ?? "",
        taxableComponent:
          taxableComponent ?? initialValues?.taxableComponent ?? "",
        restrictedNonPreserved:
          restrictedNonPreserved ?? initialValues?.restrictedNonPreserved ?? "",
        unrestrictedNonPreserved:
          unrestrictedNonPreserved ??
          initialValues?.unrestrictedNonPreserved ??
          "",
        preservedAmount:
          preservedAmount ?? initialValues?.preservedAmount ?? "",
      },
    ],
    [
      commencementDate,
      eligibleServiceDate,
      fundType,
      initialValues,
      portfolioValue,
      preservedAmount,
      restrictedNonPreserved,
      taxableComponent,
      taxFreeComponent,
      unrestrictedNonPreserved,
    ],
  );

  const recalculate = (currentForm, columnField, changedValue) => {
    if (columnField === "taxFreeComponent") {
      currentForm.setFieldValue(
        "taxFreeComponent",
        formatCurrencyValue(changedValue),
      );
    }
    if (columnField === "restrictedNonPreserved") {
      currentForm.setFieldValue(
        "restrictedNonPreserved",
        formatCurrencyValue(changedValue),
      );
    }
    if (columnField === "unrestrictedNonPreserved") {
      currentForm.setFieldValue(
        "unrestrictedNonPreserved",
        formatCurrencyValue(changedValue),
      );
    }

    const nextPortfolioValue = parseCurrencyValue(
      currentForm.getFieldValue("portfolioValue"),
    );
    const nextTaxFree = parseCurrencyValue(
      currentForm.getFieldValue("taxFreeComponent"),
    );
    const nextRestricted = parseCurrencyValue(
      currentForm.getFieldValue("restrictedNonPreserved"),
    );
    const nextUnrestricted = parseCurrencyValue(
      currentForm.getFieldValue("unrestrictedNonPreserved"),
    );

    currentForm.setFieldValue(
      "taxableComponent",
      nextPortfolioValue
        ? toCommaAndDollar(nextPortfolioValue - nextTaxFree)
        : "",
    );
    currentForm.setFieldValue(
      "preservedAmount",
      nextPortfolioValue
        ? toCommaAndDollar(
            nextPortfolioValue - (nextRestricted + nextUnrestricted),
          )
        : "",
    );
  };

  const openPortfolioModal = ({ form: currentForm }) => {
    setDetailModalOpen(true);
    setDetailModalData({
      title: `${modalData?.fundLabel || "Fund"} Portfolio Value`,
      width: 750,
      component: <PortfolioValueModal />,
      parentForm: currentForm,
      fieldPath: [],
      initialValues: currentForm.getFieldsValue(true),
      platform: modalData?.platform,
      tableRows: 50,
      closeModal: () => {
        setDetailModalOpen(false);
        setEditing(true);
      },
    });
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
      title: "Fund Type",
      dataIndex: "fundType",
      key: "fundType",
      field: "fundType",
      type: "select",
      // width: 100,
      options: FUND_TYPE_OPTIONS,
    },
    {
      title: "Portfolio Value",
      dataIndex: "portfolioValue",
      key: "portfolioValue",
      field: "portfolioValue",
      disabled: true,
      type: "input-action",
      placeholder: "Portfolio Value",
      action: {
        name: "Open Portfolio Value",
        onClick: openPortfolioModal,
      },
    },
    {
      title: "Commencement Date",
      dataIndex: "commencementDate",
      key: "commencementDate",
      field: "commencementDate",
      type: "date",
    },
    {
      title: "Eligible Service Date",
      dataIndex: "eligibleServiceDate",
      key: "eligibleServiceDate",
      field: "eligibleServiceDate",
      type: "date",
    },
    {
      title: "Tax Free Component",
      dataIndex: "taxFreeComponent",
      key: "taxFreeComponent",
      field: "taxFreeComponent",
      type: "text",
      placeholder: "Tax Free Component",
      onChange: (value, record, column, currentForm) =>
        recalculate(currentForm, column.field, value?.target?.value),
    },
    {
      title: "Taxable Component",
      dataIndex: "taxableComponent",
      key: "taxableComponent",
      field: "taxableComponent",
      type: "text",
      disabled: true,
      placeholder: "Taxable Component",
    },
    {
      title: "Restricted Non Preserved",
      dataIndex: "restrictedNonPreserved",
      key: "restrictedNonPreserved",
      field: "restrictedNonPreserved",
      type: "text",
      placeholder: "Restricted Non Preserved",
      onChange: (value, record, column, currentForm) =>
        recalculate(currentForm, column.field, value?.target?.value),
    },
    {
      title: "Unrestricted Non Preserved",
      dataIndex: "unrestrictedNonPreserved",
      key: "unrestrictedNonPreserved",
      field: "unrestrictedNonPreserved",
      type: "text",
      placeholder: "Unrestricted Non Preserved",
      onChange: (value, record, column, currentForm) =>
        recalculate(currentForm, column.field, value?.target?.value),
    },
    {
      title: "Preserved Amount",
      dataIndex: "preservedAmount",
      key: "preservedAmount",
      field: "preservedAmount",
      type: "text",
      disabled: true,
      placeholder: "Preserved Amount",
    },
  ];

  const handleConfirmAndExit = async () => {
    const values = form.getFieldsValue(true);
    const currentRow =
      modalData?.parentForm?.getFieldValue?.(modalData?.fieldPath) || {};
    const updatedRow = {
      ...currentRow,
      balanceBenefitDetails: values,
      balanceBenefit: values?.portfolioValue || "",
    };

    modalData?.parentForm?.setFieldValue?.(modalData?.fieldPath, updatedRow);
    setEditing(false);
    modalData?.closeModal?.();
  };

  return (
    <div style={{ padding: "16px 4px 0px 4px" }}>
      <AppModal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={detailModalData?.title}
        width={detailModalData?.width || 900}
      >
        {renderModalContent(detailModalData)}
      </AppModal>

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
