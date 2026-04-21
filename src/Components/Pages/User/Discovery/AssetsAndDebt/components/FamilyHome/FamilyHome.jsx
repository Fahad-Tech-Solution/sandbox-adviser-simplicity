import { Button, Col, Form, Row, Space, message } from "antd";
import { useAtomValue, useSetAtom } from "jotai";
import React, { useEffect, useMemo, useState } from "react";
import { FaRegBuilding } from "react-icons/fa";
import { RiEdit2Fill } from "react-icons/ri";
import EditableDynamicTable from "../../../../../../Common/EditableDynamicTable.jsx";
import AppModal from "../../../../../../Common/AppModal.jsx";
import { renderModalContent } from "../../../../../../Common/renderModalContent.jsx";
import { discoveryDataAtom } from "../../../../../../../store/authState";
import { toCommaAndDollar } from "../../../../../../../hooks/helpers";
import useApi from "../../../../../../../hooks/useApi.js";
import HomeLoanModal from "./HomeLoanModal.jsx";

const TABLE_PROPS = {
  showCount: false,
  noPagination: true,
  horizontalScroll: true,
  tableStyle: { borderRadius: 12, overflow: "hidden" },
  headerFontSize: 11,
  bodyFontSize: 12,
};

function parseNumericString(value) {
  return String(value ?? "").replace(/[^0-9]/g, "");
}

function parseCurrencyValue(value) {
  if (value === null || value === undefined || value === "") return undefined;
  const numeric = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numeric) ? numeric : undefined;
}

function formatCurrencyValue(value) {
  const numeric = parseCurrencyValue(value);
  return numeric ? toCommaAndDollar(numeric) : "";
}

function formatPercentValue(value) {
  const digits = parseNumericString(value?.target?.value ?? value);
  if (!digits) return "";
  const limited = Math.min(Number(digits), 100);
  return `${limited}%`;
}

function percentToNumber(value) {
  return Math.min(
    Number(String(value ?? "").replace(/[^0-9.-]/g, "")) || 0,
    100,
  );
}

function buildInitialValues(sectionData = {}, discoveryData = {}) {
  const personalDetails =
    discoveryData?.personalDetails || discoveryData?.personaldetails || {};
  const client = personalDetails?.client || {};

  return {
    address: sectionData?.address || client?.clientHomeAddress || "",
    postCode: sectionData?.postCode || client?.clientPostcode || "",
    currentValue: sectionData?.currentValue || "",
    costBase: sectionData?.costBase || "",
    clientOwnership: sectionData?.clientOwnership || "",
    partnerOwnership: sectionData?.partnerOwnership || "",
    loanAttached: sectionData?.loanAttached || "",
    loanAmount: sectionData?.loanAmount || "",
    annualRepayments: sectionData?.annualRepayments || "",
    HomeLoanModal: sectionData?.HomeLoanModal || {},
  };
}

export default function FamilyHome({ modalData }) {
  const [form] = Form.useForm();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [openModalData, setOpenModalData] = useState(null);
  const discoveryData = useAtomValue(discoveryDataAtom);
  const setDiscoveryData = useSetAtom(discoveryDataAtom);
  const { post, patch } = useApi();

  const sectionData = discoveryData?.[modalData?.key] || {};
  const initialValues = useMemo(
    () => buildInitialValues(sectionData, discoveryData),
    [sectionData, discoveryData],
  );

  const address = Form.useWatch("address", form);
  const postCode = Form.useWatch("postCode", form);
  const currentValue = Form.useWatch("currentValue", form);
  const costBase = Form.useWatch("costBase", form);
  const clientOwnership = Form.useWatch("clientOwnership", form);
  const partnerOwnership = Form.useWatch("partnerOwnership", form);
  const loanAmount = Form.useWatch("loanAmount", form);

  useEffect(() => {
    form.setFieldsValue(initialValues);
    setEditing(!sectionData?._id);
  }, [form, initialValues, sectionData?._id]);

  const handleOwnershipChange = (sourceKey, value) => {
    const formatted = formatPercentValue(value);
    form.setFieldValue(sourceKey, formatted);

    const numeric = percentToNumber(formatted);
    const pairedKey =
      sourceKey === "clientOwnership" ? "partnerOwnership" : "clientOwnership";
    form.setFieldValue(pairedKey, formatted ? `${100 - numeric}%` : "");
  };

  const tableColumns = [
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
      field: "address",
      type: "text",
      placeholder: "Address",
      disabled: true,
      width: 220,
    },
    {
      title: "Postcode/Suburb",
      dataIndex: "postCode",
      key: "postCode",
      field: "postCode",
      type: "postalcode-search",
      placeholder: "Postcode/Suburb",
      width: 180,
    },
    {
      title: (
        <>
          Current Value{" "}
          <a
            href="https://www.property.com.au/"
            target="_blank"
            rel="noreferrer"
            style={{ color: "white" }}
          >
            <FaRegBuilding />
          </a>
        </>
      ),
      dataIndex: "currentValue",
      key: "currentValue",
      field: "currentValue",
      type: "text",
      placeholder: "Current Value",
      width: 150,
      onChange: (value, record, column, currentForm) => {
        currentForm.setFieldValue(
          column.field,
          formatCurrencyValue(value?.target?.value),
        );
      },
    },
    {
      title: "Cost base",
      dataIndex: "costBase",
      key: "costBase",
      field: "costBase",
      type: "text",
      placeholder: "Cost base",
      width: 130,
      onChange: (value, record, column, currentForm) => {
        currentForm.setFieldValue(
          column.field,
          formatCurrencyValue(value?.target?.value),
        );
      },
    },
    {
      title: "Client Ownership",
      dataIndex: "clientOwnership",
      key: "clientOwnership",
      field: "clientOwnership",
      type: "text",
      placeholder: "Client Ownership",
      width: 130,
      onChange: (value) =>
        handleOwnershipChange("clientOwnership", value?.target?.value),
    },
    {
      title: "Partner Ownership",
      dataIndex: "partnerOwnership",
      key: "partnerOwnership",
      field: "partnerOwnership",
      type: "text",
      placeholder: "Partner Ownership",
      width: 130,
      onChange: (value) =>
        handleOwnershipChange("partnerOwnership", value?.target?.value),
    },
    {
      title: "Loan Amount",
      dataIndex: "loanAttached",
      key: "familyHomeLoan",
      field: "loanAttached",
      type: "modalPopup",
      action: {
        key: "familyHomeLoan",
        name: "Open Home Loan",
        onClick: ({ form: currentForm }) => {
          setOpenModal(true);
          setOpenModalData({
            title: "Home Loan",
            component: <HomeLoanModal />,
            icon: null,
            key: "familyHomeLoan",
            width: 1200,
            closeModal: () => setOpenModal(false),
            parentForm: currentForm,
          });
        },
      },
      width: 120,
      renderView: ({ record }) => record.loanAmount || "--",
    },
  ];

  const rowData = useMemo(
    () => [
      {
        key: "familyHome",
        formPath: [],
        address: address ?? initialValues.address,
        postCode: postCode ?? initialValues.postCode,
        currentValue: currentValue ?? initialValues.currentValue,
        costBase: costBase ?? initialValues.costBase,
        clientOwnership: clientOwnership ?? initialValues.clientOwnership,
        partnerOwnership: partnerOwnership ?? initialValues.partnerOwnership,
        loanAttached: loanAmount ?? initialValues.loanAmount,
        loanAmount: loanAmount ?? initialValues.loanAmount,
      },
    ],
    [
      address,
      clientOwnership,
      costBase,
      currentValue,
      initialValues,
      loanAmount,
      partnerOwnership,
      postCode,
    ],
  );

  const handleFinish = async (values) => {
    const formValues = form.getFieldsValue(true);
    const sourceValues = { ...formValues, ...values };

    const payload = {
      ...(sectionData && typeof sectionData === "object" ? sectionData : {}),
      clientFK: sectionData?.clientFK || discoveryData?.personalDetails?._id,
      postCode: sourceValues?.postCode || "",
      currentValue: formatCurrencyValue(sourceValues?.currentValue),
      costBase: formatCurrencyValue(sourceValues?.costBase),
      clientOwnership: sourceValues?.clientOwnership || "",
      partnerOwnership: sourceValues?.partnerOwnership || "",
      loanAttached: sourceValues?.loanAttached || "",
      loanAmount:
        formatCurrencyValue(sourceValues?.loanAmount) ||
        formatCurrencyValue(sourceValues?.HomeLoanModal?.loanBalance),
      annualRepayments:
        formatCurrencyValue(sourceValues?.annualRepayments) ||
        formatCurrencyValue(sourceValues?.HomeLoanModal?.annualRepayments),
      HomeLoanModal: sourceValues?.HomeLoanModal || {},
      clientTotal: formatCurrencyValue(sourceValues?.currentValue),
      partnerTotal:
        formatCurrencyValue(sourceValues?.loanAmount) ||
        formatCurrencyValue(sourceValues?.HomeLoanModal?.loanBalance),
    };

    payload.__v = undefined;

    try {
      setSaving(true);

      const saved = sectionData?._id
        ? await patch("/api/familyHome/Update", payload)
        : await post("/api/familyHome/Add", payload);

      setDiscoveryData((prev) => ({
        ...(prev && typeof prev === "object" ? prev : {}),
        [modalData.key]: saved || payload,
      }));

      message.success(
        `${modalData?.title || "Family Home"} updated successfully`,
      );
      modalData?.closeModal?.();
    } catch (error) {
      message.error(
        error?.response?.data?.message ||
          error?.message ||
          `Failed to update ${modalData?.title || "Family Home"}`,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: "16px 0px 0px 0px" }}>
      <AppModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        title={openModalData?.title || "N/A"}
        width={openModalData?.width || 1000}
      >
        {renderModalContent(openModalData)}
      </AppModal>

      <Form
        form={form}
        initialValues={initialValues}
        onFinish={handleFinish}
        layout="vertical"
      >
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <EditableDynamicTable
              form={form}
              editing={editing}
              columns={tableColumns}
              data={rowData}
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
                    key="edit"
                    onClick={() => setEditing(true)}
                  >
                    Edit <RiEdit2Fill />
                  </Button>
                ) : (
                  <Button
                    key="save"
                    type="primary"
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
