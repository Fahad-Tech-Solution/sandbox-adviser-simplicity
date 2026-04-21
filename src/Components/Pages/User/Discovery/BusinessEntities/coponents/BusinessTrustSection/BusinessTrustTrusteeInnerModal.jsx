import { Button, Col, Form, Row, Select, Space } from "antd";
import React, { useEffect, useMemo, useState } from "react";
import EditableDynamicTable from "../../../../../../Common/EditableDynamicTable.jsx";

const TABLE_PROPS = {
  showCount: false,
  noPagination: true,
  horizontalScroll: true,
  tableStyle: { borderRadius: 12, overflow: "hidden" },
  headerFontSize: 11,
  bodyFontSize: 12,
};

function buildEmptyDirector() {
  return { directorName: "" };
}

function hasMeaningfulInnerData(initialValues = {}) {
  const rows = initialValues?.directorRows || [];
  if ((Number(initialValues?.innerCount) || 0) > 0) return true;
  // return rows.some((row) => String(row?.directorName ?? "").trim() !== "");
  return rows.some((row) => row?.directorName?.trim()?.length > 0);
}

function buildDirectorRows(count, entries = []) {
  return Array.from({ length: count }, (_, index) =>
    entries?.[index] ? { directorName: entries[index].directorName || "" } : buildEmptyDirector(),
  );
}

/**
 * Inner modal for Business Trust: Corporate = directors; Individual = trustees.
 * Persists to parent row: tradingTrusts[rowIndex].directorsOfCorporateTrustee
 * (same field name as legacy InnerDirectors for API compatibility).
 */
export default function BusinessTrustTrusteeInnerModal({ modalData }) {
  console.log("modalData", modalData);
  const {
    title = "Trustee / Directors",
    countLabel = countLabel ,
    columnHead = "Name",
    maxCount = 4,
    closeModal,
    valueArray,
    onSave,
    editing: outerEditing,
  } = modalData || {};

  const [form] = Form.useForm();
  const [editing, setEditing] = useState(false);

  const initialValues = useMemo(() => {
    const list = Array.isArray(valueArray) ? valueArray : [];
    const count = list.length || undefined;

    return {
      innerCount: count,
      directorRows: buildDirectorRows(Number(count) || 0, list),
    };
    console.log("initialValues", initialValues);
  }, [valueArray]);

  const innerCount = Form.useWatch("innerCount", form);
  const directorRows = Form.useWatch("directorRows", form) || initialValues.directorRows;

  useEffect(() => {
    form.setFieldsValue(initialValues);
    setEditing(!hasMeaningfulInnerData(initialValues));
  }, [form, initialValues]);

  const detailRows = useMemo(
    () =>
      buildDirectorRows(Number(innerCount) || 0, directorRows).map((item, index) => ({
        key: `trustee-inner-${index}`,
        formPath: ["directorRows", index],
        rowNumber: index + 1,
        ...item,
      })),
    [directorRows, innerCount],
  );

  const handleCountChange = (nextValue) => {
    const nextCount = Number(nextValue) || 0;
    const current = form.getFieldValue("directorRows") || [];
    form.setFieldValue("innerCount", nextValue);
    form.setFieldValue("directorRows", buildDirectorRows(nextCount, current));
  };

  const handleRemoveRow = (rowIdx) => {
    const current = form.getFieldValue("directorRows") || [];
    const next = current.filter((_, i) => i !== rowIdx);
    const nextCount = next.length;
    form.setFieldValue("directorRows", next);
    form.setFieldValue("innerCount", nextCount || undefined);
  };

  const columns = [
    {
      title: "No#",
      dataIndex: "rowNumber",
      key: "rowNumber",
      width: 50,
      editable: false,
    },
    {
      title: columnHead,
      dataIndex: "directorName",
      key: "directorName",
      field: "directorName",
      type: "text",
      placeholder: columnHead,
      width: 260,
    },
    {
      title: "Action",
      key: "action",
      dataIndex: "action",
      editable: false,
      width: 80,
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

  const handleConfirmAndExit = () => {
    const values = form.getFieldsValue(true);
    const countValue = Number(values?.innerCount) || 0;
    const rows = buildDirectorRows(
      countValue,
      Array.isArray(values?.directorRows) ? values.directorRows : [],
    ).map((r) => ({ directorName: String(r?.directorName ?? "").trim() }));

    onSave?.(rows);
    setEditing(false);
    closeModal?.();
  };

  return (
    <div style={{ padding: "16px 4px 0px 4px" }}>
      <Form
        form={form}
        initialValues={initialValues}
        requiredMark={false}
        colon={false}
        styles={{
          label: {
            fontWeight: "600",
            fontSize: "13px",
            fontFamily: "Arial, serif",
          },
        }}
      >
        <Row gutter={[16, 16]}>
          <Col>
            <Form.Item label={countLabel} name="innerCount" style={{ marginBottom: 0 }}>
              <Select
                placeholder="Select"
                disabled={!editing}
                onChange={handleCountChange}
                style={{ width: "100%", borderRadius: "8px" }}
                options={Array.from({ length: maxCount }, (_, i) => ({
                  value: i + 1,
                  label: i + 1,
                }))}
              />
            </Form.Item>
          </Col>
          <Col xs={24}>
            {/* <EditableDynamicTable
              form={form}
              editing={editing}
              columns={columns}
              data={detailRows}
              tableProps={TABLE_PROPS}
            /> */}

<EditableDynamicTable
  form={form}
  editing={editing}
  columns={columns}
  data={detailRows}
  tableProps={TABLE_PROPS}
  rowPathKey="formPath"   // ✅ REQUIRED
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
                    <Button onClick={() => closeModal?.()}>Cancel</Button>
                    <Button
                      type="primary"
                      onClick={() => setEditing(true)}
                      disabled={outerEditing === false}
                    >
                      Edit
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
