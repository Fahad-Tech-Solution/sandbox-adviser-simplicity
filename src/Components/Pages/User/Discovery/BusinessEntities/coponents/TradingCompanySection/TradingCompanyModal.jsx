import { Button, Col, Form, message, Row, Select, Space } from "antd";
import { useAtomValue, useSetAtom } from "jotai";
import React, { useEffect, useMemo, useState } from "react";
import { RiEdit2Fill } from "react-icons/ri";
import EditableDynamicTable from "../../../../../../Common/EditableDynamicTable.jsx";
import { formatNumber, toCommaAndDollar } from "../../../../../../../hooks/helpers.js";
import { discoveryDataAtom } from "../../../../../../../store/authState.js";
import useApi from "../../../../../../../hooks/useApi.js";

const TABLE_PROPS = {
    showCount: false,
    noPagination: true,
    horizontalScroll: true,
    tableStyle: { borderRadius: 12, overflow: "hidden" },
    headerFontSize: 11,
    bodyFontSize: 12,
};

const YES_NO_OPTIONS = [
    { value: "Yes", label: "Yes" },
    { value: "No", label: "No" },
];

function parseCurrencyValue(value) {
    if (value === null || value === undefined || value === "") return 0;
    const numeric = Number(String(value).replace(/[^0-9.-]/g, ""));
    return Number.isFinite(numeric) ? numeric : 0;
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
    const numeric = parsePercentValue(getChangedValue(value));
    if (numeric === undefined) return "";
    const bounded = Math.min(Math.max(numeric, 0), 100);
    return `${bounded.toFixed(2)}%`;
}

function buildEmptyCompany() {
    return {
        businessName: "",
        aBNACN: "",
        businessAddress: "",
        postcodeSuburb: "",
        numberOfDirectors: "",
        directorship: "",
        shareholding: "",
        dividendReceived: "",
        equityPosition: "",
        equityPositionArray: [],
    };
}

function normalizeCompany(entry = {}) {
    // console.log("entry", entry);
    return {
        businessName: entry?.businessName || "",
        aBNACN: entry?.aBNACN || "",
        businessAddress: entry?.businessAddress || "",
        postcodeSuburb: entry?.postcodeSuburb || "",
        numberOfDirectors: entry?.numberOfDirectors || "",
        directorship: entry?.directorship || "",
        shareholding: entry?.shareholding || "",
        dividendReceived: formatCurrencyValue(entry?.dividendReceived),
        equityPosition: formatCurrencyValue(entry?.equityPosition),
        equityPositionArray: Array.isArray(entry?.equityPositionArray)
            ? entry.equityPositionArray
            : [],
    };
}

function hasMeaningfulValues(initialValues = {}) {
    const rows = initialValues?.tradingCompanies || [];
    if ((Number(initialValues?.NumberOfMap) || 0) > 0) return true;

    return rows.some((row) =>
        [
            row?.businessName,
            row?.aBNACN,
            row?.businessAddress,
            row?.postcodeSuburb,
            row?.numberOfDirectors,
            row?.directorship,
            row?.shareholding,
            row?.dividendReceived,
            row?.equityPosition,
        ].some((value) => String(value ?? "").trim() !== ""),
    );
}

function buildEntries(count, entries = []) {
    return Array.from({ length: count }, (_, index) =>
        entries?.[index] ? entries[index] : buildEmptyCompany(),
    );
}

function buildInitialValues(sectionData = {},) {


    const companies = Array.isArray(sectionData?.currentBalanceArray)
        ? sectionData?.currentBalanceArray?.map(normalizeCompany)
        : [];

    console.log("sectionData", sectionData);

    return {
        NumberOfMap: companies.length || undefined,
        tradingCompanies: companies,
    };
}

export default function TradingCompanyModal({ modalData }) {
    const [form] = Form.useForm();
    const discoveryData = useAtomValue(discoveryDataAtom);
    const setDiscoveryData = useSetAtom(discoveryDataAtom);
    const { post, patch } = useApi();

    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    const sectionData = modalData.parentForm.getFieldValue(modalData?.ownerKey) || {};
    console.log("sectionData", sectionData);
    // console.log("key",);
    const initialValues = useMemo(
        () => buildInitialValues(sectionData, modalData?.ownerKey),
        [sectionData?.clientFK, sectionData?.client],
    );

    const count = Form.useWatch("NumberOfMap", form);
    const tradingCompanies =
        Form.useWatch("tradingCompanies", form) || initialValues.tradingCompanies;

    useEffect(() => {
        // Only seed when the backing section data changes; avoid clobbering user edits.
        const currentCount = form.getFieldValue("NumberOfMap");
        const currentRows = form.getFieldValue("tradingCompanies");
        const hasUserInput =
            currentCount !== undefined ||
            (Array.isArray(currentRows) && currentRows.length > 0);

        if (!hasUserInput) {
            form.setFieldsValue(initialValues);
            setEditing(!hasMeaningfulValues(initialValues));
        }
    }, [form, initialValues]);

    const detailRows = useMemo(
        () =>
            buildEntries(Number(count) || 0, tradingCompanies).map((item, index) => ({
                key: `trading-company-${index}`,
                formPath: ["tradingCompanies", index],
                rowNumber: index + 1,
                ...item,
            })),
        [count, tradingCompanies],
    );

    const handleCountChange = (nextValue) => {
        const nextCount = Number(nextValue) || 0;
        const current = form.getFieldValue("tradingCompanies") || [];
        form.setFieldValue("NumberOfMap", nextValue);
        form.setFieldValue("tradingCompanies", buildEntries(nextCount, current));
    };

    const handleRemoveRow = (rowIndex) => {
        const currentEntries = form.getFieldValue("tradingCompanies") || [];
        const nextEntries = currentEntries.filter((_, index) => index !== rowIndex);
        const nextCount = nextEntries.length;

        form.setFieldValue("tradingCompanies", nextEntries);
        form.setFieldValue("NumberOfMap", nextCount || undefined);
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
            title: "Business Name",
            dataIndex: "businessName",
            key: "businessName",
            field: "businessName",
            type: "textarea",
            placeholder: "Business Name",
        },
        {
            title: "ABN/ACN",
            dataIndex: "aBNACN",
            key: "aBNACN",
            field: "aBNACN",
            type: "text",
            placeholder: "ABN/ACN",
            onChange: (value, record, column, currentForm) => {
                currentForm.setFieldValue(
                    [...record.formPath, column.field],
                    String(getChangedValue(value) ?? "").replace(/[^0-9]/g, ""),
                );
            },
        },
        {
            title: "Business Address",
            dataIndex: "businessAddress",
            key: "businessAddress",
            field: "businessAddress",
            type: "textarea",
            placeholder: "Business Address",
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
            title: "Number of Directors",
            dataIndex: "numberOfDirectors",
            key: "numberOfDirectors",
            field: "numberOfDirectors",
            type: "text",
            placeholder: "Number of Directors",
            onChange: (value, record, column, currentForm) => {
                currentForm.setFieldValue(
                    [...record.formPath, column.field],
                    String(getChangedValue(value) ?? "").replace(/[^0-9]/g, ""),
                );
            },
        },
        {
            title: "Directorship",
            dataIndex: "directorship",
            key: "directorship",
            field: "directorship",
            type: "yesNoSwitch",
            // defaultValue: "No",
            
        },
        {
            title: "Shareholding",
            dataIndex: "shareholding",
            key: "shareholding",
            field: "shareholding",
            type: "text",
            placeholder: "Shareholding",
            onChange: (value, record, column, currentForm) => {
                currentForm.setFieldValue(
                    [...record.formPath, column.field],
                    formatPercentValue(value),
                );
            },
        },
        {
            title: "Dividend Received",
            dataIndex: "dividendReceived",
            key: "dividendReceived",
            field: "dividendReceived",
            type: "text",
            placeholder: "Dividend Received",
            onChange: (value, record, column, currentForm) => {
                currentForm.setFieldValue(
                    [...record.formPath, column.field],
                    formatNumericInput(value, { currency: true }),
                );
            },
        },
        {
            title: "Equity Position",
            dataIndex: "equityPosition",
            key: "equityPosition",
            field: "equityPosition",
            type: "text",
            placeholder: "Equity Position",
            onChange: (value, record, column, currentForm) => {
                currentForm.setFieldValue(
                    [...record.formPath, column.field],
                    formatNumericInput(value, { currency: true }),
                );
            },
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
                    aria-label={`Remove row ${record?.rowNumber}`}
                    onClick={() => handleRemoveRow((record?.rowNumber || 1) - 1)}
                >
                    🗑️
                </Button>
            ),
        },
    ];

    const syncParentValues = (nextEntries) => {
        const totalBalance = nextEntries.reduce(
            (total, item) => total + parseCurrencyValue(item?.equityPosition),
            0,
        );

        modalData?.parentForm?.setFieldValue?.(
            [modalData?.ownerKey, "currentBalanceArray"],
            nextEntries,
        );
        modalData?.parentForm?.setFieldValue?.(
            [modalData?.ownerKey, "currentBalance"],
            totalBalance ? toCommaAndDollar(totalBalance) : "",
        );

    };


    // const handleConfirmAndExit = async () => {
    //     const values = await form.validateFields();
    //     const countValue = Number(values?.NumberOfMap) || 0;
    //     console.log("values", values);
    //     // return;
    //     const savedEntries = buildEntries(countValue, values?.tradingCompanies || []);

    //     console.log("savedEntries", savedEntries);
    //     syncParentValues(savedEntries);


    //     return;

    //     setEditing(false);
    //     modalData?.closeModal?.();
    //   };


    const handleConfirmAndExit = async () => {
        const values = await form.validateFields();
        const countValue = Number(values?.NumberOfMap) || 0;

        const savedEntries = buildEntries(
            countValue,
            values?.tradingCompanies || []
        );

        // ✅ ONLY update parent object
        syncParentValues(savedEntries);

        setEditing(false);
        modalData?.closeModal?.();
    };

    return (
        <div style={{ padding: "16px 4px" }}>
            <Form
                form={form}
                initialValues={initialValues}
                requiredMark={false}
                styles={{
                    label: {
                        fontWeight: "600",
                        fontSize: "13px",
                        fontFamily: "Arial, serif",
                    },
                }}
                colon={false}
            >
                <Row gutter={[16, 16]}>
                    <Col xs={24} md={6}>
                        <Form.Item
                            label="Number of Companies :"
                            name="NumberOfMap"
                            style={{ marginBottom: 0 }}

                        >
                            <Select
                                placeholder="Select"
                                onChange={handleCountChange}
                                disabled={!editing}
                                style={{ width: "100%", borderRadius: "8px" }}
                                options={Array.from(
                                    { length: modalData?.tableRows || 3 },
                                    (_, index) => ({ value: index + 1, label: index + 1 }),
                                )}
                            />
                        </Form.Item>
                    </Col>

                    <Col xs={24}>
                        <EditableDynamicTable
                            form={form}
                            editing={editing}
                            columns={columns}
                            data={detailRows}
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
                                        <Button onClick={() => modalData?.closeModal?.()}>Cancel</Button>
                                        <Button type="primary" onClick={() => setEditing(true)}>
                                            Edit <RiEdit2Fill />
                                        </Button>
                                    </>
                                ) : (
                                    <Button type="primary" onClick={handleConfirmAndExit} loading={saving}>
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

