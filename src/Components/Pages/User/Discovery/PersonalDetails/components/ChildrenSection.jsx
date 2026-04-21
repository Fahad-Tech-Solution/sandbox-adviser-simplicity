import { Form, Select, Space, Typography } from "antd";
import React, { memo, useCallback, useEffect, useMemo } from "react";
import DynamicDataTable from "../../../../../Common/DynamicDataTable.jsx";
import DynamicFormField from "../../../../../Common/DynamicFormField.jsx";
import { childAgeFromDob } from "../utils/personalDetails.mapper.js";

const { Title, Text } = Typography;
const SECTION_TITLE_STYLE = {
  marginBottom: 12,
  marginTop: 8,
  fontSize: 13,
  letterSpacing: 0.5,
  fontWeight: 700,
  color: "#111",
};

const CHILD_COUNT_OPTIONS = [0, 1, 2, 3, 4, 5].map((value) => ({
  label: String(value),
  value,
}));

function requiredRule(message) {
  return { required: true, message };
}

const CHILDREN_EDIT_CONFIG = [
  {
    title: "First Name",
    key: "firstName",
    field: "firstName",
    type: "text",
    rules: [requiredRule("Child First Name required")],
  },
  {
    title: "Last Name",
    key: "lastName",
    field: "lastName",
    type: "text",
    rules: [requiredRule("Child Last Name required")],
  },
  {
    title: "DOB",
    key: "dob",
    field: "dob",
    type: "date",
    rules: [requiredRule("Child DOB required")],
    onChange: (value, record, form) => {
      console.log(
        childAgeFromDob(value),
        "children.arrayOfChildren." + record.key + ".age",
        form.getFieldsValue(),
      );

      form.setFieldValue(
        ["children", "arrayOfChildren", record.name, "age"],
        childAgeFromDob(value),
      );
    },
  },
  { title: "Age", key: "age", kind: "age", disabled: true },
  {
    title: "Gender",
    key: "gender",
    field: "gender",
    type: "select",
    optionsKey: "genderOptions",
    rules: [requiredRule("Gender required")],
  },
  {
    title: "Relationship",
    key: "relationship",
    field: "relationship",
    type: "select",
    optionsKey: "relationshipOptions",
    rules: [requiredRule("Relationship required")],
  },
  {
    title: "Dependent",
    key: "depenantChild",
    field: "depenantChild",
    type: "select",
    optionsKey: "yesNoOptions",
    rules: [requiredRule("Dependent required")],
  },
];

/**
 * @typedef {Object} ChildColumnConfig
 * @property {string} title
 * @property {string} key
 * @property {string} [field]
 * @property {string} [type]
 * @property {"age"} [kind]
 * @property {"genderOptions"|"relationshipOptions"|"yesNoOptions"} [optionsKey]
 * @property {number} [width]
 * @property {string[]} [options]
 * @property {Array<Record<string, any>>} [rules]
 */

/**
 * Render a DynamicFormField inside a child table cell.
 *
 * @param {Object} props
 * @param {import("antd").FormInstance} props.form
 * @param {{ name: number }} props.record
 * @param {ChildColumnConfig} props.config
 * @returns {JSX.Element}
 */

const ChildFieldCell = memo(function ChildFieldCell({ form, record, config }) {
  return (
    <DynamicFormField
      form={form}
      name={[record.name, config.field]}
      type={config.type}
      options={config.options}
      rules={config.rules}
      formItemProps={{
        style: { marginBottom: 0 },
        label: null,
      }}
      placeholder={config.placeholder || config.title || "0."}
      disabled={config.disabled}
      onChange={(value) => config.onChange?.(value, record, form)}
    />
  );
});

const ChildAgeFieldCell = memo(function ChildAgeFieldCell({ form, record }) {
  return (
    <DynamicFormField
      form={form}
      name={[record.name, "age"]}
      type="text"
      disabled
      formItemProps={{
        style: { marginBottom: 0 },
        label: null,
      }}
      placeholder="Age"
    />
  );
});

/**
 * Build editable child columns for the DynamicDataTable.
 *
 * @param {Object} params
 * @param {import("antd").FormInstance} params.form
 * @param {{ genderOptions: string[], relationshipOptions: string[], yesNoOptions: string[] }} params.optionsMap
 * @returns {Array<Record<string, any>>}
 */

function buildEditColumns({ form, optionsMap }) {
  return CHILDREN_EDIT_CONFIG.map((item) => {
    const base = {
      title: item.title,
      key: item.key,
      width: item.width,
    };

    if (item.kind === "age") {
      return {
        ...base,
        render: (_, record) => <ChildAgeFieldCell form={form} record={record} />,
      };
    }

    return {
      ...base,
      render: (_, record) => (
        <ChildFieldCell
          form={form}
          record={record}
          config={{
            ...item,
            options: item.optionsKey ? optionsMap[item.optionsKey] : undefined,
          }}
        />
      ),
    };
  });
}

/**
 * Editable table body used by Ant Design Form.List for children.
 *
 * @param {Object} props
 * @param {import("antd").FormInstance} props.form
 * @param {Array<{ key: React.Key, name: number }>} props.fields
 * @param {(defaultValue?: any, insertIndex?: number) => void} props.add
 * @param {(index: number) => void} props.remove
 * @param {Record<string, any>} props.tableProps
 * @param {string[]} props.genderOptions
 * @param {string[]} props.relationshipOptions
 * @param {string[]} props.yesNoOptions
 * @returns {JSX.Element}
 */
const ChildrenEditTable = memo(function ChildrenEditTable({
  form,
  fields,
  add,
  remove,
  tableProps,
  genderOptions,
  relationshipOptions,
  yesNoOptions,
}) {
  const optionsMap = useMemo(
    () => ({
      genderOptions,
      relationshipOptions,
      yesNoOptions,
    }),
    [genderOptions, relationshipOptions, yesNoOptions],
  );

  const editColumns = useMemo(
    () =>
      buildEditColumns({
        form,
        optionsMap,
      }),
    [form, optionsMap],
  );

  const fieldRows = useMemo(
    () => fields.map((field) => ({ ...field, key: field.key })),
    [fields],
  );

  const handleChildCountChange = useCallback(
    (nextCount) => {
      const safeCount = Math.max(0, Math.min(5, Number(nextCount) || 0));
      const currentCount = fields.length;

      if (safeCount > currentCount) {
        Array.from({ length: safeCount - currentCount }).forEach(() => add({}));
        return;
      }

      if (safeCount < currentCount) {
        const indexesToRemove = Array.from(
          { length: currentCount - safeCount },
          (_, index) => currentCount - 1 - index,
        );
        remove(indexesToRemove);
      }
    },
    [add, fields.length, remove],
  );

  return (
    <>
      <Space style={{ marginBottom: 8 }}>
        <Select
          placeholder="Children count"
          value={fields.length}
          onChange={handleChildCountChange}
          options={CHILD_COUNT_OPTIONS}
          style={{ width: 120 }}
        />
      </Space>

      {fields.length > 0 && (
        <DynamicDataTable
          columns={editColumns}
          data={fieldRows}
          {...tableProps}
        />
      )}
    </>
  );
});

/**
 * Children section wrapper for both read-only and edit modes.
 *
 * @param {Object} props
 * @param {import("antd").FormInstance} props.form
 * @param {boolean} props.editing
 * @param {Array<Record<string, any>>} props.viewColumns
 * @param {Array<Record<string, any>>} props.viewData
 * @param {Record<string, any>} props.tableProps
 * @param {string[]} props.genderOptions
 * @param {string[]} props.relationshipOptions
 * @param {string[]} props.yesNoOptions
 * @returns {JSX.Element}
 */
function ChildrenSection({
  form,
  editing,
  viewColumns,
  viewData,
  tableProps,
  genderOptions,
  relationshipOptions,
  yesNoOptions,
}) {
  const viewTableProps = useMemo(
    () => ({
      ...tableProps,
      tableProps: {
        ...tableProps?.tableProps,
        rowKey: "key",
      },
    }),
    [tableProps],
  );

  useEffect(() => {
    if (form.getFieldValue("haveAnyChildren") !== "Yes") {
      form.setFieldValue("haveAnyChildren", "Yes");
    }
  }, [form]);

  return (
    <>
      <Title
        level={5}
        style={SECTION_TITLE_STYLE}
        onClick={() => console.log(form.getFieldValue("children"))}
      >
        CHILDREN DETAILS
      </Title>

      {!editing ? (
        <DynamicDataTable
          columns={viewColumns}
          data={viewData}
          {...viewTableProps}
        />
      ) : (
        <Form.List name={["children", "arrayOfChildren"]}>
          {(fields, { add, remove }) => (
            <ChildrenEditTable
              form={form}
              fields={fields}
              add={add}
              remove={remove}
              tableProps={tableProps}
              genderOptions={genderOptions}
              relationshipOptions={relationshipOptions}
              yesNoOptions={yesNoOptions}
            />
          )}
        </Form.List>
      )}
    </>
  );
}

export default memo(ChildrenSection);
