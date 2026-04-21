import { Button, Col, Form, Row, Space } from "antd";
import { useEffect, useMemo, useState } from "react";
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

export default function PersonalInsuranceLumpSumModal({ modalData }) {
  const [form] = Form.useForm();
  const record = modalData?.record || {};
  const fieldPath = Array.isArray(record?.formPath) ? record.formPath : null;
  const currentParentRow =
    (fieldPath
      ? modalData?.parentForm?.getFieldValue?.(fieldPath)
      : null) || record;

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

  function hasMeaningfulValues(values = {}) {
    return Object.values(values || {}).some((value) => {
      if (value === null || value === undefined || value === "") return false;
      if (value === "No") return false;
      return String(value).trim() !== "";
    });
  }

  const initialValues = useMemo(() => {
    return {
      life: formatCurrencyValue(
        currentParentRow?.LifeTPDTraumaDetails?.life ||
          currentParentRow?.life ||
          "$0",
      ),
      TPD: formatCurrencyValue(
        currentParentRow?.LifeTPDTraumaDetails?.TPD ||
          currentParentRow?.TPD ||
          "$0",
      ),
      trauma: formatCurrencyValue(
        currentParentRow?.LifeTPDTraumaDetails?.trauma ||
          currentParentRow?.trauma ||
          "$0",
      ),
      premiumType: currentParentRow?.LifeTPDTraumaDetails?.premiumType || "",
      TPDDefinition: currentParentRow?.LifeTPDTraumaDetails?.TPDDefinition || "",
      traumaPlus: currentParentRow?.LifeTPDTraumaDetails?.traumaPlus || "No",
      CPI: currentParentRow?.LifeTPDTraumaDetails?.CPI || "No",
      superlinked: currentParentRow?.LifeTPDTraumaDetails?.superlinked || "No",
    };
  }, [currentParentRow]);

  const [editing, setEditing] = useState(
    () => !hasMeaningfulValues(initialValues),
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    form.setFieldsValue(initialValues);
    setEditing(!hasMeaningfulValues(initialValues));
  }, [form, initialValues]);

  const formatMoneyChange = (value, recordValue, column, currentForm) => {
    currentForm.setFieldValue(
      column.field,
      formatCurrencyValue(value?.target?.value),
    );
  };

  const columns = useMemo(() => {
    return [
      {
        title: "No#",
        dataIndex: "index",
        key: "index",
        render: (_, __, i) => i + 1,
        justText: true,
        width: 60,
      },
      {
        title: "Life",
        dataIndex: "life",
        key: "life",
        field: "life",
        type: "text",
        placeholder: "$0",
        onChange: formatMoneyChange,
      },
      {
        title: "TPD",
        dataIndex: "TPD",
        key: "TPD",
        field: "TPD",
        type: "text",
        placeholder: "$0",
        onChange: formatMoneyChange,
      },
      {
        title: "Trauma",
        dataIndex: "trauma",
        key: "trauma",
        field: "trauma",
        type: "text",
        placeholder: "$0",
        onChange: formatMoneyChange,
      },
      {
        title: "Premium Type",
        dataIndex: "premiumType",
        key: "premiumType",
        field: "premiumType",
        type: "select",
        options: [
          { value: "Stepped", label: "Stepped" },
          { value: "Level", label: "Level" },
        ],
      },
      {
        title: "TPD Definition",
        dataIndex: "TPDDefinition",
        key: "TPDDefinition",
        field: "TPDDefinition",
        type: "select",
        options: [
          { value: "Any", label: "Any" },
          { value: "Own", label: "Own" },
          { value: "Split (Own)", label: "Split (Own)" },
        ],
      },
      {
        title: "Trauma Plus",
        dataIndex: "traumaPlus",
        key: "traumaPlus",
        field: "traumaPlus",
        type: "yesNoSwitch",
      },
      {
        title: "CPI",
        dataIndex: "CPI",
        key: "CPI",
        field: "CPI",
        type: "yesNoSwitch",
      },
      {
        title: "Superlinked",
        dataIndex: "superlinked",
        key: "superlinked",
        field: "superlinked",
        type: "yesNoSwitch",
      },
    ];
  }, []);

  const data = useMemo(() => {
    return [
      {
        key: "lumpsum-cover",
        index: 1,
        life: initialValues?.life ?? "",
        TPD: initialValues?.TPD ?? "",
        trauma: initialValues?.trauma ?? "",
        premiumType: initialValues?.premiumType ?? "",
        TPDDefinition: initialValues?.TPDDefinition ?? "",
        traumaPlus: initialValues?.traumaPlus ?? "No",
        CPI: initialValues?.CPI ?? "No",
        superlinked: initialValues?.superlinked ?? "No",
      },
    ];
  }, [initialValues]);

  const handleFinish = async (values) => {
    console.log(values, "values");
    const normalizedValues = {
      life: formatCurrencyValue(values?.life),
      TPD: formatCurrencyValue(values?.TPD),
      trauma: formatCurrencyValue(values?.trauma),
      premiumType: values?.premiumType || "",
      TPDDefinition: values?.TPDDefinition || "",
      traumaPlus: values?.traumaPlus || "No",
      CPI: values?.CPI || "No",
      superlinked: values?.superlinked || "No",
    };

    console.log(normalizedValues, "normalizedValues");
    console.log(!fieldPath, "fieldPath");

    try {
      setSaving(true);

      if (!fieldPath) {
        modalData?.closeModal?.();
        return;
      }

      modalData?.parentForm?.setFieldValue?.(
        [...fieldPath, "life"],
        normalizedValues.life,
      );
      modalData?.parentForm?.setFieldValue?.(
        [...fieldPath, "TPD"],
        normalizedValues.TPD,
      );
      modalData?.parentForm?.setFieldValue?.(
        [...fieldPath, "trauma"],
        normalizedValues.trauma,
      );
      modalData?.parentForm?.setFieldValue?.(
        [...fieldPath, "LifeTPDTraumaDetails"],
        normalizedValues,
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
      if (hasMeaningfulValues(initialValues)) {
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
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
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
