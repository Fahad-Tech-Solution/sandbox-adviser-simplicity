import { Button, Col, Form, Row, Select, Space } from "antd";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RiEdit2Fill } from "react-icons/ri";
import EditableDynamicTable from "../../../../../Common/EditableDynamicTable";
import { toCommaAndDollar } from "../../../../../../hooks/helpers";

const TABLE_PROPS = {
  showCount: false,
  noPagination: false,
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

function hasMeaningfulValues(initialValues = {}) {
  const rows = initialValues?.investments || [];
  if ((initialValues?.NumberOfMap || 0) > 0) return true;

  return rows.some((row) =>
    [row?.investmentOption, row?.investmentCode, row?.investmentValue].some(
      (value) => String(value ?? "").trim() !== "",
    ),
  );
}

function buildPortfolioEntries(count, entries = []) {
  return Array.from({ length: count }, (_, index) => ({
    investmentOption: normalizeSelectValue(entries?.[index]?.investmentOption),
    investmentCode: entries?.[index]?.investmentCode || "",
    investmentValue: entries?.[index]?.investmentValue || "",
  }));
}

function buildOfferOptions(platform, entries = []) {
  const offers = platform?.arrayOfOffers || [];
  const options = offers.map((offer) => ({
    value: String(offer?._id ?? offer?.value ?? ""),
    label:
      offer?.investmentName && offer?.investmentCode
        ? `${offer.investmentName} (${offer.investmentCode})`
        : offer?.investmentName || offer?.investmentCode || offer?._id || "",
  }));

  entries.forEach((entry) => {
    const currentValue = normalizeSelectValue(entry?.investmentOption);
    if (
      currentValue &&
      !options.some((option) => String(option.value) === currentValue)
    ) {
      options.unshift({ value: currentValue, label: currentValue });
    }
  });

  return options.filter((option) => option.value && option.label);
}

export default function PortfolioValueModal({ modalData }) {
  const [form] = Form.useForm();
  const initialValues = useMemo(
    () => ({
      NumberOfMap:
        (modalData?.initialValues?.portfolioArray ||
          modalData?.initialValues?.portfolioValueArray ||
          []).length ||
        undefined,
      investments:
        modalData?.initialValues?.portfolioArray ||
        modalData?.initialValues?.portfolioValueArray ||
        [],
    }),
    [modalData],
  );
  const [editing, setEditing] = useState(
    () => !hasMeaningfulValues(initialValues),
  );

  const count = Form.useWatch("NumberOfMap", form);

  const investments =
    Form.useWatch("investments", form) || initialValues.investments || [];
    
  const offerOptions = useMemo(
    () =>
      buildOfferOptions(modalData?.platform, initialValues?.investments || []),
    [initialValues?.investments, modalData?.platform],
  );

  useEffect(() => {
    form.setFieldsValue(initialValues);
    setEditing(!(initialValues?.investments || []).length);
  }, [form, initialValues]);

  const getOfferCode = useCallback(
    (offerId) =>
      modalData?.platform?.arrayOfOffers?.find(
        (offer) => String(offer?._id) === String(offerId),
      )?.investmentCode || "",
    [modalData?.platform],
  );

  const detailRows = useMemo(
    () =>
      buildPortfolioEntries(Number(count) || 0, investments).map(
        (item, index) => ({
          key: `portfolio-${index}`,
          formPath: ["investments", index],
          rowNumber: index + 1,
          ...item,
        }),
      ),
    [count, investments],
  );

  const handleCountChange = (nextValue) => {
    const nextCount = Number(nextValue) || 0;
    form.setFieldValue("NumberOfMap", nextValue);
    form.setFieldValue(
      "investments",
      buildPortfolioEntries(nextCount, investments),
    );
  };

  const handleRemoveRow = (rowIndex) => {
    const currentEntries = form.getFieldValue("investments") || [];
    const nextEntries = currentEntries.filter((_, index) => index !== rowIndex);
    const nextCount = nextEntries.length;

    form.setFieldValue("investments", nextEntries);
    form.setFieldValue("NumberOfMap", nextCount || undefined);
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
      title: "Investment Option",
      dataIndex: "investmentOption",
      key: "investmentOption",
      field: "investmentOption",
      type: "select",
      options: offerOptions,
      placeholder: "Select Investment Option",
      onChange: (value, record, column, currentForm) => {
        const selectedValue = normalizeSelectValue(value);
        currentForm.setFieldValue(
          [...record.formPath, column.field],
          selectedValue,
        );
        currentForm.setFieldValue(
          [...record.formPath, "investmentCode"],
          getOfferCode(selectedValue),
        );
      },
    },
    {
      title: "Investment Code",
      dataIndex: "investmentCode",
      key: "investmentCode",
      field: "investmentCode",
      type: "text",
      disabled: true,
      placeholder: "Investment Code",
    },
    {
      title: "Investment Value",
      dataIndex: "investmentValue",
      key: "investmentValue",
      field: "investmentValue",
      type: "text",
      placeholder: "Investment Value",
      onChange: (value, record, column, currentForm) => {
        currentForm.setFieldValue(
          [...record.formPath, column.field],
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
          aria-label={`Remove portfolio row ${record?.rowNumber}`}
          onClick={() => handleRemoveRow((record?.rowNumber || 1) - 1)}
        >
          🗑️
        </Button>
      ),
    },
  ];

  const handleConfirmAndExit = async () => {
    const values = await form.validateFields();
    const countValue = Number(values?.NumberOfMap) || 0;
    const savedEntries = buildPortfolioEntries(
      countValue,
      values?.investments || [],
    );

    const totalValue = savedEntries.reduce(
      (total, item) => total + parseCurrencyValue(item?.investmentValue),
      0,
    );

    const currentRow =
      modalData?.parentForm?.getFieldValue?.(modalData?.fieldPath) || {};
    const updatedRow = {
      ...currentRow,
      portfolioArray: savedEntries,
      portfolioValueArray: savedEntries,
      portfolioValue: totalValue ? toCommaAndDollar(totalValue) : "",
    };

    if (Array.isArray(modalData?.fieldPath) && modalData.fieldPath.length > 0) {
      modalData?.parentForm?.setFieldValue?.(modalData.fieldPath, updatedRow);
    } else {
      modalData?.parentForm?.setFieldsValue?.(updatedRow);
    }

    setEditing(false);
    modalData?.closeModal?.();
  };

  return (
    <div style={{ padding: "16px 4px 0px 4px" }}>
      <Form form={form} initialValues={initialValues} requiredMark={false}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={10}>
            <Form.Item
              label="Number of Investments"
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
