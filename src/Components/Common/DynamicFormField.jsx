import {
  Button,
  Checkbox,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Radio,
  Select,
  Spin,
  Switch,
} from "antd";
import { ArrowUpOutlined } from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useEffect, useRef, useState } from "react";
import YesNoSwitch from "./YesNoSwitch.jsx";
import { GoArrowUpRight } from "react-icons/go";

const { TextArea, Password } = Input;
const GEONAMES_USERNAME = "usamasaeed3k";
const DATE_INPUT_FORMAT = "DD/MM/YYYY";
const DATE_PARSE_FORMATS = [
  "DD/MM/YYYY",
  "D/M/YYYY",
  "DD-MM-YYYY",
  "D-M-YYYY",
  "YYYY-MM-DD",
];

dayjs.extend(customParseFormat);

function resolveMaybeFunction(value, form) {
  return typeof value === "function" ? value(form) : value;
}

function isFunction(value) {
  return typeof value === "function";
}

function composeEventHandlers(...handlers) {
  return (...args) => {
    handlers.forEach((handler) => {
      if (typeof handler === "function") {
        handler(...args);
      }
    });
  };
}

function buildOptions(options = []) {
  return options.map((option) =>
    typeof option === "string"
      ? { label: option, value: option }
      : {
          label: option.label ?? option.value,
          value: option.value,
          disabled: option.disabled,
        },
  );
}

function normalizeDateValue(value) {
  if (!value) return null;
  if (dayjs.isDayjs(value)) return value;

  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : null;
}

function parseDateInput(value) {
  if (!value) return null;

  const normalizedValue = String(value).trim();
  if (!normalizedValue) return null;

  const parsed = dayjs(normalizedValue, DATE_PARSE_FORMATS, true);
  if (parsed.isValid()) return parsed;

  const fallback = dayjs(normalizedValue);
  return fallback.isValid() ? fallback : null;
}

function buildCommittedDate(date) {
  return date ? date.hour(12).minute(0).second(0).millisecond(0) : null;
}

function focusNextField(event) {
  const form = event?.target?.form;
  if (!form) return;

  const index = Array.prototype.indexOf.call(form, event.target);
  const next = form.elements[index + 1];
  if (next && typeof next.focus === "function") {
    next.focus();
  }
}

function EnhancedDatePicker({
  value,
  onChange,
  onBlur,
  onKeyDown,
  placeholder,
  disabled,
  ...fieldProps
}) {
  const handleDateCommit = (rawValue) => {
    if (rawValue === "") {
      onChange?.(null);
      return null;
    }

    const parsedDate = dayjs.isDayjs(rawValue)
      ? rawValue
      : parseDateInput(rawValue);
    const committedDate = buildCommittedDate(parsedDate);

    onChange?.(committedDate);
    return committedDate;
  };

  return (
    <DatePicker
      placement="bottomLeft"
      placeholder={placeholder}
      format={DATE_INPUT_FORMAT}
      allowClear
      style={{ width: "100%", height: "26px", borderRadius: "7px" }}
      value={normalizeDateValue(value)}
      disabled={disabled}
      onChange={(date) => {
        handleDateCommit(date);
      }}
      onBlur={(event) => {
        if (event?.target?.value !== undefined) {
          handleDateCommit(event.target.value);
        }
        onBlur?.(event);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          handleDateCommit(event.target.value);
          focusNextField(event);
        }

        onKeyDown?.(event);
      }}
      {...fieldProps}
    />
  );
}

function YesNoSwitchWithButton({
  value,
  onChange,
  disabled,
  action,
  ...fieldProps
}) {
  const buttonLabel = action?.name || action?.label || "Open";
  const buttonKey = action?.key || `${fieldProps.name || "yesNo"}_button`;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        maxWidth: "100px",
      }}
    >
      <YesNoSwitch
        value={value}
        onChange={onChange}
        disabled={disabled}
        {...fieldProps}
      />
      <div className="d-flex justify-content-center align-items-center ">
        {value === "Yes" ? (
          <Button
            key={buttonKey}
            type={"primary"}
            size={action?.size || "small"}
            style={{ width: "25%", padding: 0 }}
            onClick={() =>
              action?.onClick?.({
                key: buttonKey,
                name: action?.name || buttonLabel,
                value,
                fieldName: fieldProps.name,
              })
            }
            disabled={disabled || action?.disabled}
          >
            <GoArrowUpRight />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function ModalPopupButton({ action, disabled, ...fieldProps }) {
  const buttonLabel = action?.name || action?.label || "Open";
  const buttonKey = action?.key || `${fieldProps.name || "modalPopup"}_button`;

  return (
    <div className="d-flex justify-content-center align-items-center">
      <Button
        key={buttonKey}
        type={"primary"}
        size={"small"}
        style={{ width: "25px", padding: 0, ...action?.style }}
        onClick={() =>
          action?.onClick?.({
            key: buttonKey,
            name: action?.name || buttonLabel,
            fieldName: fieldProps.name,
          })
        }
        disabled={disabled || action?.disabled}
      >
        <GoArrowUpRight />
      </Button>
    </div>
  );
}

function InputActionField({
  placeholder,
  action,
  disabled,
  value,
  onChange,
  ...fieldProps
}) {
  return (
    <div className="d-flex justify-content-start w-100 align-items-center gap-2">
      <Input
        placeholder={placeholder}
        size="small"
        style={{
          height: "26px",
          borderRadius: "7px",
          maxWidth: "140px",
          minWidth: "80px",
        }}
        value={value}
        onChange={onChange}
        disabled={disabled}
        {...fieldProps}
      />
      <ModalPopupButton
        action={action}
        disabled={false}
        name={fieldProps.name}
        id={fieldProps.id}
      />
    </div>
  );
}

function SelectActionField({
  placeholder,
  action,
  disabled,
  value,
  onChange,
  options = [],
  ...fieldProps
}) {
  return (
    <div className="d-flex justify-content-start w-100 align-items-center gap-2">
      <Select
        placeholder={placeholder}
        size="small"
        style={{
          height: "26px",
          borderRadius: "7px",
          maxWidth: "180px",
          minWidth: "120px",
          width: "100%",
        }}
        value={value}
        onChange={onChange}
        disabled={disabled}
        options={buildOptions(options)}
        {...fieldProps}
      />
      {/* Modal icon should never be disabled (per request) */}
      <ModalPopupButton
        action={action}
        disabled={false}
        name={fieldProps.name}
        id={fieldProps.id}
      />
    </div>
  );
}

function PostcodeSearchSelect({
  placeholder,
  value,
  onChange,
  disabled,
  ...fieldProps
}) {
  const [optionsData, setOptionsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!value) return;
    setOptionsData((prev) =>
      prev.some((item) => item.value === value)
        ? prev
        : [{ value, label: value }, ...prev],
    );
  }, [value]);

  const handleSearch = async (query) => {
    if (!query) {
      setOptionsData(value ? [{ value, label: value }] : []);
      return;
    }

    const currentRequestId = ++requestIdRef.current;
    setLoading(true);

    try {
      const res = await axios.get(
        `https://secure.geonames.org/postalCodeSearchJSON?placename=${encodeURIComponent(
          query,
        )}&country=AU&maxRows=10&username=${GEONAMES_USERNAME}`,
      );

      if (currentRequestId !== requestIdRef.current) return;

      const mapped = (res.data.postalCodes || []).map((place) => ({
        value: `${place.placeName} (${place.postalCode})`,
        label: `${place.placeName} (${place.postalCode})`,
      }));

      setOptionsData(
        value && !mapped.some((item) => item.value === value)
          ? [{ value, label: value }, ...mapped]
          : mapped,
      );
    } catch (error) {
      if (currentRequestId !== requestIdRef.current) return;
      console.error("Error fetching postcodes:", error);
      setOptionsData(value ? [{ value, label: value }] : []);
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  };

  return (
    <Select
      showSearch
      allowClear
      value={value || undefined}
      placeholder={placeholder || "Type suburb or postcode..."}
      onSearch={handleSearch}
      onChange={onChange}
      filterOption={false}
      notFoundContent={loading ? <Spin size="small" /> : null}
      options={optionsData}
      style={{ width: "100%" }}
      disabled={disabled}
      getPopupContainer={() => document.body}
      dropdownStyle={{ minWidth: 200 }} // Increase only popup width
      {...fieldProps}
    />
  );
}

function getInputNode({
  type = "text",
  placeholder,
  options = [],
  fieldProps = {},
  action,
}) {
  const normalizedOptions = buildOptions(options);

  switch (type) {
    case "yesNoSwitch":
      return (
        <YesNoSwitch
          value={fieldProps.value}
          onChange={fieldProps.onChange}
          disabled={fieldProps.disabled}
          key={fieldProps.name}
          {...fieldProps}
        />
      );

    case "yesNoSwitchWithButton":
      return (
        <YesNoSwitchWithButton
          value={fieldProps.value}
          onChange={fieldProps.onChange}
          disabled={fieldProps.disabled}
          action={action}
          {...fieldProps}
        />
      );

    case "modalPopup":
      return (
        <ModalPopupButton
          disabled={fieldProps.disabled}
          action={action}
          {...fieldProps}
        />
      );

    case "password":
      return <Password placeholder={placeholder} {...fieldProps} />;

    case "number":
      return (
        <InputNumber
          placeholder={placeholder}
          style={{
            height: "26px",
            borderRadius: "7px",
            width: "100%",
          }}
          onKeyDown={(e) => {
            if (
              !/[0-9]/.test(e.key) &&
              ![
                "Backspace",
                "Delete",
                "ArrowLeft",
                "ArrowRight",
                "Tab",
              ].includes(e.key)
            ) {
              e.preventDefault();
            }
          }}
          {...fieldProps}
        />
      );

    case "textarea":
      return (
        <TextArea
          placeholder={placeholder}
          autoSize={{ minRows: 2 }}
          {...fieldProps}
        />
      );

    case "select":
      return (
        <Select
          placeholder={placeholder}
          options={normalizedOptions}
          style={{
            maxWidth: "140px",
            minWidth: "100px",
            height: "26px",
            borderRadius: "7px",
          }}
          allowClear
          showSearch
          optionFilterProp="label"
          {...fieldProps}
        />
      );

    case "multiselect":
      return (
        <Select
          mode="multiple"
          placeholder={placeholder}
          options={normalizedOptions}
          style={{
            maxWidth: "140px",
            minWidth: "100px",
            borderRadius: "7px",
          }}
          styles={{
            item: {
              fontSize: "12px",
            },
          }}
          allowClear
          optionFilterProp="label"
          {...fieldProps}
        />
      );

    case "postalcode-search":
      return <PostcodeSearchSelect placeholder={placeholder} {...fieldProps} />;

    case "date":
      return <EnhancedDatePicker placeholder={placeholder} {...fieldProps} />;

    case "radio":
      return <Radio.Group options={normalizedOptions} {...fieldProps} />;

    case "checkbox":
      return <Checkbox {...fieldProps}>{placeholder}</Checkbox>;

    case "switch":
      return <Switch {...fieldProps} />;

    case "input-action":
      return (
        <InputActionField
          placeholder={placeholder}
          action={action}
          disabled={fieldProps.disabled}
          value={fieldProps.value}
          onChange={fieldProps.onChange}
          {...fieldProps}
        />
      );

    case "select-action":
      return (
        <SelectActionField
          placeholder={placeholder}
          action={action}
          disabled={fieldProps.disabled}
          value={fieldProps.value}
          onChange={fieldProps.onChange}
          options={options}
          {...fieldProps}
        />
      );

     case "input-action":
      return (
        <InputActionField
          placeholder={placeholder}
          action={action}
          disabled={fieldProps.disabled}
          value={fieldProps.value}
          onChange={fieldProps.onChange}
          {...fieldProps}
        />
      );

      case "text":
    default:
      return (
        <Input
          placeholder={placeholder}
          style={{
            height: "26px",
            borderRadius: "7px",
            minWidth: "80px",
          }}
          {...fieldProps}
        />
      );
  }
}

export default function DynamicFormField({
  form,
  name,
  label,
  type = "text",
  placeholder,
  rules = [],
  options = [],
  formItemProps = {},
  fieldProps = {},
  disabled = false,
  hidden = false,
  dependencies,
  valuePropName,
  action,
  onChange,
}) {
  const finalValuePropName =
    valuePropName ||
    (type === "checkbox" ? "checked" : type === "switch" ? "checked" : "value");
  const fieldNameString = Array.isArray(name)
    ? name.join(".")
    : String(name || "");

  const renderField = (computedDisabled, computedHidden) => {
    if (computedHidden) {
      return null;
    }

    return (
      <Form.Item
        name={name}
        label={label}
        rules={rules}
        dependencies={dependencies}
        valuePropName={finalValuePropName}
        {...formItemProps}
      >
        {getInputNode({
          type,
          placeholder,
          options,
          action,
          fieldProps: {
            name: fieldNameString,
            id: fieldNameString,
            onChange: composeEventHandlers(fieldProps.onChange, onChange),
            disabled: computedDisabled,
            ...fieldProps,
          },
        })}
      </Form.Item>
    );
  };

  const hasDynamicVisibility = isFunction(hidden);
  const hasDynamicDisabled = isFunction(disabled);

  if (!hasDynamicVisibility && !hasDynamicDisabled) {
    return renderField(disabled, hidden);
  }

  return (
    <Form.Item noStyle shouldUpdate>
      {() =>
        renderField(
          resolveMaybeFunction(disabled, form),
          resolveMaybeFunction(hidden, form),
        )
      }
    </Form.Item>
  );
}

export function DynamicFormFields({ form, fields = [] }) {
  return fields.map((field) => (
    <DynamicFormField
      key={Array.isArray(field.name) ? field.name.join(".") : field.name}
      form={form}
      {...field}
    />
  ));
}
