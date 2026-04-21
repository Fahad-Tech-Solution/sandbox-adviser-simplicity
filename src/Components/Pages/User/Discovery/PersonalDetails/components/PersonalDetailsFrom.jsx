import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  EditOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { App as AntdApp, Button, Checkbox, Form, Space } from "antd";
import { useSetAtom } from "jotai";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import DynamicFormField from "../../../../../Common/DynamicFormField.jsx";
import useApi from "../../../../../../hooks/useApi";
import { discoveryDataAtom } from "../../../../../../store/authState";
import ChildrenSection from "./ChildrenSection.jsx";
import SectionTable from "./SectionTable.jsx";
import {
  buildInitialValues,
  buildViewChildrenRows,
  buildViewContactRows,
  buildViewFinancialRows,
  buildViewPersonalRows,
  childAgeFromDob,
  getPersonalDetailsFromDiscovery,
  mapSubmitValues,
} from "../utils/personalDetails.mapper.js";

/** @typedef {import("../utils/personalDetails.mapper.js").PersonalDetailsData} PersonalDetailsData */
/** @typedef {import("../utils/personalDetails.mapper.js").PersonalDetailsFormValues} PersonalDetailsFormValues */
/** @typedef {import("../utils/personalDetails.mapper.js").PersonalDetailsSubmitPayload} PersonalDetailsSubmitPayload */

const PRIMARY_GREEN = "#22c55e";
const FORM_WRAPPER_STYLE = { width: "100%" };
const TABLE_PROPS = {
  showCount: false,
  noPagination: true,
  horizontalScroll: false,
  tableStyle: { borderRadius: 12, overflow: "hidden" },
  headerFontSize: 11,
  bodyFontSize: 12,
};
const FOOTER_STYLE = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  marginTop: 28,
  paddingTop: 20,
  borderTop: "1px solid #f0f0f0",
};
const PRIMARY_ACTION_STYLE = {
  background: PRIMARY_GREEN,
  borderColor: PRIMARY_GREEN,
};
const NEXT_BUTTON_STYLE = {
  ...PRIMARY_ACTION_STYLE,
  fontWeight: 600,
};

const TITLE_OPTIONS = ["Mr.", "Mrs.", "Ms.", "Miss", "Dr.", "Prof."];
const GENDER_OPTIONS = ["Male", "Female", "Other", "Prefer not to say"];
const MARITAL_OPTIONS = [
  "Single",
  "Married",
  "De Facto",
  "Divorced",
  "Partnered",
  "Widowed",
];
const EMPLOYMENT_OPTIONS = [
  "Employed",
  "Self-employed",
  "Unemployed",
  "Retired",
  "Centrelink Retiree",
  "Student",
  "Other",
];
const YES_NO = ["Yes", "No"];
const HEALTH_OPTIONS = ["good", "average", "poor"];
const SMOKER_OPTIONS = ["Yes", "No"];
const RELATIONSHIP_OPTIONS = ["Son", "Daughter", "Step-child", "Other"];
const PARTNER_HIDDEN_MARITAL_STATUSES = new Set(["single", "widowed"]);
const AUS_PHONE_REGEX = /^(?:\+61|0)[2-478](?:[ ]?\d){8}$/;

const PERSON_ROWS = [
  { key: "client", row: "client" },
  { key: "partner", row: "partner" },
];

function shouldShowPartnerRow(maritalStatus) {
  return !PARTNER_HIDDEN_MARITAL_STATUSES.has(
    String(maritalStatus ?? "")
      .trim()
      .toLowerCase(),
  );
}

function requiredRule(message) {
  return { required: true, message };
}

function emailRule(message) {
  return { type: "email", message };
}

function phoneRule(message, { required = false } = {}) {
  return {
    validator: (_, value) => {
      const normalized = String(value ?? "").trim();

      if (!normalized) {
        return required
          ? Promise.reject(new Error(message))
          : Promise.resolve();
      }

      return AUS_PHONE_REGEX.test(normalized)
        ? Promise.resolve()
        : Promise.reject(new Error(message));
    },
  };
}

const PERSONAL_SECTION_CONFIG = [
  {
    title: "Preferred",
    viewKey: "preferred",
    clientField: "clientPreferredName",
    partnerField: "partnerPreferredName",
  },
  {
    title: "Title",
    viewKey: "title",
    clientField: "clientTitle",
    partnerField: "partnerTitle",
    type: "select",
    options: TITLE_OPTIONS,
    rules: [requiredRule("Title is Required")],
  },
  {
    title: "First Name",
    viewKey: "firstName",
    clientField: "clientGivenName",
    partnerField: "partnerGivenName",
    rules: [requiredRule("First Name is required")],
  },
  {
    title: "Middle Name",
    viewKey: "middleName",
    clientField: "clientMiddleName",
    partnerField: "partnerMiddleName",
  },
  {
    title: "Last Name",
    viewKey: "lastName",
    clientField: "clientLastName",
    partnerField: "partnerLastName",
    rules: [requiredRule("Last Name is required")],
  },
  {
    title: "Gender",
    viewKey: "gender",
    clientField: "clientGender",
    partnerField: "partnerGender",
    type: "select",
    options: GENDER_OPTIONS,
    rules: [requiredRule("Gender is required")],
  },
  {
    title: "Date of Birth",
    viewKey: "dobOnly",
    clientField: "clientDOB",
    partnerField: "partnerDOB",
    type: "date",
    onChange: (value, row, form) => {
      form.setFieldValue(
        [row, row === "client" ? "clientAge" : "partnerAge"],
        value ? Number(childAgeFromDob(value)) || undefined : undefined,
      );
    },
    rules: [requiredRule("DOB is required")],
    width: 120,
  },
  {
    title: "Age",
    viewKey: "ageOnly",
    clientField: "clientAge",
    partnerField: "partnerAge",
    type: "number",
    rules: [
      requiredRule("Age is required"),
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
    ],
    width: 72,
    disabled: true,
  },
  {
    title: "Marital Status",
    viewKey: "marital",
    clientField: "clientMaritalStatus",
    partnerField: "partnerMaritalStatus",
    type: "select",
    options: MARITAL_OPTIONS,
  },
];

const FINANCIAL_SECTION_CONFIG = [
  {
    title: "Preferred",
    viewKey: "preferred",
    width: 130,
    editMode: "preferred-readonly",
  },
  {
    title: "Work Status",
    viewKey: "workStatus",
    clientField: "clientEmploymentStatus",
    partnerField: "partnerEmploymentStatus",
    type: "select",
    options: EMPLOYMENT_OPTIONS,
  },
  {
    title: "Occupation",
    viewKey: "occupation",
    clientField: "clientOccupationID",
    partnerField: "partnerOccupationID",
  },
  {
    title: "Age to Retire",
    viewKey: "retire",
    clientField: "clientPlannedRetirementAge",
    partnerField: "partnerPlannedRetirementAge",
    type: "number",
  },
  {
    title: "Tax Resident",
    viewKey: "taxRes",
    clientField: "clientTaxResidentRadio",
    partnerField: "partnerTaxResidentRadio",
    type: "select",
    options: YES_NO,
  },
  {
    title: "Help Debt",
    viewKey: "helpDebt",
    clientField: "clientHELPSDebtRadio",
    partnerField: "partnerHELPSDebtRadio",
    type: "select",
    options: YES_NO,
  },
  {
    title: "Health",
    viewKey: "health",
    clientField: "clientHealth",
    partnerField: "partnerHealth",
    type: "select",
    options: HEALTH_OPTIONS,
  },
  {
    title: "Smoker",
    viewKey: "smoker",
    clientField: "clientSmoker",
    partnerField: "partnerSmoker",
    type: "select",
    options: SMOKER_OPTIONS,
  },
  {
    title: "Private Health Cover",
    viewKey: "phc",
    clientField: "clientPrivateHealthCoverRadio",
    partnerField: "partnerPrivateHealthCoverRadio",
    type: "select",
    options: YES_NO,
  },
];

const CONTACT_SECTION_CONFIG = [
  {
    title: "Preferred",
    viewKey: "preferred",
    width: 130,
    editMode: "preferred-readonly",
  },
  {
    title: "Home Address",
    viewKey: "home",
    clientField: "clientHomeAddress",
    partnerField: "partnerHomeAddress",
    type: "textarea",
    editMode: "address-with-sync",
    rules: [requiredRule("Home address is required")],
  },
  {
    title: "Postcode/Suburb",
    viewKey: "homePc",
    clientField: "clientPostcode",
    partnerField: "partnerPostcode",
    type: "postalcode-search",
    fieldProps: {
      allowClear: true,
    },
    placeholder: "Type suburb or postcode...",
    width: 110,
    editMode: "postcode-with-sync",
    rules: [requiredRule("Postcode is required")],
  },
  {
    title: "Postal Address",
    viewKey: "postal",
    clientField: "clientPostalAddress",
    partnerField: "partnerPostalAddress",
    type: "textarea",
    editMode: "address-with-sync",
    rules: [requiredRule("Postal address is required")],
  },
  {
    title: "Postcode/Suburb",
    viewKey: "postalPc",
    clientField: "clientPostalPostCode",
    partnerField: "partnerPostalPostCode",
    type: "postalcode-search",
    fieldProps: {
      allowClear: true,
    },
    placeholder: "Type suburb or postcode...",
    width: 110,
    editMode: "postcode-with-sync",
    rules: [requiredRule("Postal postcode is required")],
  },
  {
    title: "Mobile",
    viewKey: "mobile",
    clientField: "clientMobile",
    partnerField: "partnerMobile",
    width: 100,
    rules: [
      requiredRule("Mobile Phone is required"),
      phoneRule("Valid Australian Mobile Phone number Format: 0X XXXX XXXX"),
    ],
  },
  {
    title: "Home Phone",
    viewKey: "homePhone",
    clientField: "clientHomePhone",
    partnerField: "partnerHomePhone",
    width: 100,
    rules: [
      phoneRule("Valid Australian Home Phone number Format: 0X XXXX XXXX"),
    ],
  },
  {
    title: "Work Phone",
    viewKey: "workPhone",
    clientField: "clientWorkPhone",
    partnerField: "partnerWorkPhone",
    width: 100,
    rules: [
      phoneRule("Valid Australian Work Phone number Format: 0X XXXX XXXX"),
    ],
  },
  {
    title: "Email",
    viewKey: "email",
    clientField: "Email",
    partnerField: "partnerEmail",
    rules: [requiredRule("Email is required"), emailRule("Invalid email")],
  },
];

const CHILDREN_VIEW_COLUMNS = [
  { title: "First Name", dataIndex: "firstName", key: "firstName" },
  { title: "Last Name", dataIndex: "lastName", key: "lastName" },
  { title: "DOB", dataIndex: "dob", key: "dob" },
  { title: "Age", dataIndex: "age", key: "age" },
  { title: "Gender", dataIndex: "gender", key: "gender" },
  { title: "Relationship", dataIndex: "relationship", key: "relationship" },
  { title: "Dependent", dataIndex: "dependent", key: "dependent" },
];
const PERSONAL_VIEW_COLUMNS = buildViewColumns(PERSONAL_SECTION_CONFIG);
const FINANCIAL_VIEW_COLUMNS = buildViewColumns(FINANCIAL_SECTION_CONFIG);
const CONTACT_VIEW_COLUMNS = buildViewColumns(CONTACT_SECTION_CONFIG);
const ADDRESS_SYNC_CHECKBOX_STYLE = {
  display: "flex",
  alignItems: "center",
  gap: 0,
  justifyContent: "center",
  marginTop: 8,
  fontSize: 11,
};
const ADDRESS_SYNC_CONFIG = {
  partnerHome: {
    label: "Same as Client Address",
    sourceAddressName: ["client", "clientHomeAddress"],
    sourcePostcodeName: ["client", "clientPostcode"],
    targetAddressName: ["partner", "partnerHomeAddress"],
    targetPostcodeName: ["partner", "partnerPostcode"],
    persistedFieldName: ["partner", "partnerSameAsClient"],
  },
  clientPostal: {
    label: "Same as Home Address",
    sourceAddressName: ["client", "clientHomeAddress"],
    sourcePostcodeName: ["client", "clientPostcode"],
    targetAddressName: ["client", "clientPostalAddress"],
    targetPostcodeName: ["client", "clientPostalPostCode"],
    persistedFieldName: ["client", "clientSameAsAbove"],
  },
  partnerPostal: {
    label: "Same as Home Address",
    sourceAddressName: ["partner", "partnerHomeAddress"],
    sourcePostcodeName: ["partner", "partnerPostcode"],
    targetAddressName: ["partner", "partnerPostalAddress"],
    targetPostcodeName: ["partner", "partnerPostalPostCode"],
  },
};

/**
 * @typedef {Object} SectionColumnConfig
 * @property {string} title
 * @property {string} viewKey
 * @property {string} [clientField]
 * @property {string} [partnerField]
 * @property {string} [type]
 * @property {string[]} [options]
 * @property {boolean} [disabled]
 * @property {"preferred-readonly"|"address-with-sync"|"postcode-with-sync"} [editMode]
 * @property {number} [width]
 * @property {string} [placeholder]
 * @property {Array<Record<string, any>>} [rules]
 * @property {Record<string, any>} [fieldProps]
 * @property {(value: unknown, row: "client" | "partner", form: import("antd").FormInstance<PersonalDetailsFormValues>) => void} [onChange]
 */

/**
 * Resolve a field path for the client or partner row.
 *
 * @param {"client"|"partner"} row
 * @param {SectionColumnConfig} config
 * @returns {string[]}
 */
function resolveFieldName(row, config) {
  return row === "client"
    ? ["client", config.clientField]
    : ["partner", config.partnerField];
}

/**
 * Read a nested value from a plain object using a form-style path.
 *
 * @param {Record<string, any> | undefined} values
 * @param {string[]} path
 * @returns {unknown}
 */
function getValueAtPath(values, path) {
  return path.reduce((current, key) => current?.[key], values);
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function hasAddressValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

/**
 * Resolve which sync rule applies to a contact table cell.
 *
 * @param {"client"|"partner"} row
 * @param {string} viewKey
 * @returns {"partnerHome"|"clientPostal"|"partnerPostal"|null}
 */
function getAddressSyncKey(row, viewKey) {
  if (row === "partner" && (viewKey === "home" || viewKey === "homePc")) {
    return "partnerHome";
  }
  if (row === "client" && (viewKey === "postal" || viewKey === "postalPc")) {
    return "clientPostal";
  }
  if (row === "partner" && (viewKey === "postal" || viewKey === "postalPc")) {
    return "partnerPostal";
  }
  return null;
}

/**
 * Determine whether a target address pair currently matches its source pair.
 *
 * @param {PersonalDetailsFormValues} values
 * @param {keyof typeof ADDRESS_SYNC_CONFIG} syncKey
 * @returns {boolean}
 */
function areAddressFieldsSynced(values, syncKey) {
  const config = ADDRESS_SYNC_CONFIG[syncKey];
  const sourceAddress = getValueAtPath(values, config.sourceAddressName);
  const sourcePostcode = getValueAtPath(values, config.sourcePostcodeName);
  const targetAddress = getValueAtPath(values, config.targetAddressName);
  const targetPostcode = getValueAtPath(values, config.targetPostcodeName);
  const hasAnyValue =
    hasAddressValue(sourceAddress) ||
    hasAddressValue(sourcePostcode) ||
    hasAddressValue(targetAddress) ||
    hasAddressValue(targetPostcode);

  return (
    hasAnyValue &&
    String(sourceAddress ?? "") === String(targetAddress ?? "") &&
    String(sourcePostcode ?? "") === String(targetPostcode ?? "")
  );
}

/**
 * Build the local checkbox state for address-copy helpers.
 *
 * @param {PersonalDetailsFormValues} values
 * @returns {{ partnerHome: boolean, clientPostal: boolean, partnerPostal: boolean }}
 */
function buildAddressSyncState(values) {
  return {
    partnerHome:
      Boolean(values?.partner?.partnerSameAsClient) ||
      areAddressFieldsSynced(values, "partnerHome"),
    clientPostal:
      Boolean(values?.client?.clientSameAsAbove) ||
      areAddressFieldsSynced(values, "clientPostal"),
    partnerPostal: areAddressFieldsSynced(values, "partnerPostal"),
  };
}

/**
 * Copy the source address pair into its target fields.
 *
 * @param {import("antd").FormInstance<PersonalDetailsFormValues>} form
 * @param {keyof typeof ADDRESS_SYNC_CONFIG} syncKey
 * @returns {void}
 */
function syncAddressFields(form, syncKey) {
  const config = ADDRESS_SYNC_CONFIG[syncKey];
  form.setFieldValue(
    config.targetAddressName,
    form.getFieldValue(config.sourceAddressName) ?? "",
  );
  form.setFieldValue(
    config.targetPostcodeName,
    form.getFieldValue(config.sourcePostcodeName) ?? "",
  );
}

/**
 * Render a form field cell for either the client or partner row.
 *
 * @param {Object} props
 * @param {import("antd").FormInstance<PersonalDetailsFormValues>} props.form
 * @param {"client"|"partner"} props.row
 * @param {SectionColumnConfig} props.config
 * @returns {JSX.Element}
 */
function FormFieldCell({ form, row, config }) {
  const name = resolveFieldName(row, config);

  return (
    <DynamicFormField
      form={form}
      name={name}
      type={config.type || "text"}
      options={config.options}
      placeholder={config.placeholder}
      rules={config.rules}
      disabled={config.disabled}
      formItemProps={{
        style: { marginBottom: 0 },
        label: null,
      }}
      fieldProps={config.fieldProps}
      onChange={(value) => config.onChange?.(value, row, form)}
    />
  );
}

/**
 * Render a contact address cell with an optional copy-address checkbox.
 *
 * @param {Object} props
 * @param {import("antd").FormInstance<PersonalDetailsFormValues>} props.form
 * @param {"client"|"partner"} props.row
 * @param {SectionColumnConfig} props.config
 * @param {{ partnerHome: boolean, clientPostal: boolean, partnerPostal: boolean }} props.addressSync
 * @param {(syncKey: "partnerHome"|"clientPostal"|"partnerPostal", checked: boolean) => void} props.onAddressSyncToggle
 * @returns {JSX.Element}
 */
function AddressFieldCell({
  form,
  row,
  config,
  addressSync,
  onAddressSyncToggle,
}) {
  const name = resolveFieldName(row, config);
  const syncKey = getAddressSyncKey(row, config.viewKey);
  const syncEnabled = syncKey ? addressSync[syncKey] : false;

  return (
    <div>
      <DynamicFormField
        form={form}
        name={name}
        type={config.type || "text"}
        options={config.options}
        placeholder={config.placeholder}
        rules={config.rules}
        disabled={Boolean(config.disabled) || syncEnabled}
        formItemProps={{ style: { marginBottom: 0 }, label: null }}
        fieldProps={config.fieldProps}
        onChange={(value) => config.onChange?.(value, row, form)}
      />
      {syncKey ? (
        <Checkbox
          checked={syncEnabled}
          onChange={(event) =>
            onAddressSyncToggle(syncKey, event.target.checked)
          }
          style={ADDRESS_SYNC_CHECKBOX_STYLE}
        >
          {ADDRESS_SYNC_CONFIG[syncKey].label}
        </Checkbox>
      ) : null}
    </div>
  );
}

/**
 * Render a postcode cell that becomes read-only while its paired address sync is enabled.
 *
 * @param {Object} props
 * @param {import("antd").FormInstance<PersonalDetailsFormValues>} props.form
 * @param {"client"|"partner"} props.row
 * @param {SectionColumnConfig} props.config
 * @param {{ partnerHome: boolean, clientPostal: boolean, partnerPostal: boolean }} props.addressSync
 * @returns {JSX.Element}
 */
function PostcodeFieldCell({ form, row, config, addressSync }) {
  const name = resolveFieldName(row, config);
  const syncKey = getAddressSyncKey(row, config.viewKey);

  return (
    <DynamicFormField
      form={form}
      name={name}
      type={config.type || "text"}
      options={config.options}
      placeholder={config.placeholder}
      rules={config.rules}
      disabled={
        Boolean(config.disabled) || Boolean(syncKey && addressSync[syncKey])
      }
      formItemProps={{ style: { marginBottom: 0 }, label: null }}
      fieldProps={config.fieldProps}
      onChange={(value) => config.onChange?.(value, row, form)}
    />
  );
}

/**
 * Render the preferred name as read-only text inside edit-mode tables.
 *
 * @param {Object} props
 * @param {import("antd").FormInstance<PersonalDetailsFormValues>} props.form
 * @param {"client"|"partner"} props.row
 * @returns {JSX.Element}
 */
function PreferredReadonlyCell({ form, row }) {
  return (
    <Form.Item noStyle shouldUpdate>
      {() => (
        <span style={{ fontSize: 12, color: "rgba(0,0,0,0.45)" }}>
          {row === "client"
            ? form.getFieldValue(["client", "clientPreferredName"]) || "—"
            : form.getFieldValue(["partner", "partnerPreferredName"]) || "—"}
        </span>
      )}
    </Form.Item>
  );
}

/**
 * Convert section config into read-only table columns.
 *
 * @param {SectionColumnConfig[]} config
 * @returns {Array<Record<string, any>>}
 */
function buildViewColumns(config) {
  return config.map((item) => ({
    title: item.title,
    dataIndex: item.viewKey,
    key: item.viewKey,
    width: item.width,
  }));
}

/**
 * Convert section config into editable table columns.
 *
 * @param {SectionColumnConfig[]} config
 * @param {import("antd").FormInstance<PersonalDetailsFormValues>} form
 * @param {Object} [options]
 * @param {{ partnerHome: boolean, clientPostal: boolean, partnerPostal: boolean }} [options.addressSync]
 * @param {(syncKey: "partnerHome"|"clientPostal"|"partnerPostal", checked: boolean) => void} [options.onAddressSyncToggle]
 * @returns {Array<Record<string, any>>}
 */
function buildEditColumns(config, form, options = {}) {
  const { addressSync, onAddressSyncToggle } = options;

  return config.map((item) => {
    const base = {
      title: item.title,
      key: item.viewKey,
      width: item.width,
    };

    if (item.editMode === "preferred-readonly") {
      return {
        ...base,
        render: (_, record) => (
          <PreferredReadonlyCell form={form} row={record.row} />
        ),
      };
    }

    if (
      item.editMode === "address-with-sync" &&
      addressSync &&
      onAddressSyncToggle
    ) {
      return {
        ...base,
        render: (_, record) => (
          <AddressFieldCell
            form={form}
            row={record.row}
            config={item}
            addressSync={addressSync}
            onAddressSyncToggle={onAddressSyncToggle}
          />
        ),
      };
    }

    if (item.editMode === "postcode-with-sync" && addressSync) {
      return {
        ...base,
        render: (_, record) => (
          <PostcodeFieldCell
            form={form}
            row={record.row}
            config={item}
            addressSync={addressSync}
          />
        ),
      };
    }

    return {
      ...base,
      render: (_, record) => (
        <FormFieldCell form={form} row={record.row} config={item} />
      ),
    };
  });
}

/**
 * Personal details table/form container.
 *
 * Keeps the existing API contract and payload mapping unchanged while
 * coordinating read-only and edit-mode table sections.
 *
 * @param {Object} props
 * @param {Record<string, any>} props.discoveryData
 * @param {() => void} [props.onBack]
 * @param {() => void} [props.onNext]
 * @param {(payload: PersonalDetailsSubmitPayload) => Promise<void> | void} [props.onSave]
 * @returns {JSX.Element}
 */
export default function PersonalDetailsFrom({
  discoveryData,
  onBack,
  onNext,
  onSave,
}) {
  const api = useApi();
  const { message } = AntdApp.useApp();
  const setDiscoveryData = useSetAtom(discoveryDataAtom);
  const [form] = Form.useForm();
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  /** @type {PersonalDetailsData | null} */
  const resolvedPd = useMemo(
    () => getPersonalDetailsFromDiscovery(discoveryData),
    [discoveryData],
  );
  const [pd, setPd] = useState(resolvedPd);

  useEffect(() => {
    setPd(resolvedPd);
  }, [resolvedPd]);

  /** @type {PersonalDetailsFormValues} */
  const initialValues = useMemo(() => buildInitialValues(pd), [pd]);
  const [addressSync, setAddressSync] = useState(() =>
    buildAddressSyncState(initialValues),
  );
  const clientHomeAddress = Form.useWatch(
    ["client", "clientHomeAddress"],
    form,
  );
  const clientMaritalStatus = Form.useWatch(
    ["client", "clientMaritalStatus"],
    form,
  );
  const clientPostcode = Form.useWatch(["client", "clientPostcode"], form);
  const partnerHomeAddress = Form.useWatch(
    ["partner", "partnerHomeAddress"],
    form,
  );
  const partnerPostcode = Form.useWatch(["partner", "partnerPostcode"], form);
  const viewPersonalRows = useMemo(() => buildViewPersonalRows(pd), [pd]);
  const viewFinancialRows = useMemo(() => buildViewFinancialRows(pd), [pd]);
  const viewContactRows = useMemo(() => buildViewContactRows(pd), [pd]);
  const viewChildrenRows = useMemo(() => buildViewChildrenRows(pd), [pd]);
  const showPartnerRow = useMemo(
    () =>
      shouldShowPartnerRow(
        editing ? clientMaritalStatus : pd?.client?.clientMaritalStatus,
      ),
    [clientMaritalStatus, editing, pd?.client?.clientMaritalStatus],
  );
  const visiblePersonRows = useMemo(
    () =>
      showPartnerRow
        ? PERSON_ROWS
        : PERSON_ROWS.filter((row) => row.row === "client"),
    [showPartnerRow],
  );
  const visibleViewPersonalRows = useMemo(
    () =>
      showPartnerRow
        ? viewPersonalRows
        : viewPersonalRows.filter((row) => row.key === "client"),
    [showPartnerRow, viewPersonalRows],
  );
  const visibleViewFinancialRows = useMemo(
    () =>
      showPartnerRow
        ? viewFinancialRows
        : viewFinancialRows.filter((row) => row.key === "client"),
    [showPartnerRow, viewFinancialRows],
  );
  const visibleViewContactRows = useMemo(
    () =>
      showPartnerRow
        ? viewContactRows
        : viewContactRows.filter((row) => row.key === "client"),
    [showPartnerRow, viewContactRows],
  );

  const personalEditColumns = useMemo(
    () => buildEditColumns(PERSONAL_SECTION_CONFIG, form),
    [form],
  );
  const financialEditColumns = useMemo(
    () => buildEditColumns(FINANCIAL_SECTION_CONFIG, form),
    [form],
  );
  const handleAddressSyncToggle = useCallback(
    (syncKey, checked) => {
      setAddressSync((prev) => ({ ...prev, [syncKey]: checked }));

      const persistedFieldName =
        ADDRESS_SYNC_CONFIG[syncKey].persistedFieldName;
      if (persistedFieldName) {
        form.setFieldValue(persistedFieldName, checked);
      }

      if (checked) {
        syncAddressFields(form, syncKey);
      }
    },
    [form],
  );
  const contactEditColumns = useMemo(
    () =>
      buildEditColumns(CONTACT_SECTION_CONFIG, form, {
        addressSync,
        onAddressSyncToggle: handleAddressSyncToggle,
      }),
    [addressSync, form, handleAddressSyncToggle],
  );

  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [form, initialValues]);

  useEffect(() => {
    setAddressSync(buildAddressSyncState(initialValues));
  }, [initialValues]);

  useEffect(() => {
    if (addressSync.partnerHome) {
      syncAddressFields(form, "partnerHome");
    }
  }, [addressSync.partnerHome, clientHomeAddress, clientPostcode, form]);

  useEffect(() => {
    if (addressSync.clientPostal) {
      syncAddressFields(form, "clientPostal");
    }
  }, [addressSync.clientPostal, clientHomeAddress, clientPostcode, form]);

  useEffect(() => {
    if (addressSync.partnerPostal) {
      syncAddressFields(form, "partnerPostal");
    }
  }, [addressSync.partnerPostal, partnerHomeAddress, partnerPostcode, form]);

  const finish = useCallback(
    async (values) => {
      const payload = {
        ...mapSubmitValues(values),

        _id: pd?._id,
      };

      if (!payload._id) {
        message.error("Personal details ID is missing.");
        return;
      }

      setSubmitting(true);

      try {
        const saved = await api.patch("/api/personalDetails/Update", payload);

        const nextPd =
          saved && typeof saved === "object"
            ? {
                ...pd,
                ...saved,
                _id: saved._id ?? payload._id,
                client: saved.client ?? payload.client,
                partner: saved.partner ?? payload.partner,
                children: saved.children ?? payload.children,
                haveAnyChildren:
                  saved.haveAnyChildren ?? payload.haveAnyChildren,
              }
            : {
                ...pd,
                ...payload,
              };

        setPd(nextPd);
        setDiscoveryData((prev) => {
          if (
            prev?.personaldetails &&
            typeof prev.personaldetails === "object"
          ) {
            return { ...prev, personaldetails: nextPd };
          }
          if (
            prev?.personalDetails &&
            typeof prev.personalDetails === "object"
          ) {
            return { ...prev, personalDetails: nextPd };
          }
          if (prev && typeof prev === "object") {
            return { ...prev, ...nextPd };
          }
          return nextPd;
        });

        await onSave?.(saved ?? payload);
        message.success("Personal details updated.");
        setEditing(false);
      } catch (error) {
        message.error(
          error?.response?.data?.error ||
            error?.response?.data?.message ||
            error?.message ||
            "Save failed.",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [api, message, onSave, pd, setDiscoveryData],
  );

  const handleEditBack = useCallback(() => {
    form.setFieldsValue(initialValues);
    setEditing(false);
  }, [form, initialValues]);
  const handleStartEditing = useCallback(() => setEditing(true), []);

  return (
    <div style={FORM_WRAPPER_STYLE}>
      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onFinish={finish}
        key={pd?._id || "pd"}
      >
        <SectionTable
          title="PERSONAL DETAILS"
          editing={editing}
          viewColumns={PERSONAL_VIEW_COLUMNS}
          editColumns={personalEditColumns}
          viewData={visibleViewPersonalRows}
          editData={visiblePersonRows}
          tableProps={TABLE_PROPS}
        />

        <SectionTable
          title="FINANCIAL AND HEALTH"
          editing={editing}
          viewColumns={FINANCIAL_VIEW_COLUMNS}
          editColumns={financialEditColumns}
          viewData={visibleViewFinancialRows}
          editData={visiblePersonRows}
          tableProps={TABLE_PROPS}
        />

        <SectionTable
          title="CONTACT DETAILS"
          editing={editing}
          viewColumns={CONTACT_VIEW_COLUMNS}
          editColumns={contactEditColumns}
          viewData={visibleViewContactRows}
          editData={visiblePersonRows}
          tableProps={TABLE_PROPS}
        />

        <ChildrenSection
          form={form}
          editing={editing}
          viewColumns={CHILDREN_VIEW_COLUMNS}
          viewData={viewChildrenRows}
          tableProps={TABLE_PROPS}
          genderOptions={GENDER_OPTIONS}
          relationshipOptions={RELATIONSHIP_OPTIONS}
          yesNoOptions={YES_NO}
        />

        <div style={FOOTER_STYLE}>
          <Space wrap>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={editing ? handleEditBack : onBack}
            >
              Back
            </Button>
            {!editing && (
              <Button
                key="edit"
                icon={<EditOutlined />}
                onClick={handleStartEditing}
              >
                Edit
              </Button>
            )}
          </Space>
          {!editing ? (
            <Button
              type="primary"
              icon={<ArrowRightOutlined />}
              onClick={onNext}
              style={NEXT_BUTTON_STYLE}
            >
              Next
            </Button>
          ) : (
            <Button
              key="save"
              type="primary"
              icon={<SaveOutlined />}
              htmlType="submit"
              loading={submitting}
              style={PRIMARY_ACTION_STYLE}
            >
              Save
            </Button>
          )}
        </div>
      </Form>
    </div>
  );
}
