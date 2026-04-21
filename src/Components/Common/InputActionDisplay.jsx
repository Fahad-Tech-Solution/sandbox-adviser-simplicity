import { Button } from "antd";

export default function InputActionDisplay({
  value,
  onClick,
  valueWidth = 100,
  contentPadding = "2px 11px",
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
      <div
        style={{
          minHeight: 26,
          width: valueWidth,
          padding: contentPadding,
          borderRadius: 7,
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
