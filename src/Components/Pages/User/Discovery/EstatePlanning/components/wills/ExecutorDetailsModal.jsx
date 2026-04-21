import { Button, Col, Form, Row, Select, Space } from "antd";
import React, { useEffect, useMemo, useState } from "react";
import { RiEdit2Fill } from "react-icons/ri";
import EditableDynamicTable from "../../../../../../Common/EditableDynamicTable.jsx";

const TABLE_PROPS = {
  showCount: false,
  noPagination: true,
  horizontalScroll: true,
  tableStyle: { borderRadius: 12, overflow: "hidden" },
  headerFontSize: 11,
  bodyFontSize: 12,
};

const EXECUTOR_RELATIONSHIP_OPTIONS = [
  { value: "Spouse/Defacto", label: "Spouse/Defacto" },
  { value: "Mother", label: "Mother" },
  { value: "Father", label: "Father" },
  { value: "Child", label: "Child" },
  { value: "Stepchild", label: "Stepchild" },
  { value: "Niece", label: "Niece" },
  { value: "Nephew", label: "Nephew" },
  { value: "Other", label: "Other" },
];

function buildExecutorEntries(count, entries = []) {
  return Array.from({ length: count }, (_, index) => ({
    name: entries?.[index]?.name || "",
    dob: entries?.[index]?.dob || "",
    relationshipStatus: entries?.[index]?.relationshipStatus || "",
  }));
}

function hasExecutorValues(initialValues = {}) {
  const entries = initialValues?.entries || [];
  if ((initialValues?.NumberOfMap || 0) > 0) return true;
  return entries.some((entry) =>
    [entry?.name, entry?.dob, entry?.relationshipStatus].some(
      (value) => String(value ?? "").trim() !== "",
    ),
  );
}

function getArrayField(modalData) {
  return modalData?.arrayKey || "executor";
}

function getDisplayField(modalData) {
  return modalData?.displayKey || "executorDisplay";
}

export default function ExecutorDetailsModal({ modalData }) {
  const [form] = Form.useForm();
  const arrayField = getArrayField(modalData);
  const displayField = getDisplayField(modalData);
  const initialValues = useMemo(() => {
    const entries = Array.isArray(modalData?.initialValues?.[arrayField])
      ? modalData.initialValues[arrayField]
      : [];
    return {
      NumberOfMap: entries.length || undefined,
      entries,
    };
  }, [arrayField, modalData]);
  const [editing, setEditing] = useState(() => !hasExecutorValues(initialValues));
  const count = Form.useWatch("NumberOfMap", form);
  const entries = Form.useWatch("entries", form) || initialValues.entries || [];

  useEffect(() => {
    form.setFieldsValue(initialValues);
    setEditing(!hasExecutorValues(initialValues));
  }, [form, initialValues]);

  const rows = useMemo(
    () =>
      buildExecutorEntries(Number(count) || 0, entries).map((item, index) => ({
        key: `executor-${index}`,
        formPath: ["entries", index],
        rowNumber: index + 1,
        ...item,
      })),
    [count, entries],
  );

  const handleCountChange = (nextValue) => {
    const nextCount = Number(nextValue) || 0;
    form.setFieldValue("NumberOfMap", nextValue);
    form.setFieldValue("entries", buildExecutorEntries(nextCount, entries));
  };

  const handleRemoveRow = (rowIndex) => {
    const currentEntries = form.getFieldValue("entries") || [];
    const nextEntries = currentEntries.filter((_, index) => index !== rowIndex);
    const nextCount = nextEntries.length;
    form.setFieldValue("entries", nextEntries);
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
      title: "Name",
      dataIndex: "name",
      key: "name",
      field: "name",
      type: "text",
      placeholder: "Enter Name",
    },
    {
      title: "Date of Birth",
      dataIndex: "dob",
      key: "dob",
      field: "dob",
      type: "date",
      placeholder: "Select DOB",
    },
    {
      title: "Relationship Status",
      dataIndex: "relationshipStatus",
      key: "relationshipStatus",
      field: "relationshipStatus",
      type: "select",
      placeholder: "Select Relationship",
      options: EXECUTOR_RELATIONSHIP_OPTIONS,
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
          aria-label={`Remove executor ${record?.rowNumber}`}
          onClick={() => handleRemoveRow((record?.rowNumber || 1) - 1)}
        >
          🗑️
        </Button>
      ),
    },
  ];

  const handleConfirmAndExit = async () => {
    const values = form.getFieldsValue(true);
    const savedEntries = buildExecutorEntries(
      Number(values?.NumberOfMap) || 0,
      values?.entries || [],
    );
    const currentRow =
      modalData?.parentForm?.getFieldValue?.(modalData?.fieldPath) || {};
    const updatedRow = {
      ...currentRow,
      [arrayField]: savedEntries,
      [displayField]: savedEntries.length ? String(savedEntries.length) : "",
    };

    modalData?.parentForm?.setFieldValue?.(modalData?.fieldPath, updatedRow);
    setEditing(false);
    modalData?.closeModal?.();
  };

  return (
    <div style={{ padding: "16px 4px 0px 4px" }}>
      <Form form={form} initialValues={initialValues} requiredMark={false}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Form.Item
              label={modalData?.question || "Number of Executors"}
              name="NumberOfMap"
              style={{ marginBottom: 0 }}
            >
              <Select
                placeholder="Select"
                onChange={handleCountChange}
                disabled={!editing}
                style={{ width: "100%", borderRadius: "8px" }}
                options={Array.from({ length: 5 }, (_, index) => ({
                  value: index + 1,
                  label: index + 1,
                }))}
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
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <Space>
                {!editing ? (
                  <>
                    <Button onClick={() => modalData?.closeModal?.()}>Cancel</Button>
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
