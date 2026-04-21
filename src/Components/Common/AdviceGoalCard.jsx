import { Tooltip, Typography } from "antd";
import { AiFillQuestionCircle } from "react-icons/ai";

const { Text } = Typography;

function renderCardIcon(Icon, isYes) {
  const iconStyle = {
    fontSize: 26,
    color: isYes ? "#22c55e" : "#6b7280",
    lineHeight: 1,
  };

  if (typeof Icon === "string") {
    return <span style={iconStyle}>{Icon}</span>;
  }

  if (typeof Icon === "function") {
    return <Icon style={iconStyle} />;
  }

  return null;
}

/**
 * Shared “Area of Advice Needed” card UI.
 *
 * Kept in `Components/Common` so pages like `ViewGoals` can render consistently.
 */
export default function AdviceGoalCard({
  label,
  Icon,
  status,
  key = "",
  info = "",
  onClick = () => {},
}) {
  const normalizedStatus =
    status === null || status === undefined ? "—" : status;
  const isYes = normalizedStatus === "Yes";
  const isNo = normalizedStatus === "No";

  return (
    <div
      style={{
        border: isYes ? "1px solid #22c55e" : "1px solid #e5e7eb",
        borderRadius: 14,
        padding: "18px 14px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        background: "#fafafa",
        boxShadow: "0 4px 14px rgba(15,23,42,0.06)",
      }}
      onClick={() => {
        onClick(key);
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 12,
          background: isYes ? "rgba(34, 197, 94, 0.12)" : "#f3f4f6",
          display: "grid",
          placeItems: "center",
          marginBottom: 12,
        }}
      >
        {renderCardIcon(Icon, isYes)}
      </div>

      <Text
        strong
        style={{
          fontSize: 13,
          lineHeight: 1.35,
          color: "#111827",
          minHeight: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {label}{" "}
        {info && (
          <Tooltip title={info}>
            <AiFillQuestionCircle
              style={{ fontSize: "inherit", color: "#6b7280" }}
            />
          </Tooltip>
        )}
      </Text>
    </div>
  );
}
