import { Card, Table, Typography } from "antd";
import { useMemo, useState } from "react";

const { Text } = Typography;
const PRIMARY_GREEN = "#22c55e";

export default function DynamicDataTable({
  columns = [],
  data: dataProp = [],
  title,
  pageSize = 10,
  total,
  bordered = true,
  size = "small",
  primaryColor = PRIMARY_GREEN,
  className = "",
  cardStyle = {},
  cardBodyStyle = {},
  tableStyle = {},
  tableProps = {},
  pagination = {},
  showCount = true,
  noPagination = false,
  /** When true (default), wrapper uses overflow-x auto and Table gets scroll.x — independent of pagination. */
  horizontalScroll = true,
  wrapperStyle = {},
  headerFontSize = 12,
  bodyFontSize = 14,
}) {
  const [currentPage, setCurrentPage] = useState(1);

  const data = Array.isArray(dataProp) ? dataProp : [];

  const { scroll: scrollFromTableProps, ...restTableProps } = tableProps;
  const tableScroll =
    scrollFromTableProps !== undefined
      ? scrollFromTableProps
      : horizontalScroll
        ? { x: true }
        : undefined;

  const computedTotal = Number.isFinite(total) ? total : data.length;
  const totalPages = Math.max(1, Math.ceil(computedTotal / pageSize));

  const resolvedColumns = useMemo(
    () =>
      (columns || []).map((col) => {
        const userOnCell = col.onCell;
        const userOnHeaderCell = col.onHeaderCell;
        const shouldEllipsis = Boolean(col.ellipsis);

        return {
          ...col,
          ellipsis: shouldEllipsis,
          onCell: (record, rowIndex) => {
            const userCellProps = userOnCell?.(record, rowIndex) || {};

            return {
              ...userCellProps,
              style: {
                wordBreak: shouldEllipsis ? "normal" : "break-word",
                overflowWrap: shouldEllipsis ? "normal" : "anywhere",
                whiteSpace: shouldEllipsis ? "nowrap" : "normal",
                ...userCellProps.style,
              },
            };
          },
          onHeaderCell: (column) => {
            const userHeaderProps = userOnHeaderCell?.(column) || {};

            return {
              ...userHeaderProps,
              style: {
                background: primaryColor,
                color: "#fff",
                fontWeight: 600,
                borderInlineColor: "#ffffff",
                ...userHeaderProps.style,
              },
            };
          },
        };
      }),
    [columns, primaryColor],
  );

  return (
    <>
      {showCount && (
        <div style={{ padding: "12px 0px" }}>
          <Text
            style={{
              fontSize: 12,
              fontFamily: "Arial,serif",
              color: "rgb(107, 114, 128)",
            }}
          >
            Showing <strong style={{ color: "#000" }}>{data.length}</strong>{" "}
            records
          </Text>
        </div>
      )}

      <div
        style={{
          flex: 1,
          minHeight: 0,
          width: "100%",
          overflowX: horizontalScroll ? "auto" : "visible",
          ...wrapperStyle,
        }}
      >
        <Table
          columns={resolvedColumns}
          dataSource={data}
          className={className}
          rowClassName={() => "dynamic-table-row"}
          tableLayout="fixed"
          scroll={tableScroll}
          size={size}
          bordered={bordered}
          style={{ ...tableStyle }}
          pagination={
            !noPagination
              ? {
                  current: currentPage,
                  total: computedTotal,
                  pageSize,
                  showSizeChanger: false,
                  showQuickJumper: false,
                  placement: ["bottomRight"],
                  showTotal: () => `Page ${currentPage} of ${totalPages}`,
                  onChange: (page) => setCurrentPage(page),
                  ...pagination,
                }
              : false
          }
          styles={{
            content: {
              border: "1px solid #e0e0e0",
              borderRadius: tableStyle.borderRadius || 0,
            },
            header: {
              wrapper: {
                background: "#22c55e",
                color: "#fff",
                fontWeight: 600,
              },
              row: {
                background: "#22c55e",
                color: "#fff",
                fontWeight: 600,
              },
              cell: {
                background: "#22c55e",
                color: "#fff",
                fontWeight: 600,
                borderInlineColor: "#fff",
                borderRadius: 0,
                fontSize: headerFontSize,
              },
            },
            body: {
              row: {
                border: "none",
                borderBottom: "0.5px solid #f3f3f3",
              },
              cell: {
                border: "none",
                borderBottom: "0.5px solid #f3f3f3",
                fontSize: bodyFontSize,
              },
            },
            section: {
              border: "none",
            },
          }}
          {...restTableProps}
        />
      </div>
    </>
  );
}
