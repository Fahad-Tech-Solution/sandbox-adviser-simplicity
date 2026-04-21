import { Alert, Button, Col, Form, Row, Space } from "antd";
import React, { useEffect, useMemo, useState } from "react";
import EditableDynamicTable from "../../../../../../Common/EditableDynamicTable.jsx";
import { RiEdit2Fill } from "react-icons/ri";

const TABLE_PROPS = {
  showCount: false,
  noPagination: true,
  horizontalScroll: true,
  tableStyle: { borderRadius: 12, overflow: "hidden" },
  headerFontSize: 11,
  bodyFontSize: 12,
};

const TIME_OPTIONS = ["Days", "Weeks", "Hours"];

const LEAVE_ROW_META = [
  {
    key: "annual",
    leaveType: "Annual Leave",
    amountField: "annualLeaveAmount",
    timeField: "annualLeaveTime",
  },
  {
    key: "sick",
    leaveType: "Sick Leave",
    amountField: "sickLeaveAmount",
    timeField: "sickLeaveTime",
  },
  {
    key: "longService",
    leaveType: "Long Service Leave",
    amountField: "longServiceLeaveAmount",
    timeField: "longServiceLeaveTime",
  },
];

function buildInitialValues(initialValues = {}) {
  return {
    annualLeaveAmount: initialValues?.annualLeaveAmount || "",
    annualLeaveTime: initialValues?.annualLeaveTime || undefined,
    sickLeaveAmount: initialValues?.sickLeaveAmount || "",
    sickLeaveTime: initialValues?.sickLeaveTime || undefined,
    longServiceLeaveAmount: initialValues?.longServiceLeaveAmount || "",
    longServiceLeaveTime: initialValues?.longServiceLeaveTime || undefined,
  };
}

function getInitialValues(modalData) {
  const ownerKey = modalData?.ownerKey;
  const parentForm = modalData?.parentForm;

  const leaveEntitlements =
    ownerKey && parentForm
      ? parentForm.getFieldValue([ownerKey, "LeaveEntitlementsModal"]) || {}
      : modalData?.initialValues || {};

  return buildInitialValues(leaveEntitlements);
}

function hasMeaningfulValues(values) {
  return [
    values?.annualLeaveAmount,
    values?.annualLeaveTime,
    values?.sickLeaveAmount,
    values?.sickLeaveTime,
    values?.longServiceLeaveAmount,
    values?.longServiceLeaveTime,
  ].some((value) => String(value ?? "").trim() !== "");
}

const LEAVE_ENTITLEMENTS_COLUMNS = [
  {
    title: "Leave Type",
    key: "leaveType",
    dataIndex: "leaveType",
    field: "leaveType",
    type: "text",
    editable: false,
    width: 180,
  },
  {
    title: "Amount",
    key: "amount",
    dataIndex: "amount",
    field: "amount",
    type: "number",
    width: 120,
    rules: [{ required: true, message: "Amount is required" }],
    getFieldName: (record) => [record.amountField],
  },
  {
    title: "Time",
    key: "time",
    dataIndex: "time",
    field: "time",
    type: "select",
    options: TIME_OPTIONS,
    width: 120,
    rules: [{ required: true, message: "Time unit is required" }],
    getFieldName: (record) => [record.timeField],
  },
];

function getFieldName(record, column) {
  if (typeof column.getFieldName === "function") {
    return column.getFieldName(record, column);
  }

  return [column.field || column.dataIndex || column.key];
}

export default function LeaveEntitlements({ modalData }) {
  const [form] = Form.useForm();
  const initialValues = useMemo(() => getInitialValues(modalData), [modalData]);
  const [editing, setEditing] = useState(
    () => !hasMeaningfulValues(initialValues),
  );

  const annualLeaveAmount = Form.useWatch("annualLeaveAmount", form);
  const annualLeaveTime = Form.useWatch("annualLeaveTime", form);
  const sickLeaveAmount = Form.useWatch("sickLeaveAmount", form);
  const sickLeaveTime = Form.useWatch("sickLeaveTime", form);
  const longServiceLeaveAmount = Form.useWatch("longServiceLeaveAmount", form);
  const longServiceLeaveTime = Form.useWatch("longServiceLeaveTime", form);

  useEffect(() => {
    form.setFieldsValue(initialValues);
    setEditing(!hasMeaningfulValues(initialValues));
  }, [form, initialValues]);

  const rows = useMemo(
    () =>
      LEAVE_ROW_META.map((row) => ({
        ...row,
        amount:
          {
            annual: annualLeaveAmount,
            sick: sickLeaveAmount,
            longService: longServiceLeaveAmount,
          }[row.key] ?? initialValues[row.amountField],
        time:
          {
            annual: annualLeaveTime,
            sick: sickLeaveTime,
            longService: longServiceLeaveTime,
          }[row.key] ?? initialValues[row.timeField],
      })),
    [
      annualLeaveAmount,
      annualLeaveTime,
      initialValues,
      longServiceLeaveAmount,
      longServiceLeaveTime,
      sickLeaveAmount,
      sickLeaveTime,
    ],
  );

  const handleCancel = () => {
    modalData?.closeModal?.();
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleConfirmAndExit = async () => {
    const values = await form.validateFields();
    modalData?.parentForm?.setFieldValue?.(
      [modalData?.ownerKey, "LeaveEntitlementsModal"],
      values,
    );
    setEditing(false);
    modalData?.closeModal?.();
  };

  const validationErrors = form
    .getFieldsError()
    .filter((field) => field.errors.length > 0);

  return (
    <div style={{ padding: "16px 0px 0px 0px" }}>
      <Form form={form} initialValues={initialValues} layout="vertical">
        <Row gutter={[16, 16]}>
          {editing && validationErrors.length > 0 ? (
            <Col xs={24}>
              <Alert
                type="error"
                showIcon
                message="Validation Errors"
                description={
                  <ul style={{ marginBottom: 0, paddingLeft: 18 }}>
                    {validationErrors.map((field) => (
                      <li key={field.name.join(".")}>{field.errors[0]}</li>
                    ))}
                  </ul>
                }
              />
            </Col>
          ) : null}

          <Col xs={24}>
            <EditableDynamicTable
              form={form}
              editing={editing}
              columns={LEAVE_ENTITLEMENTS_COLUMNS}
              data={rows}
              getFieldName={getFieldName}
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
                    <Button onClick={handleCancel}>Cancel</Button>
                    <Button type="primary" onClick={handleEdit}>
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
