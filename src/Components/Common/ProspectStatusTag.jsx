import { Tag } from "antd";

/**
 * Reusable “Status” tag used in prospects tables.
 * Kept in `Components/Common` to avoid duplicating inline JSX styles.
 */
export default function ProspectStatusTag({ status = "" }) {
  const normalized = typeof status === "string" ? status : String(status ?? "");

  const isSuccessful = normalized === "Successful";
  const isUnsuccessful = normalized === "Unsuccessful";

  const background = isSuccessful
    ? "#f0fdf4"
    : isUnsuccessful
      ? "#fef2f2"
      : "#fffaf0";
  const borderColor = isSuccessful
    ? "rgb(187, 247, 208)"
    : isUnsuccessful
      ? "rgb(254, 202, 202)"
      : "rgb(253, 230, 138)";
  const color = isSuccessful
    ? "rgb(22, 163, 74)"
    : isUnsuccessful
      ? "rgb(220, 38, 38)"
      : "rgb(180, 83, 9)";
  const dotColor = isSuccessful
    ? "rgb(34, 197, 94)"
    : isUnsuccessful
      ? "rgb(239, 68, 68)"
      : "rgb(245, 158, 11)";

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
        justifyContent: "center",
        gap: 5,
        fontSize: 11,
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
      {normalized}
    </Tag>
  );
}

