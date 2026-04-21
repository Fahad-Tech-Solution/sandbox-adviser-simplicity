import { Button, Col, Form, Row, Select, Space, message } from "antd";
import { useAtomValue, useSetAtom } from "jotai";
import React, { useEffect, useMemo, useState } from "react";
import { RiEdit2Fill } from "react-icons/ri";
import EditableDynamicTable from "../../../../../../Common/EditableDynamicTable.jsx";
import { discoveryDataAtom } from "../../../../../../../store/authState";
import { toCommaAndDollar } from "../../../../../../../hooks/helpers";
import useApi from "../../../../../../../hooks/useApi.js";
import { useOwnerOptions } from "../../../../../../../hooks/useUserDashboardData.js";

const TABLE_PROPS = {
  showCount: false,
  noPagination: true,
  horizontalScroll: true,
  tableStyle: { borderRadius: 12, overflow: "hidden" },
  headerFontSize: 11,
  bodyFontSize: 12,
};

const JOINT_OPTION = { label: "Joint", value: "joint" };

const ASSET_CONFIG = {
  car: {
    addEndpoint: "/api/car/Add",
    updateEndpoint: "/api/car/Update",
    type: "split",
    extraField: {
      key: "modelOfCar",
      title: "Model of Car",
      placeholder: "Model of Car",
    },
  },
  houseHold: {
    addEndpoint: "/api/houseHold/Add",
    updateEndpoint: "/api/houseHold/Update",
    type: "joint",
  },
  boat: {
    addEndpoint: "/api/boat/Add",
    updateEndpoint: "/api/boat/Update",
    type: "joint",
  },
  caravan: {
    addEndpoint: "/api/caravan/Add",
    updateEndpoint: "/api/caravan/Update",
    type: "joint",
  },
  otherAssets: {
    addEndpoint: "/api/otherAssets/Add",
    updateEndpoint: "/api/otherAssets/Update",
    type: "joint",
    extraField: {
      key: "description",
      title: "Description",
      placeholder: "Description",
    },
  },
};

function parseCurrencyValue(value) {
  if (value === null || value === undefined || value === "") return undefined;
  const numeric = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numeric) ? numeric : undefined;
}

function formatCurrencyValue(value) {
  const numeric = parseCurrencyValue(value);
  return numeric ? toCommaAndDollar(numeric) : "";
}

function buildInnerValues(data = {}, extraFieldKey) {
  return {
    ...(extraFieldKey ? { [extraFieldKey]: data?.[extraFieldKey] || "" } : {}),
    currentValue: data?.currentValue || "",
  };
}

function buildInitialValues(sectionData = {}, config) {
  if (config?.type === "joint") {
    return {
      owner: ["joint"],
      joint: buildInnerValues(
        sectionData?.joint || {},
        config?.extraField?.key,
      ),
    };
  }

  return {
    owner: Array.isArray(sectionData?.owner) ? sectionData.owner : [],
    client: buildInnerValues(
      sectionData?.client || {},
      config?.extraField?.key,
    ),
    partner: buildInnerValues(
      sectionData?.partner || {},
      config?.extraField?.key,
    ),
  };
}

function getOwnerDisplayName(ownerValue, ownerOptions = [], discoveryData = {}) {
  if (!ownerValue) return "--";

  if (ownerValue === "joint" || ownerValue === JOINT_OPTION.label) {
    const clientName =
      discoveryData?.personalDetails?.client?.clientPreferredName ||
      discoveryData?.personaldetails?.client?.clientPreferredName ||
      "Client";
    const partnerName =
      discoveryData?.personalDetails?.partner?.partnerPreferredName ||
      discoveryData?.personaldetails?.partner?.partnerPreferredName ||
      "";

    return partnerName ? `${clientName} & ${partnerName}` : clientName;
  }

  return (
    ownerOptions.find((item) => item.value === ownerValue)?.label ||
    ownerOptions.find((item) => item.label === ownerValue)?.label ||
    ownerValue
  );
}

function buildRows({
  config,
  selectedOwners,
  initialValues,
  watchedClient,
  watchedPartner,
  watchedJoint,
  ownerOptions,
}) {
  if (config?.type === "joint") {
    return [
      {
        key: "joint",
        owner: "joint",
        formPath: ["joint"],
        ...(watchedJoint || initialValues?.joint || {}),
      },
    ];
  }

  const ownerLabelMap = new Map(
    ownerOptions.map((item) => [item.value, item.label]),
  );
  const rows = [];

  if (selectedOwners.includes("client")) {
    rows.push({
      key: "client",
      owner: ownerLabelMap.get("client") || "Client",
      formPath: ["client"],
      ...(watchedClient || initialValues?.client || {}),
    });
  }

  if (selectedOwners.includes("partner")) {
    rows.push({
      key: "partner",
      owner: ownerLabelMap.get("partner") || "Partner",
      formPath: ["partner"],
      ...(watchedPartner || initialValues?.partner || {}),
    });
  }

  return rows;
}

export default function AssetInfoModal({ modalData }) {
  const [form] = Form.useForm();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const discoveryData = useAtomValue(discoveryDataAtom);
  const setDiscoveryData = useSetAtom(discoveryDataAtom);
  const { post, patch } = useApi();
  const ownerOptions = useOwnerOptions();

  const config = ASSET_CONFIG[modalData?.key] || ASSET_CONFIG.car;
  const allowPartner = !["Single", "Widowed"].includes(
    discoveryData?.personalDetails?.client?.clientMaritalStatus,
  );
  const sectionData = discoveryData?.[modalData?.key] || {};
  const initialValues = useMemo(
    () => buildInitialValues(sectionData, config),
    [config, sectionData],
  );

  const selectedOwners =
    Form.useWatch("owner", form) || initialValues?.owner || [];
  const watchedClient = Form.useWatch("client", form);
  const watchedPartner = Form.useWatch("partner", form);
  const watchedJoint = Form.useWatch("joint", form);

  useEffect(() => {
    form.setFieldsValue(initialValues);
    setEditing(!sectionData?._id);
  }, [form, initialValues, sectionData?._id]);

  const availableOwnerOptions = useMemo(() => {
    if (config?.type === "joint") {
      return [JOINT_OPTION];
    }

    return allowPartner
      ? ownerOptions.filter(
          (item) => item.value === "client" || item.value === "partner",
        )
      : ownerOptions.filter((item) => item.value === "client");
  }, [allowPartner, config?.type, ownerOptions]);

  useEffect(() => {
    if (config?.type === "joint") {
      form.setFieldValue("owner", ["joint"]);
      return;
    }

    if (!allowPartner && selectedOwners.includes("partner")) {
      form.setFieldValue(
        "owner",
        selectedOwners.filter((item) => item !== "partner"),
      );
      form.setFieldValue("partner", initialValues.partner || {});
    }
  }, [allowPartner, config?.type, form, initialValues.partner, selectedOwners]);

  const rows = useMemo(
    () =>
      buildRows({
        config,
        selectedOwners,
        initialValues,
        watchedClient,
        watchedPartner,
        watchedJoint,
        ownerOptions: availableOwnerOptions,
      }),
    [
      availableOwnerOptions,
      config,
      initialValues,
      selectedOwners,
      watchedClient,
      watchedJoint,
      watchedPartner,
    ],
  );

  const tableColumns = useMemo(() => {
    const columns = [
      {
        title: "Owner",
        key: "owner",
        dataIndex: "owner",
        editable: false,
        renderView: ({ value }) => getOwnerDisplayName(value, availableOwnerOptions, discoveryData),
      },
    ];

    if (config?.extraField) {
      columns.push({
        title: config.extraField.title,
        key: config.extraField.key,
        dataIndex: config.extraField.key,
        field: config.extraField.key,
        type: "text",
        placeholder: config.extraField.placeholder,
      });
    }

    columns.push({
      title: "Current Value",
      key: "currentValue",
      dataIndex: "currentValue",
      field: "currentValue",
      type: "text",
      placeholder: "Current Value",
      onChange: (value, record, column, currentForm) => {
        currentForm.setFieldValue(
          [...(record?.formPath || []), column.field],
          formatCurrencyValue(value?.target?.value),
        );
      },
    });

    return columns;
  }, [availableOwnerOptions, config, discoveryData]);

  const handleFinish = async (values) => {
    const formValues = form.getFieldsValue(true);
    const sourceValues = {
      ...formValues,
      ...values,
      client: {
        ...(formValues?.client || {}),
        ...(values?.client || {}),
      },
      partner: {
        ...(formValues?.partner || {}),
        ...(values?.partner || {}),
      },
      joint: {
        ...(formValues?.joint || {}),
        ...(values?.joint || {}),
      },
    };

    const payload = {
      ...sectionData,
      owner:
        config?.type === "joint"
          ? ["joint"]
          : Array.isArray(sourceValues?.owner)
            ? sourceValues.owner
            : [],
      clientFK:
        sectionData?.clientFK ||
        discoveryData?.personalDetails?._id ||
        discoveryData?.personaldetails?._id ||
        undefined,
    };

    if (config?.type === "joint") {
      payload.joint = {
        ...(sectionData?.joint || {}),
        ...(config?.extraField
          ? {
              [config.extraField.key]:
                sourceValues?.joint?.[config.extraField.key] || "",
            }
          : {}),
        currentValue: formatCurrencyValue(sourceValues?.joint?.currentValue),
      };
      payload.jointTotal = formatCurrencyValue(
        sourceValues?.joint?.currentValue,
      );
    } else {
      const owner = payload.owner;
      const clientSelected = owner.includes("client");
      const partnerSelected = allowPartner && owner.includes("partner");

      payload.client = clientSelected
        ? {
            ...(sectionData?.client || {}),
            ...(config?.extraField
              ? {
                  [config.extraField.key]:
                    sourceValues?.client?.[config.extraField.key] || "",
                }
              : {}),
            currentValue: formatCurrencyValue(
              sourceValues?.client?.currentValue,
            ),
          }
        : {};

      payload.partner = partnerSelected
        ? {
            ...(sectionData?.partner || {}),
            ...(config?.extraField
              ? {
                  [config.extraField.key]:
                    sourceValues?.partner?.[config.extraField.key] || "",
                }
              : {}),
            currentValue: formatCurrencyValue(
              sourceValues?.partner?.currentValue,
            ),
          }
        : {};

      payload.clientTotal = clientSelected
        ? formatCurrencyValue(sourceValues?.client?.currentValue)
        : "";
      payload.partnerTotal = partnerSelected
        ? formatCurrencyValue(sourceValues?.partner?.currentValue)
        : "";
    }

    try {
      setSaving(true);

      const saved = sectionData?._id
        ? await patch(config.updateEndpoint, payload)
        : await post(config.addEndpoint, payload);

      setDiscoveryData((prev) => ({
        ...(prev && typeof prev === "object" ? prev : {}),
        [modalData.key]: saved || payload,
      }));

      message.success(`${modalData?.title || "Asset"} updated successfully`);
      modalData?.closeModal?.();
    } catch (error) {
      message.error(
        error?.response?.data?.message ||
          error?.message ||
          `Failed to update ${modalData?.title || "Asset"}`,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: "16px 0px 0px 0px" }}>
      <Form
        form={form}
        initialValues={initialValues}
        onFinish={handleFinish}
        colon={false}
        requiredMark={false}
        styles={{
          label: {
            fontWeight: "600",
            fontSize: "13px",
            fontFamily: "Arial, serif",
          },
        }}
      >
        <Row gutter={[16, 16]}>
          {config?.type !== "joint" ? (
            <Col xs={24} md={9}>
              <Form.Item
                label="Owner"
                name="owner"
                style={{ marginBottom: 0 }}
                rules={[{ required: true, message: "Owner is required" }]}
              >
                <Select
                  mode="multiple"
                  options={availableOwnerOptions}
                  placeholder="Select owner"
                  disabled={!editing}
                  style={{ width: "100%" }}
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>
          ) : null}

          <Col xs={24}>
            <EditableDynamicTable
              form={form}
              editing={editing}
              columns={tableColumns}
              data={rows}
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
                <Button onClick={() => modalData?.closeModal?.()}>
                  Cancel
                </Button>
                {!editing ? (
                  <Button
                    type="primary"
                    key={"edit"}
                    htmlType="button"
                    onClick={() => setEditing(true)}
                  >
                    Edit <RiEdit2Fill />
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    key={"save"}
                    htmlType="submit"
                    loading={saving}
                    disabled={saving}
                  >
                    Save
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
