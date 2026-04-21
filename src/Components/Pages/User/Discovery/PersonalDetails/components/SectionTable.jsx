import { Typography } from "antd";
import React, { memo } from "react";
import DynamicDataTable from "../../../../../Common/DynamicDataTable.jsx";

const { Title } = Typography;
const SECTION_TITLE_STYLE = {
  marginBottom: 12,
  marginTop: 8,
  fontSize: 13,
  letterSpacing: 0.5,
  fontWeight: 700,
  color: "#111",
};

/**
 * Shared section wrapper for view/edit table rendering.
 *
 * @param {Object} props
 * @param {string} props.title
 * @param {boolean} props.editing
 * @param {Array<Record<string, any>>} props.viewColumns
 * @param {Array<Record<string, any>>} props.editColumns
 * @param {Array<Record<string, any>>} props.viewData
 * @param {Array<Record<string, any>>} props.editData
 * @param {Record<string, any>} props.tableProps
 * @returns {JSX.Element}
 */
function SectionTable({
  title,
  editing,
  viewColumns,
  editColumns,
  viewData,
  editData,
  tableProps,
}) {
  return (
    <>
      <Title level={5} style={SECTION_TITLE_STYLE}>
        {title}
      </Title>

      <DynamicDataTable
        columns={editing ? editColumns : viewColumns}
        data={editing ? editData : viewData}
        {...tableProps}
      />
    </>
  );
}

export default memo(SectionTable);
