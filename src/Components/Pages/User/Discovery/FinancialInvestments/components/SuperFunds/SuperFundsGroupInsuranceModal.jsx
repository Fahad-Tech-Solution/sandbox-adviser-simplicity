import { Button, Col, Form, Row, Space } from "antd";
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

const COVER_TYPE_OPTIONS = [
  { value: "Unitised", label: "Unitised" },
  { value: "Fixed", label: "Fixed" },
];

const WAITING_PERIOD_OPTIONS = [
  { value: 30, label: "30 Days" },
  { value: 60, label: "60 Days" },
  { value: 90, label: "90 Days" },
  { value: 180, label: "180 Days" },
];

const BENEFIT_PERIOD_OPTIONS = [
  { value: "2 Years", label: "2 Years" },
  { value: "5 Years", label: "5 Years" },
  { value: "To age 60", label: "To age 60" },
  { value: "To Age 65", label: "To Age 65" },
  { value: "To Age 67", label: "To Age 67" },
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
  return Object.values(initialValues || {}).some(
    (value) => String(value ?? "").trim() !== "",
  );
}

export default function SuperFundsGroupInsuranceModal({ modalData }) {
  const [form] = Form.useForm();

  const initialValues = useMemo(
    () => modalData?.initialValues?.groupInsuranceDetails || {},
    [modalData],
  );

  const [editing, setEditing] = useState(
    () => !hasMeaningfulValues(initialValues),
  );

  const lifeCover = Form.useWatch("lifeCover", form);
  const TPDCover = Form.useWatch("TPDCover", form);
  const coverType = Form.useWatch("coverType", form);
  const cost = Form.useWatch("cost", form);
  const monthlyIncome = Form.useWatch("monthlyIncome", form);
  const waitingPeriod = Form.useWatch("waitingPeriod", form);
  const BenefitPeriod = Form.useWatch("BenefitPeriod", form);
  const coverType2 = Form.useWatch("coverType2", form);
  const cost2 = Form.useWatch("cost2", form);

  useEffect(() => {
    form.setFieldsValue(initialValues);
    setEditing(!hasMeaningfulValues(initialValues));
  }, [form, initialValues]);

  const rowData = useMemo(
    () => [
      {
        key: "group-insurance",
        formPath: [],
        lifeCover: lifeCover ?? initialValues?.lifeCover ?? "",
        TPDCover: TPDCover ?? initialValues?.TPDCover ?? "",
        coverType: coverType ?? initialValues?.coverType ?? "",
        cost: cost ?? initialValues?.cost ?? "",
        monthlyIncome: monthlyIncome ?? initialValues?.monthlyIncome ?? "",
        waitingPeriod: waitingPeriod ?? initialValues?.waitingPeriod ?? "",
        BenefitPeriod: BenefitPeriod ?? initialValues?.BenefitPeriod ?? "",
        coverType2: coverType2 ?? initialValues?.coverType2 ?? "",
        cost2: cost2 ?? initialValues?.cost2 ?? "",
      },
    ],
    [
      BenefitPeriod,
      TPDCover,
      cost,
      cost2,
      coverType,
      coverType2,
      initialValues,
      lifeCover,
      monthlyIncome,
      waitingPeriod,
    ],
  );

  const formatMoneyChange = (value, record, column, currentForm) => {
    currentForm.setFieldValue(
      column.field,
      formatCurrencyValue(value?.target?.value),
    );
  };

  const columns = [
    {
      title: "Life Cover",
      dataIndex: "lifeCover",
      key: "lifeCover",
      field: "lifeCover",
      type: "text",
      placeholder: "Life Cover",
      onChange: formatMoneyChange,
    },
    {
      title: "TPD Cover",
      dataIndex: "TPDCover",
      key: "TPDCover",
      field: "TPDCover",
      type: "text",
      placeholder: "TPD Cover",
      onChange: formatMoneyChange,
    },
    {
      title: "Cover Type",
      dataIndex: "coverType",
      key: "coverType",
      field: "coverType",
      type: "select",
      options: COVER_TYPE_OPTIONS,
    },
    {
      title: "Cost p.a.",
      dataIndex: "cost",
      key: "cost",
      field: "cost",
      type: "text",
      placeholder: "Cost p.a.",
      onChange: formatMoneyChange,
    },
    {
      title: "Monthly Income Protection",
      dataIndex: "monthlyIncome",
      key: "monthlyIncome",
      field: "monthlyIncome",
      type: "text",
      placeholder: "Monthly Income Protection",
      width: 160,
      onChange: formatMoneyChange,
    },
    {
      title: "Waiting Period",
      dataIndex: "waitingPeriod",
      key: "waitingPeriod",
      field: "waitingPeriod",
      type: "select",
      options: WAITING_PERIOD_OPTIONS,
    },
    {
      title: "Benefit Period",
      dataIndex: "BenefitPeriod",
      key: "BenefitPeriod",
      field: "BenefitPeriod",
      type: "select",
      options: BENEFIT_PERIOD_OPTIONS,
    },
    {
      title: "Cover Type",
      dataIndex: "coverType2",
      key: "coverType2",
      field: "coverType2",
      type: "select",
      options: COVER_TYPE_OPTIONS,
    },
    {
      title: "Cost p.a.",
      dataIndex: "cost2",
      key: "cost2",
      field: "cost2",
      type: "text",
      placeholder: "Cost p.a.",
      onChange: formatMoneyChange,
    },
  ];

  const handleConfirmAndExit = async () => {
    const values = form.getFieldsValue(true);
    const currentRow =
      modalData?.parentForm?.getFieldValue?.(modalData?.fieldPath) || {};
    const updatedRow = {
      ...currentRow,
      groupInsuranceDetails: values,
      groupInsurance: "Yes",
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
