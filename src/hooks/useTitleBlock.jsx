import { useCallback } from "react";
import { Typography } from "antd";

const { Title } = Typography;

export default function useTitleBlock(defaultOptions = {}) {
  return useCallback(
    ({
      title,
      icon = "📄",
      gap = 16,
      iconSize = 24,
      iconBoxSize = 44,
      iconBorderRadius = 12,
      iconBackground = "rgb(240, 253, 244)",
      iconBorder = "2px solid rgb(187, 247, 208)",
      titleLevel = 3,
      titleStyle = {},
      wrapperClassName = "w-100 d-flex align-items-center justify-content-start",
      iconClassName = "d-flex align-items-center justify-content-center",
    } = {}) => {
      const mergedTitleStyle = {
        margin: 0,
        fontWeight: "700",
        fontSize: 17,
        ...(defaultOptions.titleStyle || {}),
        ...titleStyle,
      };

      return (
        <div className={wrapperClassName} style={{ gap }}>
          <div
            className={iconClassName}
            style={{
              width: iconBoxSize,
              height: iconBoxSize,
              borderRadius: iconBorderRadius,
              background: iconBackground,
              border: iconBorder,
              fontSize: iconSize,
            }}
          >
            {icon}
          </div>

          <Title level={titleLevel} style={mergedTitleStyle}>
            {title}
          </Title>
        </div>
      );
    },
    [defaultOptions],
  );
}
