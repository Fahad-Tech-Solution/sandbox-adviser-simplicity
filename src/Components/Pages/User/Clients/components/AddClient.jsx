import { useEffect, useState } from "react";
import {
  App as AntdApp,
  Button,
  Col,
  Form,
  Input,
  Row,
  Select,
  Typography,
} from "antd";
import AppModal from "../../../../Common/AppModal";
import useApi from "../../../../../hooks/useApi";

const { Text } = Typography;

const FORM_ID = "add-client-form";

const ROLE_PRIMARY = "Primary";
const ROLE_PARTNER = "Partner";

function buildPayload(values) {
  return {
    client: {
      clientLastName: values.clientLastName?.trim(),
      clientWorkPhone: values.clientWorkPhone?.trim(),
      Email: values.Email?.trim(),
      clientHomeAddress: values.clientHomeAddress?.trim(),
      clientMaritalStatus: values.clientMaritalStatus?.trim(),
      clientPreferredName: values.clientPreferredName?.trim(),
      clientAge: values.clientAge?.trim(),
    },
    partner: ["Married", "Divorced", "Widowed"].includes(
      values.clientMaritalStatus?.trim(),
    )
      ? {
          partnerPreferredName: values.partnerPreferredName?.trim(),
          partnerAge: values.partnerAge?.trim(),
        }
      : undefined,
  };
}

/**
 * Add household / client — household fields + PEOPLE (Primary / Partner).
 * POST /api/personalDetails/Add
 */
export default function AddClient({ open, onClose, onSuccess }) {
  const api = useApi();
  const { message } = AntdApp.useApp();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const ausPhoneRegex = /^(?:\+61|0)[2-478](?:[ ]?\d){8}$/;

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue({
      primaryRole: ROLE_PRIMARY,
      partnerRole: ROLE_PARTNER,
    });
  }, [open, form]);

  const handleFinish = async (values) => {
    console.log("values", values);
    const payload = buildPayload(values);
    setSubmitting(true);
    try {
      const res = await api.post("/api/personalDetails/Add", payload);
      message.success("Client saved.");
      onSuccess?.(res, values);
      form.resetFields();
      onClose?.();
    } catch (err) {
      message.error(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          "Could not save client.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={
        <div
          style={{ fontFamily: "Arial,serif", fontSize: 17, fontWeight: 800 }}
        >
          Add New Client
        </div>
      }
      width={500}
      destroyOnClose
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            form={FORM_ID}
            loading={submitting}
            style={{ background: "#22c55e", borderColor: "#22c55e" }}
          >
            Save Client
          </Button>
        </div>
      }
    >
      <Form
        id={FORM_ID}
        form={form}
        layout="horizontal"
        labelCol={{ flex: "132px" }}
        labelAlign="left"
        wrapperCol={{ flex: 1 }}
        colon={false}
        onFinish={handleFinish}
        style={{ marginTop: 16 }}
        requiredMark={false}
        styles={{
          label: {
            fontWeight: 600,
            fontSize: 13,
            color: "rgb(55, 65, 81)",
            fontFamily: "Arial,serif",
          },
        }}
      >
        <Form.Item
          name="clientLastName"
          label="Household Name"
          rules={[{ required: true, message: "Enter household name" }]}
          style={{ marginBottom: 10 }}
        >
          <Input
            placeholder="e.g. Bennett"
            allowClear
            className="custom-black-placeholder"
          />
        </Form.Item>
        <Form.Item
          name="clientWorkPhone"
          label="Contact"
          style={{ marginBottom: 10 }}
          rules={[
            { required: true, message: "Enter contact" },
            {
              pattern: ausPhoneRegex,
              message: "Enter a valid phone number eg +61 2 1234 5678",
            },
          ]}
        >
          <Input
            placeholder="Phone number"
            allowClear
            className="custom-black-placeholder"
          />
        </Form.Item>
        <Form.Item
          name="Email"
          label="Email"
          rules={[
            { required: true, message: "Enter email" },
            { type: "email", message: "Enter a valid email" },
          ]}
          style={{ marginBottom: 10 }}
        >
          <Input
            placeholder="Email address"
            allowClear
            autoComplete="off"
            className="custom-black-placeholder"
          />
        </Form.Item>
        <Form.Item
          name="clientHomeAddress"
          label="Address"
          style={{ marginBottom: 10 }}
          rules={[{ required: true, message: "Enter address" }]}
        >
          <Input
            placeholder="Street address"
            allowClear
            className="custom-black-placeholder"
          />
        </Form.Item>
        <Form.Item
          name="clientMaritalStatus"
          label="Marital Status"
          style={{ marginBottom: 10 }}
          rules={[{ required: true, message: "Select marital status" }]}
        >
          <Select
            placeholder={
              <span style={{ color: "#000" }}>Select marital status</span>
            }
            options={[
              { value: "Single", label: "Single" },
              { value: "Married", label: "Married" },
              { value: "Divorced", label: "Divorced" },
              { value: "Widowed", label: "Widowed" },
            ]}
            allowClear
            dropdownStyle={{ color: "#000" }}
          />
        </Form.Item>

        <div
          style={{
            marginTop: 20,
            marginBottom: 10,
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <Text
            style={{
              fontSize: 11,
              letterSpacing: 2,
              color: "#6b7280",
              fontWeight: 600,
            }}
          >
            PEOPLE
          </Text>
        </div>

        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={14} md={15} lg={13}>
            <Form.Item
              name="clientPreferredName"
              label={null}
              rules={[{ required: true, message: "Enter primary name" }]}
              style={{ marginBottom: 0 }}
            >
              <Input
                placeholder="Primary name"
                className="custom-black-placeholder"
              />
            </Form.Item>
          </Col>
          <Col xs={8} sm={5} md={7}>
            <Form.Item style={{ marginBottom: 0 }}>
              <Select
                value={ROLE_PRIMARY}
                options={[{ value: ROLE_PRIMARY, label: ROLE_PRIMARY }]}
                disabled
              />
            </Form.Item>
          </Col>
          <Col xs={16} sm={5} md={4}>
            <Form.Item
              name="clientAge"
              style={{ marginBottom: 0 }}
              rules={[
                { required: true, message: "Enter primary age" },
                { pattern: /^\d+$/, message: "Enter a valid age" },
                {
                  type: "number",
                  min: 20,
                  max: 80,
                  message: "Age must be between 20 and 80",
                  transform: (value) => {
                    // For string input, try convert to number
                    if (typeof value === "string" && value.trim() !== "") {
                      const n = Number(value);
                      return isNaN(n) ? value : n;
                    }
                    return value;
                  },
                },
              ]}
            >
              <Input
                placeholder="Age"
                className="custom-black-placeholder"
                styles={{ input: { textAlign: "center" } }}
              />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          noStyle
          shouldUpdate={(prev, next) =>
            prev.clientMaritalStatus !== next.clientMaritalStatus
          }
        >
          {({ getFieldValue }) => {
            const val = getFieldValue("clientMaritalStatus");
            const normalized =
              typeof val === "string" ? val.trim().toLowerCase() : "";
            // Only show partner fields if marital status is not "single", "widowed", empty, null, or undefined
            if (
              ["single", "widowed", "", null, undefined].includes(normalized) ||
              !normalized
            ) {
              return null;
            }
            return (
              <Row gutter={[12, 12]} align="middle" style={{ marginTop: 8 }}>
                <Col xs={24} sm={14} md={15} lg={13}>
                  <Form.Item
                    name="partnerPreferredName"
                    style={{ marginBottom: 0 }}
                  >
                    <Input
                      placeholder="Partner name (optional)"
                      className="custom-black-placeholder"
                    />
                  </Form.Item>
                </Col>
                <Col xs={8} sm={5} md={7}>
                  <Form.Item style={{ marginBottom: 0 }}>
                    <Select
                      value={ROLE_PARTNER}
                      options={[{ value: ROLE_PARTNER, label: ROLE_PARTNER }]}
                      disabled
                    />
                  </Form.Item>
                </Col>
                <Col xs={16} sm={5} md={4}>
                  <Form.Item
                    name="partnerAge"
                    style={{ marginBottom: 0 }}
                    rules={[
                      { required: true, message: "Enter partner age" },
                      { pattern: /^\d+$/, message: "Enter a valid age" },
                      {
                        type: "number",
                        min: 20,
                        max: 80,
                        message: "Age must be between 20 and 80",
                        transform: (value) => {
                          return Number(value);
                        },
                      },
                    ]}
                  >
                    <Input
                      placeholder="Age"
                      className="custom-black-placeholder"
                      styles={{ input: { textAlign: "center" } }}
                    />
                  </Form.Item>
                </Col>
              </Row>
            );
          }}
        </Form.Item>
      </Form>
    </AppModal>
  );
}
