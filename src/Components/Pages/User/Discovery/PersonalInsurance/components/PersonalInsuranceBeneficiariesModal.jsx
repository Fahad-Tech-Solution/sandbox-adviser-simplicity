import {
  Button,
  Col,
  Form,
  Input,
  Row,
  Select,
  message,
} from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { useEffect } from "react";

const NOMINATION_OPTIONS = [
  { value: "Binding (Non-Lapsing)", label: "Binding (Non-Lapsing)" },
  { value: "Binding (Lapsing)", label: "Binding (Lapsing)" },
  { value: "Non Binding", label: "Non Binding" },
];

function getRelationshipOptions(nominationType) {
  if (nominationType === "Reversionary Beneficiary") {
    return [{ value: "N/A", label: "N/A" }];
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

function parsePercent(value) {
  return Number(String(value || "").replace(/[^0-9.-]+/g, "")) || 0;
}

function formatPercent(value) {
  const numeric = parsePercent(value);
  return `${numeric.toFixed(2)}%`;
}

export default function PersonalInsuranceBeneficiariesModal({
  onClose,
  onSave,
  editing,
  value,
}) {
  const [form] = Form.useForm();
  const nominationType = Form.useWatch("nominationType", form);

  useEffect(() => {
    form.setFieldsValue({
      nominationType: value?.nominationType || undefined,
      beneficiaries: Array.isArray(value?.beneficiaries)
        ? value.beneficiaries
        : Array.isArray(value?.beneficiaryArray)
          ? value.beneficiaryArray
          : [],
    });
  }, [form, value]);

  return (
    <Form
      form={form}
      layout="vertical"
      requiredMark={false}
      onFinish={(values) => {
        const beneficiaries = (values?.beneficiaries || []).map((item) => ({
          relationshipStatus: item?.relationshipStatus || "",
          beneficiaryName: item?.beneficiaryName || "",
          DOB: item?.DOB || null,
          shareBenefit: formatPercent(item?.shareBenefit),
        }));
        const totalShare = beneficiaries.reduce(
          (sum, item) => sum + parsePercent(item?.shareBenefit),
          0,
        );

        if (totalShare > 100) {
          message.error("Total share of benefit cannot exceed 100%");
          return;
        }

        onSave?.({
          nominationType: values?.nominationType || "",
          beneficiaries,
        });
      }}
      style={{ paddingTop: 20 }}
    >
      <Row gutter={16}>
        <Col xs={24} md={10}>
          <Form.Item name="nominationType" label="Nomination Type">
            <Select
              disabled={!editing}
              allowClear
              placeholder="Select nomination type"
              options={NOMINATION_OPTIONS}
            />
          </Form.Item>
        </Col>
        <Col xs={24}>
          <Form.List name="beneficiaries">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field) => (
                  <Row gutter={16} key={field.key} align="middle">
                    <Col xs={24} md={6}>
                      <Form.Item
                        {...field}
                        name={[field.name, "relationshipStatus"]}
                        label={field.name === 0 ? "Relationship Status" : " "}
                      >
                        <Select
                          disabled={!editing}
                          placeholder="Select relationship"
                          options={getRelationshipOptions(nominationType)}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={6}>
                      <Form.Item
                        {...field}
                        name={[field.name, "beneficiaryName"]}
                        label={field.name === 0 ? "Beneficiary Name" : " "}
                      >
                        <Input
                          disabled={!editing}
                          placeholder="Beneficiary name"
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={5}>
                      <Form.Item
                        {...field}
                        name={[field.name, "DOB"]}
                        label={field.name === 0 ? "DOB" : " "}
                      >
                        <Input disabled={!editing} placeholder="DD/MM/YYYY" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={5}>
                      <Form.Item
                        {...field}
                        name={[field.name, "shareBenefit"]}
                        label={field.name === 0 ? "Share of Benefit" : " "}
                      >
                        <Input
                          disabled={!editing}
                          placeholder="0.00%"
                          onBlur={(event) => {
                            const current =
                              form.getFieldValue("beneficiaries") || [];
                            const currentValue = parsePercent(event?.target?.value);
                            const otherValues = current.reduce(
                              (sum, item, index) => {
                                if (index === field.name) return sum;
                                return sum + parsePercent(item?.shareBenefit);
                              },
                              0,
                            );
                            const nextValue = Math.min(
                              currentValue,
                              Math.max(0, 100 - otherValues),
                            );
                            form.setFieldValue(
                              ["beneficiaries", field.name, "shareBenefit"],
                              `${nextValue.toFixed(2)}%`,
                            );
                          }}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={2}>
                      {editing ? (
                        <Button
                          danger
                          type="text"
                          icon={<MinusCircleOutlined />}
                          onClick={() => remove(field.name)}
                        />
                      ) : null}
                    </Col>
                  </Row>
                ))}
                {editing ? (
                  <Button
                    type="dashed"
                    onClick={() => add({ shareBenefit: "0.00%" })}
                    icon={<PlusOutlined />}
                  >
                    Add beneficiary
                  </Button>
                ) : null}
              </>
            )}
          </Form.List>
        </Col>
        <Col xs={24}>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 12,
            }}
          >
            <Button onClick={onClose}>{editing ? "Cancel" : "Close"}</Button>
            {editing ? (
              <Button type="primary" htmlType="submit">
                Save
              </Button>
            ) : null}
          </div>
        </Col>
      </Row>
    </Form>
  );
}
