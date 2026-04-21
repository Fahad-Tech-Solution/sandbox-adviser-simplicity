import {
  Button,
  Collapse,
  Col,
  Form,
  Row,
  Space,
  Typography,
  message,
} from "antd";
import { useAtomValue, useSetAtom } from "jotai";
import React, { useEffect, useMemo, useState } from "react";
import { RiEdit2Fill } from "react-icons/ri";
import EditableDynamicTable from "../../../../../../Common/EditableDynamicTable.jsx";
import { discoveryDataAtom } from "../../../../../../../store/authState";
import { toCommaAndDollar } from "../../../../../../../hooks/helpers";
import useApi from "../../../../../../../hooks/useApi.js";

const { Title } = Typography;

const SECTION_KEY = "generalLivingExpenses";

const TABLE_PROPS = {
  showCount: false,
  noPagination: true,
  horizontalScroll: true,
  tableStyle: { borderRadius: 12, overflow: "hidden" },
  headerFontSize: 11,
  bodyFontSize: 12,
};

const FREQUENCY_OPTIONS = [
  { value: "52", label: "Weekly" },
  { value: "26", label: "Fortnightly" },
  { value: "12", label: "Monthly" },
  { value: "4", label: "Quarterly" },
  { value: "2", label: "Half Yearly" },
  { value: "1", label: "Annually" },
];

const SECTION_DEFINITIONS = [
  {
    key: "household",
    icon: "🏠",
    title: "Household Expenses",
    items: [
      { name: "Rent", id: "houseHoldRent" },
      { name: "Gas", id: "houseHoldGas" },
      { name: "Electricity", id: "houseHoldElectricity" },
      { name: "Water Rates", id: "houseHoldWaterRates" },
      { name: "Council Rates", id: "houseHoldCouncilRates" },
      { name: "Phone", id: "houseHoldPhone" },
      { name: "Food", id: "houseHoldFood" },
      { name: "Internet", id: "houseHoldInternet" },
      { name: "Other", id: "houseHoldOthers" },
    ],
  },
  {
    key: "personal",
    icon: "🧍",
    title: "Personal Expenses",
    items: [
      { name: "Clothing", id: "personalClothing" },
      { name: "Cigarettes", id: "personalCigarettes" },
      { name: "Alcohol", id: "personalAlcohol" },
      { name: "Subscription Fees", id: "personalSubscriptionFees" },
      { name: "Memberships & Clubs", id: "personalClubMemberships" },
      { name: "Holidays", id: "personalHolidays" },
      { name: "Dining Out", id: "personalDiningOut" },
      { name: "Mobile Phone", id: "personalMobilePhone" },
      { name: "Medical Expenses", id: "personalMedicalExpenses" },
      { name: "Other", id: "personalOthers" },
    ],
  },
  {
    key: "transport",
    icon: "🚗",
    title: "Transport Expenses",
    items: [
      { name: "Petrol", id: "transportPetrol" },
      { name: "Car Maintenance", id: "transportCarRepair" },
      { name: "Car Registration", id: "transportCarRegistration" },
      { name: "Public Transport", id: "publicTransport" },
      { name: "Other", id: "transportOthers" },
    ],
  },
  {
    key: "insurance",
    icon: "🩺",
    title: "Insurance Expenses",
    items: [
      { name: "Home And Contents", id: "insuranceHomeContents" },
      { name: "Car", id: "insuranceCar" },
      { name: "Private Health", id: "insurancePrivateHealth" },
      { name: "Life/TPD/Trauma", id: "insuranceLife" },
      { name: "Income Protection", id: "insuranceIncomeProtection" },
      { name: "Other", id: "insuranceOthers" },
    ],
  },
];

function parseCurrencyNumber(value) {
  return Number(String(value ?? "").replace(/[^0-9.-]/g, "")) || 0;
}

function formatCurrencyValue(value) {
  const numeric = parseCurrencyNumber(value);
  return numeric ? toCommaAndDollar(numeric) : "";
}

function buildSectionRows(items = [], existing = {}) {
  return items.map((item, index) => {
    const amount = existing?.[item.id] || "";
    const frequency = existing?.[`${item.id}Type`]
      ? String(existing[`${item.id}Type`])
      : undefined;

    return {
      key: `${item.name}_${index}`,
      dbKey: item.id,
      name: item.name,
      amount,
      frequency,
    };
  });
}

function buildInitialValues(sectionData = {}) {
  return SECTION_DEFINITIONS.reduce((acc, section) => {
    acc[section.key] = buildSectionRows(section.items, sectionData);
    return acc;
  }, {});
}

function calculateRowTotal(amount, frequency) {
  if (!amount || !frequency) return "";
  return toCommaAndDollar(parseCurrencyNumber(amount) * Number(frequency));
}

function buildPayload(values, existing, clientFK) {
  const payload = {
    ...(existing && typeof existing === "object" ? existing : {}),
    clientFK: existing?.clientFK || clientFK,
  };

  let grandTotal = 0;

  SECTION_DEFINITIONS.forEach((section) => {
    section.items.forEach((definition, index) => {
      const item = values?.[section.key]?.[index] || {};
      const amount = item.amount || "";
      const frequency = item.frequency || "";

      payload[definition.id] = amount;
      payload[`${definition.id}Type`] = frequency;
      grandTotal +=
        parseCurrencyNumber(formatCurrencyValue(amount)) * Number(frequency || 0);
    });
  });

  payload.generalLivingExpensesTotal = grandTotal
    ? toCommaAndDollar(grandTotal)
    : "";

  return payload;
}

const COLUMNS = [
  {
    title: "Expense Type",
    dataIndex: "name",
    key: "name",
    editable: false,
  },
  {
    title: "Amount ($)",
    dataIndex: "amount",
    key: "amount",
    field: "amount",
    type: "text",
    placeholder: "Enter Amount",
    onChange: (value, record, column, form) => {
      const formatted = formatCurrencyValue(value?.target?.value);
      form.setFieldValue([...record.formPath, column.field], formatted);
    },
  },
  {
    title: "Frequency",
    dataIndex: "frequency",
    key: "frequency",
    field: "frequency",
    type: "select",
    options: FREQUENCY_OPTIONS,
    onChange: (value, record, column, form) => {
      form.setFieldValue([...record.formPath, column.field], value);
    },
  },
  {
    title: "Total",
    dataIndex: "total",
    key: "total",
    editable: false,
    width: 140,
  },
];

export default function GeneralLiving({ modalData }) {
  const [form] = Form.useForm();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const discoveryData = useAtomValue(discoveryDataAtom);
  const setDiscoveryData = useSetAtom(discoveryDataAtom);
  const { post, patch } = useApi();

  const sectionData = discoveryData?.[SECTION_KEY] || {};
  const initialValues = useMemo(
    () => buildInitialValues(sectionData),
    [sectionData],
  );

  const household = Form.useWatch("household", form) || initialValues.household;
  const personal = Form.useWatch("personal", form) || initialValues.personal;
  const transport = Form.useWatch("transport", form) || initialValues.transport;
  const insurance = Form.useWatch("insurance", form) || initialValues.insurance;

  useEffect(() => {
    form.setFieldsValue(initialValues);
    setEditing(!sectionData?._id);
  }, [form, initialValues, sectionData?._id]);

  const sectionRows = useMemo(
    () =>
      SECTION_DEFINITIONS.reduce((acc, section) => {
        const watchedSection =
          {
            household,
            personal,
            transport,
            insurance,
          }[section.key] || [];

        acc[section.key] = section.items.map((item, index) => {
          const watchedRow = watchedSection[index] || {};
          const amount = watchedRow.amount || "";
          const frequency = watchedRow.frequency || undefined;

          return {
            key: `${section.key}_${index}`,
            dbKey: item.id,
            name: item.name,
            amount,
            frequency,
            total: calculateRowTotal(amount, frequency),
            index,
            sectionKey: section.key,
            formPath: [section.key, index],
          };
        });

        return acc;
      }, {}),
    [household, insurance, personal, transport],
  );

  const totals = useMemo(() => {
    const buildTotal = (rows = []) =>
      rows.reduce(
        (sum, row) =>
          sum + parseCurrencyNumber(row.amount) * Number(row.frequency || 0),
        0,
      );

    return {
      household: buildTotal(household),
      personal: buildTotal(personal),
      transport: buildTotal(transport),
      insurance: buildTotal(insurance),
    };
  }, [household, insurance, personal, transport]);

  const overallTotal = useMemo(
    () =>
      totals.household + totals.personal + totals.transport + totals.insurance,
    [totals],
  );

  const collapseItems = useMemo(
    () =>
      SECTION_DEFINITIONS.map((section) => ({
        key: section.key,
        label: (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
            }}
          >
            <span>{`${section.icon} ${section.title}`}</span>
            <strong>{toCommaAndDollar(totals[section.key] || 0)}</strong>
          </div>
        ),
        children: (
          <EditableDynamicTable
            form={form}
            editing={editing}
            columns={COLUMNS}
            data={sectionRows[section.key]}
            tableProps={TABLE_PROPS}
          />
        ),
      })),
    [editing, form, sectionRows, totals],
  );

  const handleFinish = async (values) => {
    const formValues = form.getFieldsValue(true);
    const sourceValues = { ...formValues, ...values };
    const payload = buildPayload(
      sourceValues,
      sectionData,
      discoveryData?.personalDetails?._id,
    );

    // console.log("payload", payload);
    // return false;

    try {
      setSaving(true);

      const saved = sectionData?._id
        ? await patch("/api/generalLivingExpenses/Update", payload)
        : await post("/api/generalLivingExpenses/Add", payload);

      setDiscoveryData((prev) => ({
        ...(prev && typeof prev === "object" ? prev : {}),
        [SECTION_KEY]: saved || payload,
      }));

      message.success(
        `${modalData?.title || "General Living"} updated successfully`,
      );
      modalData?.closeModal?.();
    } catch (error) {
      message.error(
        error?.response?.data?.message ||
          error?.message ||
          `Failed to update ${modalData?.title || "General Living"}`,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: "16px 4px" }}>
      <Form
        form={form}
        initialValues={initialValues}
        onFinish={handleFinish}
        layout="vertical"
      >
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Title
              level={4}
              style={{
                background: "linear-gradient(90deg, #36b446, #2b6e2f)",
                color: "#fff",
                padding: "12px 20px",
                borderRadius: 10,
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  color: "inherit",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <strong>Total Expenses:</strong>
                <span>{toCommaAndDollar(overallTotal)}</span>
              </div>
            </Title>
          </Col>

          <Col xs={24}>
            <Collapse
              accordion
              items={collapseItems}
              bordered={false}
              style={{
                background: "#fff",
                borderRadius: 12,
              }}
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
                    key={"edit"}
                    onClick={() => setEditing(true)}
                  >
                    Edit <RiEdit2Fill />
                  </Button>
                ) : (
                  <Button
                    key={"save"}
                    type="primary"
                    htmlType="submit"
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
