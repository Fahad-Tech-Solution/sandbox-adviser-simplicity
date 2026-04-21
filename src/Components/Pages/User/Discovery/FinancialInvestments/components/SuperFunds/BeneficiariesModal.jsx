import { Button, Col, Form, Modal, Row, Select, Space, message } from "antd";
import React, { useEffect, useMemo, useState } from "react";
import { RiEdit2Fill } from "react-icons/ri";
import EditableDynamicTable from "../../../../../../Common/EditableDynamicTable";

const { confirm } = Modal;

const TABLE_PROPS = {
  showCount: false,
  noPagination: true,
  horizontalScroll: true,
  tableStyle: { borderRadius: 12, overflow: "hidden" },
  headerFontSize: 11,
  bodyFontSize: 12,
};

const NOMINATION_OPTIONS = [
  { value: "Binding (Non-Lapsing)", label: "Binding (Non-Lapsing)" },
  { value: "Binding (Lapsing)", label: "Binding (Lapsing)" },
  { value: "Non Binding", label: "Non Binding" },
  { value: "Reversionary Beneficiary", label: "Reversionary Beneficiary" },
];

function normalizeSelectValue(value) {
  return value === null || value === undefined || value === ""
    ? ""
    : String(value);
}

function getRelationshipOptions(nominationType) {
  if (nominationType === "Reversionary Beneficiary") {
    return [{ value: "Spouse/De-facto", label: "Spouse/De-facto" }];
  }

  return [
    {
      value: "Legal Personal Representive (Your Estate)",
      label: "Legal Personal Representive (Your Estate)",
    },
    { value: "Spouse/De-facto", label: "Spouse/De-facto" },
    { value: "Child", label: "Child" },
    { value: "Financial Dependant", label: "Financial Dependant" },
    { value: "Interdependant", label: "Interdependant" },
  ];
}

function parseDigitsValue(value) {
  return String(value ?? "").replace(/[^0-9]/g, "");
}

function getChangedValue(value) {
  return value?.target?.value ?? value;
}

function formatPercentValue(value, max = 100) {
  const digits = parseDigitsValue(getChangedValue(value));
  if (!digits) return "";
  const limited = Math.min(Number(digits), max);
  return `${limited}%`;
}

function getBeneficiaryStorageConfig(modalData) {
  if (modalData?.beneficiaryDetailsShape === "personalInsurance") {
    return {
      detailsKey: "beneficiaryDetails",
      arrayKey: "beneficiaryArray",
      yesFieldKey: "beneficiary",
    };
  }
  return {
    detailsKey: "nominatedBeneficiariesDetails",
    arrayKey: "nominatedBeneficiariesArray",
    yesFieldKey: "nominatedBeneficiaries",
  };
}

function buildInitialValues(rowValues = {}, storage) {
  let rawDetails = rowValues?.[storage.detailsKey];
  if (rawDetails == null || rawDetails === "") {
    rawDetails = {};
  }
  const details =
    typeof rawDetails === "object" && rawDetails !== null ? rawDetails : {};

  const list = details?.[storage.arrayKey];

  return {
    nominationType: normalizeSelectValue(details?.nominationType),
    NumberOfMap:
      Number(details?.NumberOfMap) ||
      (Array.isArray(list) ? list.length : 0) ||
      1,
    BeneficiariesDetails: Array.isArray(list) ? list : [],
  };
}

function hasMeaningfulValues(initialValues = {}) {
  return (
    Boolean(initialValues?.nominationType) ||
    (initialValues?.BeneficiariesDetails || []).length > 0
  );
}

function buildRows(count, entries = []) {
  return Array.from({ length: count }, (_, index) => ({
    relationshipStatus: normalizeSelectValue(
      entries?.[index]?.relationshipStatus,
    ),
    beneficiaryName: entries?.[index]?.beneficiaryName || "",
    DOB: entries?.[index]?.DOB || "",
    shareBenefit: entries?.[index]?.shareBenefit || "",
  }));
}

export default function BeneficiariesModal({ modalData }) {
  const [form] = Form.useForm();
  const storage = useMemo(
    () => getBeneficiaryStorageConfig(modalData),
    [modalData?.beneficiaryDetailsShape],
  );
  const initialValues = useMemo(
    () => buildInitialValues(modalData?.initialValues || {}, storage),
    [modalData?.initialValues, storage],
  );
  const [editing, setEditing] = useState(
    () => !hasMeaningfulValues(initialValues),
  );

  const nominationType = Form.useWatch("nominationType", form);
  const count = Form.useWatch("NumberOfMap", form);
  const beneficiaries =
    Form.useWatch("BeneficiariesDetails", form) ||
    initialValues.BeneficiariesDetails ||
    [];
  const relationshipOptions = useMemo(
    () => getRelationshipOptions(nominationType),
    [nominationType],
  );

  useEffect(() => {
    form.setFieldsValue(initialValues);
    setEditing(!hasMeaningfulValues(initialValues));
  }, [form, initialValues]);

  useEffect(() => {
    if (nominationType === "Reversionary Beneficiary") {
      form.setFieldValue("NumberOfMap", 1);
      form.setFieldValue(
        ["BeneficiariesDetails", 0, "shareBenefit"],
        "100.00%",
      );
    }
  }, [form, nominationType]);

  const rows = useMemo(
    () =>
      buildRows(Number(count) || 0, beneficiaries).map((item, index) => ({
        key: `beneficiary-${index}`,
        formPath: ["BeneficiariesDetails", index],
        rowNumber: index + 1,
        ...item,
      })),
    [beneficiaries, count],
  );

  const handleCountChange = (nextValue) => {
    const nextCount = Number(nextValue) || 1;
    form.setFieldValue("NumberOfMap", nextCount);
    form.setFieldValue(
      "BeneficiariesDetails",
      buildRows(nextCount, beneficiaries),
    );
  };

  const formatShareChange = (value, record, column, currentForm) => {
    const index = (record?.rowNumber || 1) - 1;
    const rowsData = currentForm.getFieldValue("BeneficiariesDetails") || [];

    let otherSum = 0;
    rowsData.forEach((row, rowIndex) => {
      if (rowIndex === index) return;
      otherSum +=
        parseFloat(String(row?.shareBenefit || "").replace(/[^0-9.-]/g, "")) ||
        0;
    });

    const allowed = Math.max(0, 100 - otherSum);
    currentForm.setFieldValue(
      [...record.formPath, column.field],
      formatPercentValue(value, allowed),
    );
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
      title: "Relationship Status",
      dataIndex: "relationshipStatus",
      key: "relationshipStatus",
      field: "relationshipStatus",
      type: "select",
      options: relationshipOptions,
      width: 220,
      onChange: (value, record, column, currentForm) => {
        const selected = normalizeSelectValue(value);
        currentForm.setFieldValue([...record.formPath, column.field], selected);
        if (selected === "Legal Personal Representive (Your Estate)") {
          currentForm.setFieldValue(
            [...record.formPath, "beneficiaryName"],
            "Your Estate",
          );
        }
      },
    },
    {
      title: "Beneficiary Name",
      dataIndex: "beneficiaryName",
      key: "beneficiaryName",
      field: "beneficiaryName",
      type: "text",
      width: 200,
    },
    {
      title: "DOB",
      dataIndex: "DOB",
      key: "DOB",
      field: "DOB",
      type: "date",
      width: 150,
    },
    {
      title: "Share of Benefit",
      dataIndex: "shareBenefit",
      key: "shareBenefit",
      field: "shareBenefit",
      type: "text",
      width: 150,
      onChange: formatShareChange,
    },
  ];

  const handleConfirmAndExit = async () => {
    const values = form.getFieldsValue(true);
    const savedBeneficiaries = buildRows(
      Number(values?.NumberOfMap) || 0,
      values?.BeneficiariesDetails || [],
    );
    const totalShare = savedBeneficiaries.reduce(
      (sum, item) =>
        sum +
        (parseFloat(
          String(item?.shareBenefit || "").replace(/[^0-9.-]/g, ""),
        ) || 0),
      0,
    );

    if (totalShare !== 100) {
      confirm({
        title: "Share percentage error",
        content:
          "The total Share of Benefit should equate to 100%. Please adjust.",
        okText: "OK",
        cancelButtonProps: { style: { display: "none" } },
      });
      return;
    }

    const currentRow =
      modalData?.parentForm?.getFieldValue?.(modalData?.fieldPath) || {};
    const storageCfg = getBeneficiaryStorageConfig(modalData);
    const detailsPayload = {
      [storageCfg.arrayKey]: savedBeneficiaries,
      nominationType: values?.nominationType || "",
      NumberOfMap: values?.NumberOfMap || savedBeneficiaries.length,
    };
    const updatedRow = {
      ...currentRow,
      [storageCfg.yesFieldKey]: "Yes",
      [storageCfg.detailsKey]: detailsPayload,
    };

    modalData?.parentForm?.setFieldValue?.(modalData?.fieldPath, updatedRow);
    setEditing(false);
    modalData?.closeModal?.();
  };

  return (
    <div style={{ padding: "16px 4px" }}>
      <Form form={form} initialValues={initialValues} requiredMark={false}>
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div style={{ minWidth: 220 }}>
                <Form.Item
                  label="Nomination Type"
                  name="nominationType"
                  style={{ marginBottom: 0 }}
                >
                  <Select
                    placeholder="Select"
                    disabled={!editing}
                    options={NOMINATION_OPTIONS}
                    onChange={(value) =>
                      form.setFieldValue("nominationType", value)
                    }
                  />
                </Form.Item>
              </div>
              <div style={{ minWidth: 180 }}>
                <Form.Item
                  label="Number of Beneficiaries"
                  name="NumberOfMap"
                  style={{ marginBottom: 0 }}
                >
                  <Select
                    placeholder="Select"
                    disabled={
                      !editing || nominationType === "Reversionary Beneficiary"
                    }
                    options={Array.from({ length: 10 }, (_, index) => ({
                      value: index + 1,
                      label: index + 1,
                    }))}
                    onChange={handleCountChange}
                    style={{ width: "80px" }}
                  />
                </Form.Item>
              </div>
            </div>
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
