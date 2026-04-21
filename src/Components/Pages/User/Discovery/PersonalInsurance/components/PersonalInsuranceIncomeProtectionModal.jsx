import { Button, Col, Form, Modal, Row, Space } from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RiEdit2Fill } from "react-icons/ri";
import EditableDynamicTable from "../../../../../Common/EditableDynamicTable.jsx";

const TABLE_PROPS = {
  showCount: false,
  noPagination: true,
  horizontalScroll: true,
  tableStyle: { borderRadius: 12, overflow: "hidden" },
  headerFontSize: 11,
  bodyFontSize: 12,
};

const WAITING_PERIOD_OPTIONS = [
  { value: "30 Days", label: "30 Days" },
  { value: "60 Days", label: "60 Days" },
  { value: "90 Days", label: "90 Days" },
  { value: "120 Days", label: "120 Days" },
  { value: "180 Days", label: "180 Days" },
  { value: "2 Years", label: "2 Years" },
];

const BENEFIT_PERIOD_OPTIONS = [
  { value: "2 Years", label: "2 Years" },
  { value: "5 Years", label: "5 Years" },
  { value: "To Age 60", label: "To Age 60" },
  { value: "To Age 65", label: "To Age 65" },
  { value: "To Age 70", label: "To Age 70" },
];

const OWN_OCC_OPTIONS = [...BENEFIT_PERIOD_OPTIONS];

const PREMIUM_TYPE_OPTIONS = [
  { value: "Stepped", label: "Stepped" },
  { value: "Level", label: "Level" },
];

const BENEFIT_TYPE_OPTIONS = [
  { value: "Agreed", label: "Agreed" },
  { value: "Indemnity", label: "Indemnity" },
];

function parseCurrencyValue(value) {
  if (value === null || value === undefined || value === "") return 0;
  const numeric = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

function formatCurrencyValue(value) {
  const numeric = parseCurrencyValue(value);
  if (!numeric) return "$0";
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numeric);
}

function hasMeaningfulIpValues(values = {}) {
  return Object.values(values || {}).some((value) => {
    if (value === null || value === undefined || value === "") return false;
    if (value === "No") return false;
    return String(value).trim() !== "";
  });
}

function isIpDetailsMissing(row) {
  const d = row?.IPDetails;
  if (d == null) return true;
  if (typeof d !== "object") return true;
  return Object.keys(d).length === 0;
}

export default function PersonalInsuranceIncomeProtectionModal({ modalData }) {
  const [form] = Form.useForm();
  const record = modalData?.record || {};
  const fieldPath = Array.isArray(record?.formPath) ? record.formPath : null;
  const currentParentRow =
    (fieldPath ? modalData?.parentForm?.getFieldValue?.(fieldPath) : null) ||
    record;

  const details = currentParentRow?.IPDetails || {};

  const initialValues = useMemo(() => {
    return {
      monthlyAmount: formatCurrencyValue(
        details?.monthlyAmount ?? currentParentRow?.IP ?? "$0",
      ),
      waitingPeriod: details?.waitingPeriod || "30 Days",
      benefitPeriod: details?.benefitPeriod || "2 Years",
      ownOccPeriod: details?.ownOccPeriod || "2 Years",
      premiumType: details?.premiumType || "",
      benefitType: details?.benefitType || "",
      CPI: details?.CPI || "No",
      increasingClaims: details?.increasingClaims || "No",
      accidentOption: details?.accidentOption || "No",
      superlinked: details?.superlinked || "No",
    };
  }, [currentParentRow, details]);

  const [editing, setEditing] = useState(
    () =>
      isIpDetailsMissing(currentParentRow) ||
      !hasMeaningfulIpValues(initialValues),
  );
  const [saving, setSaving] = useState(false);
  const suppressSuperlinkedConfirmRef = useRef(false);

  useEffect(() => {
    suppressSuperlinkedConfirmRef.current = true;
    form.setFieldsValue(initialValues);
    setEditing(
      isIpDetailsMissing(currentParentRow) ||
        !hasMeaningfulIpValues(initialValues),
    );
    const timerId = window.setTimeout(() => {
      suppressSuperlinkedConfirmRef.current = false;
    }, 0);
    return () => window.clearTimeout(timerId);
  }, [form, initialValues, currentParentRow]);

  const formatMoneyChange = (value, _recordValue, column, currentForm) => {
    currentForm.setFieldValue(
      column.field,
      formatCurrencyValue(value?.target?.value),
    );
  };

  const columns = useMemo(
    () => [
      {
        title: "No#",
        dataIndex: "index",
        key: "index",
        render: (_, __, i) => i + 1,
        justText: true,
        width: 50,
      },
      {
        title: "Monthly Amount",
        dataIndex: "monthlyAmount",
        key: "monthlyAmount",
        field: "monthlyAmount",
        type: "text",
        placeholder: "$0",
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
        dataIndex: "benefitPeriod",
        key: "benefitPeriod",
        field: "benefitPeriod",
        type: "select",
        options: BENEFIT_PERIOD_OPTIONS,
      },
      {
        title: "Own Occ Period",
        dataIndex: "ownOccPeriod",
        key: "ownOccPeriod",
        field: "ownOccPeriod",
        type: "select",
        options: OWN_OCC_OPTIONS,
      },
      {
        title: "Premium Type",
        dataIndex: "premiumType",
        key: "premiumType",
        field: "premiumType",
        type: "select",
        options: PREMIUM_TYPE_OPTIONS,
      },
      {
        title: "Benefit Type",
        dataIndex: "benefitType",
        key: "benefitType",
        field: "benefitType",
        type: "select",
        options: BENEFIT_TYPE_OPTIONS,
      },
      {
        title: "CPI",
        dataIndex: "CPI",
        key: "CPI",
        field: "CPI",
        type: "yesNoSwitch",
      },
      {
        title: "Increasing Claims",
        dataIndex: "increasingClaims",
        key: "increasingClaims",
        field: "increasingClaims",
        type: "yesNoSwitch",
      },
      {
        title: "Accident Option",
        dataIndex: "accidentOption",
        key: "accidentOption",
        field: "accidentOption",
        type: "yesNoSwitch",
      },
      {
        title: "Superlinked",
        dataIndex: "superlinked",
        key: "superlinked",
        field: "superlinked",
        type: "yesNoSwitch",
      },
    ],
    [],
  );

  const data = useMemo(
    () => [
      {
        key: "income-protection",
        index: 1,
        monthlyAmount: initialValues?.monthlyAmount ?? "",
        waitingPeriod: initialValues?.waitingPeriod ?? "",
        benefitPeriod: initialValues?.benefitPeriod ?? "",
        ownOccPeriod: initialValues?.ownOccPeriod ?? "",
        premiumType: initialValues?.premiumType ?? "",
        benefitType: initialValues?.benefitType ?? "",
        CPI: initialValues?.CPI ?? "No",
        increasingClaims: initialValues?.increasingClaims ?? "No",
        accidentOption: initialValues?.accidentOption ?? "No",
        superlinked: initialValues?.superlinked ?? "No",
      },
    ],
    [initialValues],
  );

  const handleValuesChange = useCallback(
    (changedValues) => {
      if (suppressSuperlinkedConfirmRef.current || !editing) return;
      if (changedValues?.superlinked !== "Yes") return;

      Modal.confirm({
        title: "Superlinked income protection",
        content:
          "As you have selected YES, this applies only to the personally funded portion of the Income Protection policy; if this policy is owned or funded through superannuation, please select NO and enter another separate policy and select Super-linked for that.",
        okText: "Continue",
        okType: "default",
        cancelText: "Revert back",
        type: "warning",
        centered: true,
        onOk: () => {
          form.setFieldValue("superlinked", "Yes");
        },
        onCancel: () => {
          form.setFieldValue("superlinked", "No");
        },
      });
    },
    [editing, form],
  );

  const handleFinish = async (values) => {
    const normalizedDetails = {
      monthlyAmount: formatCurrencyValue(values?.monthlyAmount),
      waitingPeriod: values?.waitingPeriod || "30 Days",
      benefitPeriod: values?.benefitPeriod || "2 Years",
      ownOccPeriod: values?.ownOccPeriod || "2 Years",
      premiumType: values?.premiumType || "",
      benefitType: values?.benefitType || "",
      CPI: values?.CPI || "No",
      increasingClaims: values?.increasingClaims || "No",
      accidentOption: values?.accidentOption || "No",
      superlinked: values?.superlinked || "No",
    };

    try {
      setSaving(true);

      if (!fieldPath) {
        modalData?.closeModal?.();
        return;
      }

      const parentForm = modalData?.parentForm;
      parentForm?.setFieldValue?.(
        [...fieldPath, "IPDetails"],
        normalizedDetails,
      );
      parentForm?.setFieldValue?.(
        [...fieldPath, "IP"],
        normalizedDetails.monthlyAmount,
      );

      setEditing(false);
      modalData?.closeModal?.();
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (editing) {
      form.setFieldsValue(initialValues);
      if (hasMeaningfulIpValues(initialValues)) {
        setEditing(false);
        return;
      }
    }

    modalData?.closeModal?.();
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      onValuesChange={handleValuesChange}
      requiredMark={false}
      style={{ paddingTop: 20 }}
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} md={24}>
          <EditableDynamicTable
            form={form}
            editing={editing}
            columns={columns}
            data={data}
            tableProps={TABLE_PROPS}
          />
        </Col>
        <Col xs={24} md={24}>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Space>
              {!editing ? (
                <>
                  <Button onClick={handleCancel}>Cancel</Button>
                  <Button
                    key="edit"
                    type="primary"
                    htmlType="button"
                    onClick={() => setEditing(true)}
                  >
                    Edit <RiEdit2Fill />
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={handleCancel}>Cancel</Button>
                  <Button
                    key="save"
                    type="primary"
                    htmlType="submit"
                    loading={saving}
                    disabled={saving}
                  >
                    Confirm and Exit
                  </Button>
                </>
              )}
            </Space>
          </div>
        </Col>
      </Row>
    </Form>
  );
}
