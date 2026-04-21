import { Button, Col, Form, Input, Row, Space } from "antd";
import React, { useEffect, useMemo, useState } from "react";
import { RiEdit2Fill } from "react-icons/ri";

const { TextArea } = Input;

export default function EstatePlanningDescriptionModal({ modalData }) {
  const [form] = Form.useForm();
  const rowDescriptionKey =
    modalData?.rowDescriptionKey || "estatePlanningdescription";
  const descriptionLabel = modalData?.descriptionLabel || "Description";
  const descriptionPlaceholder =
    modalData?.descriptionPlaceholder || descriptionLabel;

  const initialValues = useMemo(
    () => ({
      description:
        modalData?.initialValues?.[rowDescriptionKey] ??
        modalData?.initialValues?.description ??
        "",
    }),
    [modalData?.initialValues, rowDescriptionKey],
  );
  const [editing, setEditing] = useState(
    () => !String(initialValues.description || "").trim(),
  );

  useEffect(() => {
    form.setFieldsValue(initialValues);
    setEditing(!String(initialValues.description || "").trim());
  }, [form, initialValues]);

  const handleConfirmAndExit = async () => {
    const values = await form.validateFields();
    const currentRow =
      modalData?.parentForm?.getFieldValue?.(modalData?.fieldPath) || {};
    const updatedRow = {
      ...currentRow,
      [rowDescriptionKey]: values?.description || "",
    };

    modalData?.parentForm?.setFieldValue?.(modalData?.fieldPath, updatedRow);
    setEditing(false);
    modalData?.closeModal?.();
  };

  return (
    <div style={{ padding: "16px 4px 0px 4px" }}>
      <Form form={form} initialValues={initialValues} requiredMark={false}
      colon={false}
      layout="vertical"
      styles={{
        label: {
          fontWeight: "600",
          fontSize: "13px",
          fontFamily: "Arial, serif",
        },
      }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Form.Item
              label={descriptionLabel}
              name="description"
              style={{ marginBottom: 0 }}
            >
              <TextArea
                rows={6}
                disabled={!editing}
                placeholder={descriptionPlaceholder}
              />
            </Form.Item>
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
