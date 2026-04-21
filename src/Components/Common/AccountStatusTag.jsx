import { Tag } from "antd";

/**
 * Active / Disabled account pill (My Team, advisers, employees).
 * Same visual language as ProspectStatusTag (bordered, dot, compact).
 */
export default function AccountStatusTag({ isActive }) {
  const active = Boolean(isActive);

  const background = active ? "#f0fdf4" : "#fef2f2";
  const borderColor = active ? "rgb(187, 247, 208)" : "rgb(254, 202, 202)";
  const color = active ? "rgb(22, 163, 74)" : "rgb(220, 38, 38)";
  const dotColor = active ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)";
  const label = active ? "Active" : "Disabled";

  return (
    <Tag
      bordered
      style={{
        borderRadius: 6,
        paddingInline: 12,
        padding: "0px 10px",
        background,
        borderColor,
        color,
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "start",
        gap: 5,
        fontSize: 11,
        width: "auto",
        maxWidth: "200px",
      }}
    >
      <div
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: dotColor,
        }}
      />
      {label}
    </Tag>
  );
}
