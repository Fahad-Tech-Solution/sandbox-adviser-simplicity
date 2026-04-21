import { Button, Col, Form, Row, Select, Space, message } from "antd";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAtomValue } from "jotai";
import { RiEdit2Fill } from "react-icons/ri";
import AppModal from "../../../../../../Common/AppModal";
import EditableDynamicTable from "../../../../../../Common/EditableDynamicTable";
import { renderModalContent } from "../../../../../../Common/renderModalContent";
import { InvestmentOffersData } from "../../../../../../../store/authState";
import { toCommaAndDollar } from "../../../../../../../hooks/helpers";
import AnnualAdviceModal from "../SuperFunds/AnnualAdviceModal.jsx";
import BeneficiariesModal from "../SuperFunds/BeneficiariesModal.jsx";
import AcountBalanceBenefit from "./AcountBalanceBenefit.jsx";

const TABLE_PROPS = {
  showCount: false,
  noPagination: true,
  pageSize: 5,
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

function normalizeSelectValue(value) {
  return value === null || value === undefined || value === ""
    ? ""
    : String(value);
}

function buildInitialValues(ownerArray = []) {
  return {
    NumberOfMap: ownerArray.length || undefined,
    accountBasedPensions: ownerArray,
  };
}

function buildAccountBasedPensionEntries(count, entries = []) {
  return Array.from({ length: count }, (_, index) => {
    const entry = entries?.[index] || {};
    return {
      platformName: normalizeSelectValue(entry?.platformName),
      memberNumber: entry?.memberNumber || "",
      balanceBenefit: entry?.balanceBenefit || "",
      balanceBenefitDetails:
        entry?.balanceBenefitDetails &&
        typeof entry.balanceBenefitDetails === "object"
          ? entry.balanceBenefitDetails
          : {},
      pensionPayment: entry?.pensionPayment || "",
      pensionPaymentArray:
        entry?.pensionPaymentArray && typeof entry.pensionPaymentArray === "object"
          ? entry.pensionPaymentArray
          : {},
      nominatedBeneficiaries: entry?.nominatedBeneficiaries || "No",
      nominatedBeneficiariesDetails:
        entry?.nominatedBeneficiariesDetails &&
        typeof entry.nominatedBeneficiariesDetails === "object"
          ? entry.nominatedBeneficiariesDetails
          : {},
      annualAdvice: entry?.annualAdvice || "",
      annualAdviceArray:
        entry?.annualAdviceArray && typeof entry.annualAdviceArray === "object"
          ? entry.annualAdviceArray
          : {},
    };
  });
}

function hasMeaningfulValues(initialValues = {}) {
  const rows = initialValues?.accountBasedPensions || [];
  if ((initialValues?.NumberOfMap || 0) > 0) return true;

  return rows.some((row) =>
    [
      row?.platformName,
      row?.memberNumber,
      row?.balanceBenefit,
      row?.pensionPayment,
      row?.nominatedBeneficiaries,
      row?.annualAdvice,
    ].some((value) => String(value ?? "").trim() !== ""),
  );
}

function buildFundOptions(investmentOffers, entries = []) {
  const funds = investmentOffers?.AccountBasedPensions || [];
  const options = funds.map((item) => ({
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

function SwitchPopupDisplay({ value, onClick }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span>{value || "No"}</span>
      {value === "Yes" ? (
        <Button
          type="primary"
          size="small"
          style={{ width: 25, padding: 0 }}
          onClick={onClick}
        >
          ↗
        </Button>
      ) : null}
    </div>
  );
}

export default function AccountBasedPension({ modalData }) {
  const investmentOffers = useAtomValue(InvestmentOffersData);
  const [form] = Form.useForm();
  const [editing, setEditing] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailModalData, setDetailModalData] = useState(null);

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
  const watchedPensions = Form.useWatch("accountBasedPensions", form);
  const fundOptions = useMemo(
    () => buildFundOptions(investmentOffers, initialValues?.accountBasedPensions || []),
    [initialValues?.accountBasedPensions, investmentOffers],
  );

  useEffect(() => {
    form.setFieldsValue(initialValues);
    setEditing(!hasMeaningfulValues(initialValues));
  }, [form, initialValues]);

  const getStoredPensions = useCallback(
    () =>
      form.getFieldValue("accountBasedPensions") ||
      initialValues.accountBasedPensions ||
      [],
    [form, initialValues.accountBasedPensions],
  );

  const rows = useMemo(
    () =>
      buildAccountBasedPensionEntries(
        Number(count) || 0,
        getStoredPensions(),
      ).map((item, index) => ({
        key: `${modalData?.ownerKey || "owner"}-abp-${index}`,
        formPath: ["accountBasedPensions", index],
        rowNumber: index + 1,
        ...item,
      })),
    [count, getStoredPensions, modalData?.ownerKey, watchedPensions],
  );

  const syncParentValues = (nextEntries) => {
    const totalBalance = nextEntries.reduce(
      (total, item) => total + parseCurrencyValue(item?.balanceBenefit),
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
  };

  const handleCountChange = (nextValue) => {
    const nextCount = Number(nextValue) || 0;
    form.setFieldValue("NumberOfMap", nextValue);
    form.setFieldValue(
      "accountBasedPensions",
      buildAccountBasedPensionEntries(nextCount, getStoredPensions()),
    );
  };

  const handleRemoveRow = (rowIndex) => {
    const currentEntries = form.getFieldValue("accountBasedPensions") || [];
    const nextEntries = currentEntries.filter((_, index) => index !== rowIndex);
    const nextCount = nextEntries.length;

    form.setFieldValue("accountBasedPensions", nextEntries);
    form.setFieldValue("NumberOfMap", nextCount || undefined);
  };

  const openDetailModal = useCallback(
    (type, { record, form: currentForm }) => {
      const rowValues = currentForm.getFieldValue(record?.formPath) || {};
      const selectedFund = normalizeSelectValue(rowValues?.platformName);

      if (!selectedFund) {
        message.error("Please select fund name first");
        return;
      }

      const fund =
        investmentOffers?.AccountBasedPensions?.find(
          (item) => String(item?._id) === selectedFund,
        ) || null;

      const fundLabel = getOptionLabel(fundOptions, selectedFund);
      const commonData = {
        parentForm: currentForm,
        fieldPath: record?.formPath || [],
        initialValues: rowValues,
        fundLabel,
        platform: fund,
        closeModal: () => {
          setDetailModalOpen(false);
          setEditing(true);
        },
      };

      const detailMap = {
        balanceBenefit: {
          title: `${modalData?.ownerLabel || "Owner"} ${fundLabel} Balance and Details`,
          width: 1500,
          component: <AcountBalanceBenefit />,
        },
        pensionPayment: {
          title: `${modalData?.ownerLabel || "Owner"} ${fundLabel} Annual Pension Payment`,
          width: 760,
          component: <AnnualAdviceModal />,
          valueKey: "pensionPayment",
          arrayKey: "pensionPaymentArray",
          feeLabel: "Pension Payment",
          totalLabel: "Annual Pension Payment",
        },
        nominatedBeneficiaries: {
          title: `${modalData?.ownerLabel || "Owner"} ${fundLabel} Beneficiaries`,
          width: 1180,
          component: <BeneficiariesModal />,
        },
        annualAdvice: {
          title: `${modalData?.ownerLabel || "Owner"} ${fundLabel} Ongoing Annual Fee`,
          width: 760,
          component: <AnnualAdviceModal />,
          valueKey: "annualAdvice",
          arrayKey: "annualAdviceArray",
          feeLabel: "Ongoing Fee",
          totalLabel: "Annual Ongoing Fee",
        },
      };

      setDetailModalOpen(true);
      setDetailModalData({
        ...commonData,
        ...(detailMap[type] || {}),
      });
    },
    [fundOptions, investmentOffers?.AccountBasedPensions, modalData?.ownerLabel],
  );

  const columns = [
    {
      title: "No#",
      dataIndex: "rowNumber",
      key: "rowNumber",
      width: 60,
      editable: false,
    },
    {
      title: "Fund Name",
      dataIndex: "platformName",
      key: "platformName",
      field: "platformName",
      type: "select",
      options: fundOptions,
      placeholder: "Select Fund",
      onChange: (value, record, column, currentForm) => {
        const nextValue = normalizeSelectValue(value);
        const currentValue = normalizeSelectValue(
          currentForm.getFieldValue([...record.formPath, column.field]),
        );

        currentForm.setFieldValue([...record.formPath, column.field], nextValue);

        if (currentValue && currentValue !== nextValue) {
          currentForm.setFieldValue([...record.formPath], {
            platformName: nextValue,
            memberNumber: "",
            balanceBenefit: "",
            balanceBenefitDetails: {},
            pensionPayment: "",
            pensionPaymentArray: {},
            nominatedBeneficiaries: "No",
            nominatedBeneficiariesDetails: {},
            annualAdvice: "",
            annualAdviceArray: {},
          });
        }
      },
    },
    {
      title: "Member Number",
      dataIndex: "memberNumber",
      key: "memberNumber",
      field: "memberNumber",
      type: "text",
      placeholder: "Member Number",
    },
    {
      title: "Balance and Details",
      dataIndex: "balanceBenefit",
      key: "balanceBenefit",
      field: "balanceBenefit",
      disabled: true,
      type: "input-action",
      placeholder: "Balance Benefit",
      action: {
        name: "Open Balance and Details",
        onClick: (payload) => openDetailModal("balanceBenefit", payload),
      },
    },
    {
      title: "Annual Pension Payment",
      dataIndex: "pensionPayment",
      key: "pensionPayment",
      field: "pensionPayment",
      disabled: true,
      type: "input-action",
      placeholder: "Pension Payment",
      action: {
        name: "Open Annual Pension Payment",
        onClick: (payload) => openDetailModal("pensionPayment", payload),
      },
    },
    {
      title: "Beneficiaries",
      dataIndex: "nominatedBeneficiaries",
      key: "nominatedBeneficiaries",
      field: "nominatedBeneficiaries",
      type: "yesNoSwitchWithButton",
      action: {
        name: "Open Beneficiaries",
        onClick: (payload) =>
          openDetailModal("nominatedBeneficiaries", payload),
      },
      renderView: ({ value, record }) => (
        <SwitchPopupDisplay
          value={value}
          onClick={() =>
            openDetailModal("nominatedBeneficiaries", { record, form })
          }
        />
      ),
    },
    {
      title: "Ongoing Advice Fee",
      dataIndex: "annualAdvice",
      key: "annualAdvice",
      field: "annualAdvice",
      disabled: true,
      type: "input-action",
      placeholder: "Ongoing Advice Fee",
      action: {
        name: "Open Ongoing Fee",
        onClick: (payload) => openDetailModal("annualAdvice", payload),
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
    const savedEntries = buildAccountBasedPensionEntries(
      countValue,
      values?.accountBasedPensions || [],
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
        width={detailModalData?.width || 1000}
      >
        {renderModalContent(detailModalData)}
      </AppModal>

      <Form form={form} initialValues={initialValues} requiredMark={false}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Form.Item
              label="Number of Account Based Pensions"
              name="NumberOfMap"
              style={{ marginBottom: 0 }}
            >
              <Select
                placeholder="Select"
                onChange={handleCountChange}
                disabled={!editing}
                style={{ width: "100%", borderRadius: "8px" }}
                options={Array.from(
                  { length: modalData?.tableRows || 3 },
                  (_, index) => ({ value: index + 1, label: index + 1 }),
                )}
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
