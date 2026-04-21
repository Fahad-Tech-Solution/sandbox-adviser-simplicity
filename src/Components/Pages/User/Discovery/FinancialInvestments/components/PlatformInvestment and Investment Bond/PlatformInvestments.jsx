import { Button, Col, Form, Row, Select, Space, message } from "antd";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAtomValue } from "jotai";
import { RiEdit2Fill } from "react-icons/ri";
import AppModal from "../../../../../../Common/AppModal";
import EditableDynamicTable from "../../../../../../Common/EditableDynamicTable";
import { InvestmentOffersData } from "../../../../../../../store/authState";
import { toCommaAndDollar } from "../../../../../../../hooks/helpers";
import PortfolioValueModal from ".././PortfolioValueModal";
import ServiceFeeModal from ".././ServiceFeeModal";
import { renderModalContent } from "../../../../../../Common/renderModalContent";

const TABLE_PROPS = {
  showCount: false,
  noPagination: true,
  pageSize: 10,
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

function normalizeSelectValue(value) {
  return value === null || value === undefined || value === ""
    ? ""
    : String(value);
}

function buildInitialValues(ownerArray = []) {
  return {
    NumberOfMap: ownerArray.length || undefined,
    managedFunds: ownerArray,
  };
}

function buildManagedFundEntries(count, entries = []) {
  return Array.from({ length: count }, (_, index) => {
    const entry = entries?.[index] || {};
    const serviceFeeArray =
      entry?.serviceFeeArray && typeof entry.serviceFeeArray === "object"
        ? entry.serviceFeeArray
        : {};

    return {
      platformName: normalizeSelectValue(entry?.platformName),
      accountNumber: entry?.accountNumber || "",
      portfolioValue: entry?.portfolioValue || "",
      portfolioValueArray: Array.isArray(entry?.portfolioValueArray)
        ? entry.portfolioValueArray
        : Array.isArray(entry?.portfolioValueArray)
          ? entry?.portfolioValueArray
          : [],
      totalPortfolioCost: entry?.totalPortfolioCost || "",
      serviceFee:
        entry?.serviceFee || serviceFeeArray?.annualAdviserServiceFee || "",
      serviceFeeType:
        normalizeSelectValue(entry?.serviceFeeType) ||
        normalizeSelectValue(serviceFeeArray?.frequency),
      serviceFeeArray: {
        serviceFee: serviceFeeArray?.serviceFee || "",
        frequency: normalizeSelectValue(serviceFeeArray?.frequency),
        annualAdviserServiceFee:
          serviceFeeArray?.annualAdviserServiceFee || entry?.serviceFee || "",
      },
    };
  });
}

function hasMeaningfulValues(initialValues = {}) {
  const rows = initialValues?.managedFunds || [];
  if ((initialValues?.NumberOfMap || 0) > 0) return true;

  return rows.some((row) =>
    [
      row?.platformName,
      row?.accountNumber,
      row?.portfolioValue,
      row?.totalPortfolioCost,
      row?.serviceFee,
    ].some((value) => String(value ?? "").trim() !== ""),
  );
}

function buildPlatformOptions(investmentOffers, entries = [], key) {
  const platforms =
    ["managedFund", "familyMangedFunds","SMSFManagedFunds"].includes(key)
      ? investmentOffers?.InvestmentPlatforms
      : investmentOffers?.InvestmentBonds || [];

  const options = platforms.map((item) => ({
    value: String(item?._id ?? item?.value ?? ""),
    label: item?.platformName || item?.label || item?.name || item?._id || "",
  }));

  entries.forEach((entry) => {
    const currentValue = normalizeSelectValue(entry?.platformName);
    if (
      currentValue &&
      !options.some((option) => String(option.value) === currentValue)
    ) {
      options.unshift({ value: currentValue, label: currentValue });
    }
  });

  return options.filter((option) => option.value && option.label);
}

function getOptionLabel(options = [], value) {
  return (
    options.find((option) => String(option.value) === String(value))?.label ||
    value ||
    ""
  );
}

export default function PlatformInvestments({ modalData }) {
  const investmentOffers = useAtomValue(InvestmentOffersData);
  const [form] = Form.useForm();
  const [editing, setEditing] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailModalData, setDetailModalData] = useState(null);
  
  // console.log(modalData?.sectionKey, "modalData?.sectionKey");

  const ownerArray =
    modalData?.parentForm?.getFieldValue?.([
      modalData?.ownerKey,
      "currentBalanceArray",
    ]) || [];

  const initialValues = useMemo(
    () => buildInitialValues(ownerArray),
    [ownerArray],
  );

  const count = Form.useWatch("NumberOfMap", form);
  const managedFunds =
    Form.useWatch("managedFunds", form) || initialValues.managedFunds || [];

  const platformOptions = useMemo(
    () =>
      buildPlatformOptions(
        investmentOffers,
        initialValues?.managedFunds || [],
        modalData?.sectionKey,
      ),
    [initialValues?.managedFunds, investmentOffers, modalData],
  );

  useEffect(() => {
    form.setFieldsValue(initialValues);
    setEditing(!hasMeaningfulValues(initialValues));
  }, [form, initialValues]);

  const detailRows = useMemo(
    () =>
      buildManagedFundEntries(Number(count) || 0, managedFunds).map(
        (item, index) => ({
          key: `${modalData?.ownerKey || "owner"}-platform-${index}`,
          formPath: ["managedFunds", index],
          rowNumber: index + 1,
          ...item,
        }),
      ),
    [count, managedFunds, modalData?.ownerKey],
  );

  const syncParentValues = (nextEntries) => {
    const totalBalance = nextEntries.reduce(
      (total, item) => total + parseCurrencyValue(item?.portfolioValue),
      0,
    );
    const totalCostBase = nextEntries.reduce(
      (total, item) => total + parseCurrencyValue(item?.totalPortfolioCost),
      0,
    );

    modalData?.parentForm?.setFieldValue?.(
      [modalData?.ownerKey, "currentBalanceArray"],
      nextEntries,
    );
    modalData?.parentForm?.setFieldValue?.(
      [modalData?.ownerKey, "currentBalance"],
      totalBalance ? toCommaAndDollar(totalBalance) : "",
    );
    modalData?.parentForm?.setFieldValue?.(
      [modalData?.ownerKey, "costBase"],
      totalCostBase ? toCommaAndDollar(totalCostBase) : "",
    );
  };

  const handleCountChange = (nextValue) => {
    const nextCount = Number(nextValue) || 0;
    form.setFieldValue("NumberOfMap", nextValue);
    form.setFieldValue(
      "managedFunds",
      buildManagedFundEntries(nextCount, managedFunds),
    );
  };

  const handleRemoveRow = (rowIndex) => {
    const currentEntries = form.getFieldValue("managedFunds") || [];
    const nextEntries = currentEntries.filter((_, index) => index !== rowIndex);
    const nextCount = nextEntries.length;

    form.setFieldValue("managedFunds", nextEntries);
    form.setFieldValue("NumberOfMap", nextCount || undefined);
  };

  const openPortfolioModal = useCallback(
    ({ record, form: currentForm }) => {
      const rowValues = currentForm.getFieldValue(record?.formPath) || {};

      const selectedPlatform = normalizeSelectValue(rowValues?.platformName);

      if (!selectedPlatform) {
        message.error("Please select platform name first");
        return;
      }
     
      const platform = [
        "managedFund",
        "familyMangedFunds",
        "SMSFManagedFunds",
      ].includes(modalData?.sectionKey)
        ? investmentOffers?.InvestmentPlatforms?.find(
            (item) => String(item?._id) === selectedPlatform,
          ) || null
        : investmentOffers?.InvestmentBonds?.find(
            (item) => String(item?._id) === selectedPlatform,
          ) || null;

      setDetailModalOpen(true);
      setDetailModalData({
        type: "portfolio",
        title: `${modalData?.ownerLabel || "Owner"} ${getOptionLabel(
          platformOptions,
          selectedPlatform,
        )} Portfolio Value`.trim(),
        width: 900,
        parentForm: currentForm,
        component: <PortfolioValueModal />,
        fieldPath: record?.formPath || [],
        initialValues: rowValues,
        platform,
        tableRows: 50,
        closeModal: () => {
          setDetailModalOpen(false);
          setEditing(true);
        },
      });
    },
    [
      investmentOffers?.InvestmentPlatforms,
      modalData?.ownerLabel,
      platformOptions,
    ],
  );

  const openServiceFeeModal = useCallback(
    ({ record, form: currentForm }) => {
      const rowValues = currentForm.getFieldValue(record?.formPath) || {};

      setDetailModalOpen(true);
      setDetailModalData({
        type: "serviceFee",
        title: `${modalData?.ownerLabel || "Owner"} Ongoing Annual Fee`,
        width: 720,
        component: <ServiceFeeModal />,
        parentForm: currentForm,
        fieldPath: record?.formPath || [],
        initialValues: rowValues,
        closeModal: () => {
          setDetailModalOpen(false);
          setEditing(true);
        },
      });
    },
    [modalData?.ownerLabel],
  );

  const columns = [
    {
      title: "No#",
      dataIndex: "rowNumber",
      key: "rowNumber",
      width: 50,
      editable: false,
    },
    {
      title: "Platform Name",
      dataIndex: "platformName",
      key: "platformName",
      field: "platformName",
      type: "select",
      options: platformOptions,
      placeholder: "Select Platform",
      onChange: (value, record, column, currentForm) => {
        const nextValue = normalizeSelectValue(value);
        const currentValue = normalizeSelectValue(
          currentForm.getFieldValue([...record.formPath, column.field]),
        );

        currentForm.setFieldValue(
          [...record.formPath, column.field],
          nextValue,
        );

        if (currentValue && currentValue !== nextValue) {
          currentForm.setFieldValue([...record.formPath, "portfolioArray"], []);
          currentForm.setFieldValue([...record.formPath, "portfolioValue"], "");
        }
      },
    },
    {
      title: "Account Number",
      dataIndex: "accountNumber",
      key: "accountNumber",
      field: "accountNumber",
      type: "text",
      placeholder: "Account Number",
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
      title: "Total Cost Base",
      dataIndex: "totalPortfolioCost",
      key: "totalPortfolioCost",
      field: "totalPortfolioCost",
      type: "text",
      placeholder: "Portfolio Cost Base",
      onChange: (value, record, column, currentForm) => {
        currentForm.setFieldValue(
          [...record.formPath, column.field],
          formatCurrencyValue(value?.target?.value),
        );
      },
    },
    {
      title: "Ongoing Advice Fee",
      dataIndex: "serviceFee",
      key: "serviceFee",
      component: <ServiceFeeModal />,
      field: "serviceFee",
      disabled: true,
      type: "input-action",
      placeholder: "Ongoing Advice Fee",
      action: {
        name: "Open Ongoing Fee",
        onClick: openServiceFeeModal,
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

  const handleConfirmAndExit = async () => {
    const values = form.getFieldsValue(true);
    const countValue = Number(values?.NumberOfMap) || 0;

    const savedEntries = buildManagedFundEntries(
      countValue,
      values?.managedFunds || [],
    );

    syncParentValues(savedEntries);
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
          <Col xs={24} md={12}>
            <Form.Item
              label="Number of Platform Investments"
              name="NumberOfMap"
              style={{ marginBottom: 0 }}
            >
              <Select
                placeholder="Select"
                onChange={handleCountChange}
                disabled={!editing}
                style={{ width: "100%", borderRadius: "8px" }}
                options={Array.from(
                  { length: modalData?.tableRows || 50 },
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
              columns={columns}
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
