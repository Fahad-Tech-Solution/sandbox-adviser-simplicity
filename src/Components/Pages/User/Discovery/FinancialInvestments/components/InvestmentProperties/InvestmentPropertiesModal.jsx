import { Button, Col, Form, message, Row, Select, Space } from "antd";
import { useAtomValue, useSetAtom } from "jotai";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import EditableDynamicTable from "../../../../../../Common/EditableDynamicTable.jsx";
import { RiEdit2Fill } from "react-icons/ri";
// import { discoveryDataAtom, InvestmentOffersData } from "../../../../../../../store/authState.js";
import { discoveryDataAtom, InvestmentOffersData } from "../../../../../../../store/authState.js";
import { formatNumber, toCommaAndDollar } from "../../../../../../../hooks/helpers.js";
import useApi from "../../../../../../../hooks/useApi.js";
import AppModal from "../../../../../../Common/AppModal.jsx";
import { renderModalContent } from "../../../../../../Common/renderModalContent.jsx";
import InvestmentPropertyLoanBalanceModal from "./InvestmentPropertyLoanBalanceModal.jsx";
import InvestmentPropertyExpenseModal from "./InvestmentPropertyExpenseModal.jsx";

const TABLE_PROPS = {
    showCount: false,
    noPagination: true,
    horizontalScroll: true,
    tableStyle: { borderRadius: 12, overflow: "hidden" },
    headerFontSize: 11,
    bodyFontSize: 12,
};

function hasMeaningfulValues(initialValues = {}) {
    const rows = initialValues?.investmentProperties || [];
    if ((Number(initialValues?.numberOfProperties) || 0) > 0) return true;

    return rows.some((row) =>
        [
            row?.PropertyAddress,
            row?.postcodeSuburb,
            row?.CurrentValue,
            row?.CostBase,
            row?.weeklyRentalIncome,
            row?.propertyLoanDetails,
            row?.incomeExpenses,
        ].some((value) => String(value ?? "").trim() !== ""),
    );
}

function PopupDisplay({ value, onClick }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
            <div
                style={{
                    minHeight: 26,
                    width: 80,
                    padding: "2px 11px 2px 0px",
                    lineHeight: "22px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                }}
                title={value || ""}
            >
                {value || ""}
            </div>
            <Button type="primary" size="small" style={{ width: 25, padding: 0 }} onClick={onClick}>
                ↗
            </Button>
        </div>
    );
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

function parsePercentValue(value) {
    if (value === null || value === undefined || value === "") return undefined;
    const numeric = Number(String(value).replace(/[^0-9.]/g, ""));
    return Number.isFinite(numeric) ? numeric : undefined;
}

function formatPercentValue(value) {
    const numeric = parsePercentValue(value);
    if (numeric === undefined) return "";
    const bounded = Math.min(Math.max(numeric, 0), 100);
    return `${bounded.toFixed(2)}%`;
}

function buildEmptyProperty() {
    return {
        PropertyAddress: "",
        postcodeSuburb: "",
        CurrentValue: "",
        CostBase: "",
        clientOwnership: "",
        partnerOwnership: "",
        propertyLoanDetails: "$0",
        propertyLoanDetailsArray: [],
        weeklyRentalIncome: "",
        incomeExpenses: "$0",
        incomeExpensesArray: [],
    };
}

function normalizeProperty(entry = {}) {
    return {
        PropertyAddress: entry?.PropertyAddress || "",
        postcodeSuburb: entry?.postcodeSuburb || "",
        CurrentValue: entry?.CurrentValue || "",
        CostBase: entry?.CostBase || "",
        clientOwnership: entry?.clientOwnership || "",
        partnerOwnership: entry?.partnerOwnership || "",
        propertyLoanDetails: entry?.propertyLoanDetails || "$0",
        propertyLoanDetailsArray: Array.isArray(entry?.propertyLoanDetailsArray)
            ? entry.propertyLoanDetailsArray
            : [],
        weeklyRentalIncome: entry?.weeklyRentalIncome || "",
        incomeExpenses: entry?.incomeExpenses || "$0",
        incomeExpensesArray: Array.isArray(entry?.expensesArray)
            ? entry.expensesArray
            : Array.isArray(entry?.incomeExpensesArray)
                ? entry.incomeExpensesArray
                : [],
    };
}

function getCollectionKey(modalKey) {
    if (modalKey === "SMSFInvestmentProperties") return "SMSF";
    if (modalKey === "familyInvestmentProperties") return "trust";
    return "client";
}

export default function InvestmentPropertiesModal({ modalData }) {

    const [form] = Form.useForm();
    const investmentOffers = useAtomValue(InvestmentOffersData);
    const discoveryData = useAtomValue(discoveryDataAtom);
    const setDiscoveryData = useSetAtom(discoveryDataAtom);
    const { post, patch } = useApi();

    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [detailModalData, setDetailModalData] = useState(null);

    const sectionData = discoveryData?.[modalData?.key] || {};
    const collectionKey = getCollectionKey(modalData?.key);
    const isOwnershipEnabled =
        modalData?.key === "investmentPropertyDetails" ||
        modalData?.key === "familyInvestmentProperties";
    const pageLimit = modalData?.title === "SMSF_Investment Properties" ? 5 : 10;

    const lenderOptions = useMemo(() => {
        const institutions = investmentOffers?.FinancialInstitutions || [];
        return institutions
            .map((item) => ({
                value: String(item?._id ?? item?.value ?? ""),
                label: item?.platformName || item?.label || item?.name || item?._id || "",
            }))
            .filter((option) => option.value && option.label);
    }, [investmentOffers]);

    const initialValues = useMemo(() => {
        const existing = Array.isArray(sectionData?.[collectionKey])
            ? sectionData[collectionKey].map(normalizeProperty)
            : [];
        const count = existing.length ? String(existing.length) : "";
        return {
            numberOfProperties: count,
            investmentProperties: existing.length
                ? existing
                : [],
        };
    }, [collectionKey, sectionData]);

    const numberOfProperties =
        Form.useWatch("numberOfProperties", form) ?? initialValues.numberOfProperties;
    const properties =
        Form.useWatch("investmentProperties", form) ?? initialValues.investmentProperties;

    const [activeRowIndex, setActiveRowIndex] = useState(null);

    useEffect(() => {
        form.setFieldsValue(initialValues);
        setEditing(!hasMeaningfulValues(initialValues));
    }, [form, initialValues]);

    const handleCountChange = (nextValue) => {
        const count = Number(nextValue) || 0;
        const current = Array.isArray(form.getFieldValue("investmentProperties"))
            ? [...form.getFieldValue("investmentProperties")]
            : [];
        const next = Array.from({ length: count }, (_, idx) =>
            current[idx] ? current[idx] : buildEmptyProperty(),
        );
        form.setFieldValue("numberOfProperties", nextValue);
        form.setFieldValue("investmentProperties", next);
    };

    useEffect(() => {
        const count = Number(numberOfProperties) || 0;
        if (!count) return;
        const current = Array.isArray(properties) ? [...properties] : [];
        if (current.length === count) return;
        const next = Array.from({ length: count }, (_, idx) =>
            current[idx] ? current[idx] : buildEmptyProperty(),
        );
        form.setFieldValue("investmentProperties", next);
    }, [form, numberOfProperties, properties]);

    const setRowValue = (rowIndex, patchObj) => {
        const current = Array.isArray(form.getFieldValue("investmentProperties"))
            ? [...form.getFieldValue("investmentProperties")]
            : [];
        const next = current.map((row, idx) => (idx === rowIndex ? { ...(row || {}), ...patchObj } : row));
        form.setFieldValue("investmentProperties", next);
    };

    const openLoanModal = useCallback(
        ({ record, form: currentForm } = {}) => {
            const rowIndex =
                typeof record?.rowIndex === "number"
                    ? record.rowIndex
                    : typeof record?.rowNumber === "number"
                        ? record.rowNumber - 1
                        : null;
            if (rowIndex === null) return;

            setActiveRowIndex(rowIndex);
            setDetailModalOpen(true);
            setDetailModalData({
                type: "propertyLoan",
                title:
                    modalData?.title === "SMSF_Investment Properties"
                        ? "SMSF_Property Loan Details"
                        : modalData?.title === "Trust_Investment Property"
                            ? "Trust_Property Loan Details"
                            : "Property Loan Details",
                width: 1100,
                component: <InvestmentPropertyLoanBalanceModal />,
                editing,
                lenderOptions,
                valueArray:
                    currentForm?.getFieldValue?.([
                        "investmentProperties",
                        rowIndex,
                        "propertyLoanDetailsArray",
                    ]) || [],
                onSave: ({ array, total }) => {
                    setRowValue(rowIndex, {
                        propertyLoanDetailsArray: array,
                        propertyLoanDetails: total,
                    });
                },
                closeModal: () => {
                    setDetailModalOpen(false);
                    setEditing(true);
                },
            });
        },
        [editing, lenderOptions, modalData?.title],
    );

    const openExpenseModal = useCallback(
        ({ record, form: currentForm } = {}) => {
            const rowIndex =
                typeof record?.rowIndex === "number"
                    ? record.rowIndex
                    : typeof record?.rowNumber === "number"
                        ? record.rowNumber - 1
                        : null;
            if (rowIndex === null) return;

            console.log("record", currentForm?.getFieldValue?.(true));

            setActiveRowIndex(rowIndex);
            setDetailModalOpen(true);
            setDetailModalData({
                type: "propertyExpense",
                title: "Expense Details",
                width: 1200,
                component: <InvestmentPropertyExpenseModal />,
                editing,
                valueArray:
                    currentForm?.getFieldValue?.([
                        "investmentProperties",
                        rowIndex,
                        "incomeExpensesArray",
                    ]) || [],
                onSave: ({ array, total }) => {
                    setRowValue(rowIndex, {
                        incomeExpensesArray: array,
                        incomeExpenses: total,
                    });
                },
                closeModal: () => {
                    setDetailModalOpen(false);
                    setEditing(true);
                },
            });
        },
        [editing],
    );

    const handleRemoveRow = (rowIndex) => {
        const current = form.getFieldValue("investmentProperties") || [];
        const next = current.filter((_, idx) => idx !== rowIndex);
        const nextCount = next.length;

        if (activeRowIndex !== null) {
            if (activeRowIndex === rowIndex) {
                setDetailModalOpen(false);
                setActiveRowIndex(null);
            } else if (activeRowIndex > rowIndex) {
                setActiveRowIndex(activeRowIndex - 1);
            }
        }

        form.setFieldValue("investmentProperties", next);
        form.setFieldValue("numberOfProperties", nextCount ? String(nextCount) : "");
    };

    const columns = useMemo(() => {
        const base = [
            {
                title: "No#",
                dataIndex: "index",
                key: "index",
                editable: false,
                renderView: ({ record }) => record.rowIndex + 1,
            },
            {
                title: "Property Address",
                dataIndex: "PropertyAddress",
                key: "PropertyAddress",
                field: "PropertyAddress",
                type: "textarea",
                placeholder: "Property Address",
                width: 200,
            },
            {
                title: "Postcode/Suburb",
                dataIndex: "postcodeSuburb",
                key: "postcodeSuburb",
                field: "postcodeSuburb",
                type: "postalcode-search",
                placeholder: "Postcode/Suburb",
            },
            {
                title: "Current Value",
                dataIndex: "CurrentValue",
                key: "CurrentValue",
                field: "CurrentValue",
                type: "text",
                placeholder: "Current Value",
                onChange: (value, record, column, currentForm) => {
                    currentForm.setFieldValue(
                        [...record.formPath, column.field],
                        formatNumericInput(value, { currency: true }),
                    );
                },
            },
            {
                title: "Cost Base",
                dataIndex: "CostBase",
                key: "CostBase",
                field: "CostBase",
                type: "text",
                placeholder: "Cost Base",
                onChange: (value, record, column, currentForm) => {
                    currentForm.setFieldValue(
                        [...record.formPath, column.field],
                        formatNumericInput(value, { currency: true }),
                    );
                },
            },
        ];

        const ownershipCols = isOwnershipEnabled
            ? [
                {
                    title: "Client Ownership",
                    dataIndex: "clientOwnership",
                    key: "clientOwnership",
                    field: "clientOwnership",
                    type: "text",
                    placeholder: "Client Ownership",
                    onChange: (value, record, column, currentForm) => {
                        const numeric = parsePercentValue(getChangedValue(value)) || 0;
                        const bounded = Math.min(Math.max(numeric, 0), 100);
                        const partner = 100 - bounded;
                        currentForm.setFieldValue(
                            [...record.formPath, "clientOwnership"],
                            `${bounded.toFixed(2)}%`,
                        );
                        currentForm.setFieldValue(
                            [...record.formPath, "partnerOwnership"],
                            `${partner.toFixed(2)}%`,
                        );
                    },
                },
                {
                    title: "Partner Ownership",
                    dataIndex: "partnerOwnership",
                    key: "partnerOwnership",
                    field: "partnerOwnership",
                    type: "text",
                    placeholder: "Partner Ownership",
                    onChange: (value, record, column, currentForm) => {
                        const numeric = parsePercentValue(getChangedValue(value)) || 0;
                        const bounded = Math.min(Math.max(numeric, 0), 100);
                        const client = 100 - bounded;
                        currentForm.setFieldValue(
                            [...record.formPath, "partnerOwnership"],
                            `${bounded.toFixed(2)}%`,
                        );
                        currentForm.setFieldValue(
                            [...record.formPath, "clientOwnership"],
                            `${client.toFixed(2)}%`,
                        );
                    },
                },
            ]
            : [];

        const tail = [
            {
                title: "Loan Balance",
                dataIndex: "propertyLoanDetails",
                key: "propertyLoanDetails",
                field: "propertyLoanDetails",
                disabled: true,
                type: "input-action",
                action: {
                    name: "Open Loan Balance",
                    onClick: (payload) => openLoanModal(payload),
                },
                renderView: ({ value, record }) => (
                    <PopupDisplay value={value} onClick={() => openLoanModal({ record, form })} />
                ),
            },
            {
                title: "Rent per Week",
                dataIndex: "weeklyRentalIncome",
                key: "weeklyRentalIncome",
                field: "weeklyRentalIncome",
                type: "text",
                placeholder: "Rent per Week",
                onChange: (value, record, column, currentForm) => {
                    currentForm.setFieldValue(
                        [...record.formPath, column.field],
                        formatNumericInput(value, { currency: true }),
                    );
                },
            },
            {
                title: "Expenses",
                dataIndex: "incomeExpenses",
                key: "incomeExpenses",
                field: "incomeExpenses",
                disabled: true,
                type: "input-action",
                action: {
                    name: "Open Expense",
                    onClick: (payload) => openExpenseModal(payload),
                },
                renderView: ({ value, record }) => (
                    <PopupDisplay value={value} onClick={() => openExpenseModal({ record, form })} />
                ),

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
                        aria-label={`Remove row ${record?.rowIndex + 1}`}
                        onClick={() => handleRemoveRow(record.rowIndex)}
                    >
                        🗑️
                    </Button>
                ),
            },
        ];

        return [...base, ...ownershipCols, ...tail];
    }, [editing, isOwnershipEnabled, openLoanModal, openExpenseModal, handleRemoveRow, form]);

    const rows = useMemo(() => {
        const count = Number(numberOfProperties) || 0;
        return Array.from({ length: count }, (_, rowIndex) => {
            const row = properties?.[rowIndex] || buildEmptyProperty();
            return {
                key: `property-${rowIndex}`,
                rowIndex,
                formPath: ["investmentProperties", rowIndex],
                ...row,
            };
        });
    }, [numberOfProperties, properties]);

    const handleFinish = async (values) => {
        const count = Number(values?.numberOfProperties) || 0;
        const raw = Array.isArray(values?.investmentProperties) ? values.investmentProperties : [];
        const entries = raw.slice(0, count).map((item) => ({
            PropertyAddress: item?.PropertyAddress || "",
            postcodeSuburb: item?.postcodeSuburb || "",
            CurrentValue: item?.CurrentValue || "",
            CostBase: item?.CostBase || "",
            clientOwnership: isOwnershipEnabled ? item?.clientOwnership || "" : "",
            partnerOwnership: isOwnershipEnabled ? item?.partnerOwnership || "" : "",
            propertyLoanDetails: item?.propertyLoanDetails || "$0",
            propertyLoanDetailsArray: Array.isArray(item?.propertyLoanDetailsArray)
                ? item.propertyLoanDetailsArray
                : [],
            weeklyRentalIncome: item?.weeklyRentalIncome || "",
            incomeExpenses: item?.incomeExpenses || "$0",
            expensesArray: Array.isArray(item?.incomeExpensesArray)
                ? item.incomeExpensesArray
                : Array.isArray(item?.expensesArray)
                    ? item.expensesArray
                    : [],
        }));

        const propertyPortfolio = toCommaAndDollar(
            entries.reduce(
                (total, entry) => total + (parseCurrencyValue(entry.CurrentValue) || 0),
                0,
            ),
        );
        const totalDebt = toCommaAndDollar(
            entries.reduce(
                (total, entry) =>
                    total + (parseCurrencyValue(entry.propertyLoanDetails) || 0),
                0,
            ),
        );

        const payload = {
            ...sectionData,
            clientFK:
                sectionData?.clientFK ||
                discoveryData?.personalDetails?._id ||
                undefined,
            [collectionKey]: entries,
            propertyPortfolio,
            totalDebt,
        };

        try {
            setSaving(true);
            const saved = sectionData?.clientFK
                ? await patch(`/api/${modalData.key}/Update`, payload)
                : await post(`/api/${modalData.key}/Add`, payload);

            setDiscoveryData((prev) => ({
                ...(prev && typeof prev === "object" ? prev : {}),
                [modalData.key]: saved || payload,
            }));

            message.success(
                `${modalData?.title || "Investment Properties"} updated successfully`,
            );
            modalData?.closeModal?.();
        } catch (error) {
            message.error(
                error?.response?.data?.message ||
                error?.message ||
                `Failed to update ${modalData?.title || "Investment Properties"}`,
            );
        } finally {
            setSaving(false);
        }
    };

    const handleConfirmAndExit = async () => {
        // validateFields() only returns registered fields; inner modals write
        // propertyLoanDetailsArray / incomeExpensesArray via setFieldValue only.
        await form.validateFields();
        await handleFinish(form.getFieldsValue(true));
    };

    const handleCancel = () => {
        if (editing) {
            form.setFieldsValue(initialValues);
            setDetailModalOpen(false);
            setActiveRowIndex(null);
            setEditing(false);
            return;
        }
        modalData?.closeModal?.();
    };

    return (
        <div style={{ padding: "16px 4px 0px 4px" }}>
            <AppModal
                open={detailModalOpen}
                onClose={() => setDetailModalOpen(false)}
                title={detailModalData?.title}
                width={detailModalData?.width || 1100}
            >
                {renderModalContent(detailModalData)}
            </AppModal>

            <Form
                form={form}
                initialValues={initialValues}
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
                    <Col xs={24} md={6}>
                        <Form.Item
                            label={`Number of ${modalData?.title || "Investment Properties"}`}
                            name="numberOfProperties"
                            style={{ marginBottom: 0 }}
                            rules={[{ required: true, message: "Number is required" }]}
                        >
                            <Select
                                placeholder="Select"
                                disabled={!editing}
                                onChange={handleCountChange}
                                style={{ width: "100%", borderRadius: "8px" }}
                                options={Array.from({ length: pageLimit }, (_, i) => ({
                                    value: String(i + 1),
                                    label: String(i + 1),
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
                            rowPathKey="formPath"
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
                                        <Button type="primary" onClick={() => setEditing(true)}>
                                            Edit <RiEdit2Fill />
                                        </Button>
                                    </>
                                ) : (
                                    <Button type="primary" onClick={handleConfirmAndExit} loading={saving} disabled={saving}>
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

