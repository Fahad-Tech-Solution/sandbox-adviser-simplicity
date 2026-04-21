import { Button, Col, Form, message, Row, Select, Space } from "antd";
import { useAtomValue, useSetAtom } from "jotai";
import React, { useEffect, useMemo, useState } from "react";
import EditableDynamicTable from "../../../../../../Common/EditableDynamicTable.jsx";
import { RiEdit2Fill } from "react-icons/ri";
import { discoveryDataAtom } from "../../../../../../../store/authState.js";
import {
  formatNumber,
  toCommaAndDollar,
} from "../../../../../../../hooks/helpers.js";
import { useOwnerOptions } from "../../../../../../../hooks/useUserDashboardData.js";
import useApi from "../../../../../../../hooks/useApi.js";

const TABLE_PROPS = {
  showCount: false,
  noPagination: true,
  horizontalScroll: true,
  tableStyle: { borderRadius: 12, overflow: "hidden" },
  headerFontSize: 11,
  bodyFontSize: 12,
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

function parseDigitsValue(value) {
  return String(value ?? "").replace(/[^0-9]/g, "");
}

function getChangedValue(value) {
  return value?.target?.value ?? value;
}

function formatNumericInput(value, { currency = false } = {}) {
  const digits = parseDigitsValue(getChangedValue(value));
  if (!digits) return "";
  return currency ? toCommaAndDollar(digits) : formatNumber(Number(digits));
}

function Formula(record, currentForm) {
  const fortnight = parseCurrencyValue(
    currentForm.getFieldValue([record.formPath, "regularIncomePerFortnight"]),
  );

  if (fortnight === undefined) {
    currentForm.setFieldValue([record.formPath, "regularIncomePA"], "");
    return;
  }

  currentForm.setFieldValue(
    [record.formPath, "regularIncomePA"],
    formatCurrencyValue(fortnight * 26),
  );
}

function toYesNo(value) {
  if (value === "Yes" || value === true) return "Yes";
  if (value === "No" || value === false) return "No";
  return "No";
}

function buildInitialPerson(person = {}, totalValue = "") {
  const regularIncomePerFortnight = formatCurrencyValue(
    person?.regularIncomePerFortnight,
  );

  const regularIncomePA = formatCurrencyValue(
    person?.regularIncomePA ||
      totalValue ||
      (parseCurrencyValue(regularIncomePerFortnight) || 0) * 26,
  );

  return {
    fundName: person?.fundName || undefined,
    regularIncomePerFortnight,
    regularIncomePA,
    centrelinkDeductibleAmount: formatCurrencyValue(
      person?.centrelinkDeductibleAmount,
    ),
    isPension: toYesNo(person?.isPension),
  };
}

function buildInitialValues(sectionData, allowPartner) {
  const rawOwner = Array.isArray(sectionData?.owner) ? sectionData.owner : [];
  const owner = allowPartner
    ? rawOwner
    : rawOwner.filter((value) => value === "client");

  return {
    owner,
    client: buildInitialPerson(sectionData?.client, sectionData?.clientTotal),
    partner: buildInitialPerson(
      sectionData?.partner,
      sectionData?.partnerTotal,
    ),
  };
}

export default function LifetimePensionModal({ modalData }) {
  const [form] = Form.useForm();
  const ownerOptions = useOwnerOptions();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const { post, patch } = useApi();

  const discoveryData = useAtomValue(discoveryDataAtom);
  const setDiscoveryData = useSetAtom(discoveryDataAtom);
  const sectionData = discoveryData?.[modalData?.key] || {};
  const allowPartner = !["Single", "Widowed"].includes(
    discoveryData?.personalDetails?.client?.clientMaritalStatus,
  );

  const availableOwnerOptions = useMemo(
    () =>
      allowPartner
        ? ownerOptions
        : ownerOptions.filter((option) => option.value === "client"),
    [allowPartner, ownerOptions],
  );

  const fundOptions = [
    { value: "ESS Super", label: "ESS Super" },
    { value: "PSS", label: "PSS" },
    { value: "CSC", label: "CSC" },
    { value: "Uni Super", label: "Uni Super" },
    { value: "Telstra", label: "Telstra" },
    { value: "Other", label: "Other" },
  ];

  const LIFETIME_PENSION_COLUMNS = [
    { title: "Owner", key: "owner", kind: "owner", width: 80 },
    {
      title: "Fund Name",
      dataIndex: "fundName",
      key: "fundName",
      field: "fundName",
      type: "select",
      options: fundOptions,
      placeholder: "Fund Name",
    },
    {
      title: "Fortnight Payment",
      dataIndex: "regularIncomePerFortnight",
      key: "regularIncomePerFortnight",
      field: "regularIncomePerFortnight",
      type: "text",
      placeholder: "Fortnight Payment",
      onChange: (value, record, column, currentForm) => {
        currentForm.setFieldValue(
          [record.formPath, column.field],
          formatNumericInput(value, { currency: true }),
        );
        Formula(record, currentForm);
      },
    },
    {
      title: "Annual Payment",
      dataIndex: "regularIncomePA",
      key: "regularIncomePA",
      field: "regularIncomePA",
      type: "text",
      placeholder: "Annual Payment",
      disabled: true,
      editable: true,
    },
    {
      title: "Centrelink Deductible Amount",
      dataIndex: "centrelinkDeductibleAmount",
      key: "centrelinkDeductibleAmount",
      field: "centrelinkDeductibleAmount",
      type: "text",
      placeholder: "Centrelink Deductible Amount",
      onChange: (value, record, column, currentForm) => {
        currentForm.setFieldValue(
          [record.formPath, column.field],
          formatNumericInput(value, { currency: true }),
        );
      },
    },
    {
      title: "Is Pension Tax Fee",
      dataIndex: "isPension",
      key: "isPension",
      field: "isPension",
      type: "yesNoSwitch",
    },
  ];

  const initialValues = useMemo(
    () => buildInitialValues(sectionData, allowPartner),
    [allowPartner, sectionData],
  );
  const selectedOwners = Form.useWatch("owner", form) || initialValues.owner;

  const tableColumns = useMemo(
    () =>
      LIFETIME_PENSION_COLUMNS.map((column) =>
        column.kind === "owner"
          ? {
              ...column,
              dataIndex: "ownerLabel",
              editable: false,
            }
          : column,
      ),
    [LIFETIME_PENSION_COLUMNS],
  );

  const rows = useMemo(
    () =>
      (selectedOwners || [])
        .filter((owner) => allowPartner || owner === "client")
        .map((owner) => ({
          key: owner,
          formPath: owner,
          ownerLabel:
            availableOwnerOptions.find((option) => option.value === owner)
              ?.label || owner,
          fundName: form.getFieldValue([owner, "fundName"]),
          regularIncomePerFortnight: form.getFieldValue([
            owner,
            "regularIncomePerFortnight",
          ]),
          regularIncomePA: form.getFieldValue([owner, "regularIncomePA"]),
          centrelinkDeductibleAmount: form.getFieldValue([
            owner,
            "centrelinkDeductibleAmount",
          ]),
          isPension: form.getFieldValue([owner, "isPension"]),
        })),
    [allowPartner, availableOwnerOptions, form, selectedOwners],
  );

  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [form, initialValues]);

  useEffect(() => {
    if (!allowPartner && selectedOwners?.includes("partner")) {
      form.setFieldValue(
        "owner",
        selectedOwners.filter((owner) => owner === "client"),
      );
    }
  }, [allowPartner, form, selectedOwners]);

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
    };

    const owner = Array.isArray(sourceValues.owner) ? sourceValues.owner : [];
    const clientSelected = owner.includes("client");
    const partnerSelected = allowPartner && owner.includes("partner");

    const payload = {
      ...sectionData,
      owner,
      clientFK:
        sectionData?.clientFK ||
        discoveryData?.personalDetails?._id ||
        undefined,
      client: clientSelected
        ? {
            ...(sectionData?.client || {}),
            fundName: sourceValues?.client?.fundName || "",
            regularIncomePerFortnight: formatCurrencyValue(
              sourceValues?.client?.regularIncomePerFortnight,
            ),
            regularIncomePA: formatCurrencyValue(
              sourceValues?.client?.regularIncomePA,
            ),
            centrelinkDeductibleAmount: formatCurrencyValue(
              sourceValues?.client?.centrelinkDeductibleAmount,
            ),
            isPension: toYesNo(sourceValues?.client?.isPension),
          }
        : {},
      partner: partnerSelected
        ? {
            ...(sectionData?.partner || {}),
            fundName: sourceValues?.partner?.fundName || "",
            regularIncomePerFortnight: formatCurrencyValue(
              sourceValues?.partner?.regularIncomePerFortnight,
            ),
            regularIncomePA: formatCurrencyValue(
              sourceValues?.partner?.regularIncomePA,
            ),
            centrelinkDeductibleAmount: formatCurrencyValue(
              sourceValues?.partner?.centrelinkDeductibleAmount,
            ),
            isPension: toYesNo(sourceValues?.partner?.isPension),
          }
        : {},
      clientTotal: clientSelected
        ? formatCurrencyValue(sourceValues?.client?.regularIncomePA)
        : "",
      partnerTotal: partnerSelected
        ? formatCurrencyValue(sourceValues?.partner?.regularIncomePA)
        : "",
    };

    try {
      setSaving(true);

      const saved = sectionData?.clientFK
        ? await patch("/api/incomeFromSuperPayment/Update", payload)
        : await post("/api/incomeFromSuperPayment/Add", payload);

      setDiscoveryData((prev) => ({
        ...(prev && typeof prev === "object" ? prev : {}),
        [modalData.key]: saved || payload,
      }));

      message.success(
        `${modalData?.title || "Lifetime Pension"} updated successfully`,
      );
      modalData?.closeModal?.();
    } catch (error) {
      message.error(
        error?.response?.data?.message ||
          error?.message ||
          `Failed to update ${modalData?.title || "Lifetime Pension"}`,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: "16px 4px 0px 4px" }}>
      <Form
        form={form}
        initialValues={initialValues}
        onFinish={handleFinish}
        styles={{
          label: {
            fontWeight: "600",
            fontSize: "13px",
            fontFamily: "Arial, serif",
          },
        }}
        colon={false}
        requiredMark={false}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Form.Item
              label="Owner"
              name="owner"
              style={{ marginBottom: 0 }}
              rules={[{ required: true, message: "Owner is required" }]}
            >
              <Select
                options={availableOwnerOptions}
                mode="multiple"
                placeholder="Select owner"
                style={{ width: "100%" }}
                styles={{
                  items: {
                    fontSize: "11px",
                  },
                }}
                disabled={!editing}
              />
            </Form.Item>
          </Col>

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
                    htmlType="button"
                    key={"edit"}
                    onClick={() => setEditing(true)}
                  >
                    Edit <RiEdit2Fill />
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    htmlType="submit"
                    key={"save"}
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
