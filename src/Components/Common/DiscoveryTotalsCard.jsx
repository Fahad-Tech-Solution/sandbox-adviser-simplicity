import { Button, Card, ConfigProvider, Input, Spin } from "antd";
import { memo, useEffect, useState } from "react";
import { GoArrowUpRight } from "react-icons/go";
import { toCommaAndDollar } from "../../hooks/helpers";
import { FaRegSave } from "react-icons/fa";
import { BiLoaderCircle } from "react-icons/bi";
import { MdModeEditOutline } from "react-icons/md";

const CARD_STYLE = {
  borderRadius: 16,
  boxShadow: "0 2px 12px rgba(0, 0, 0, .05)",
};

const CARD_BODY_STYLE = {
  padding: "24px 16px 18px",
  height: "262px",
};

const TITLE_STYLE = {
  fontSize: 14,
  fontWeight: 700,
  fontFamily: "Arial, sans-serif",
  textAlign: "center",
};

const ICON_WRAPPER_STYLE = {
  fontSize: 44,
  fontWeight: 700,
  textAlign: "center",
  margin: 0,
  padding: 0,
  lineHeight: 1,
};

const CONTENT_STYLE = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexDirection: "column",
  marginTop: "15px",
};

const BADGE_STYLE = {
  width: "22px",
  height: "22px",
  borderRadius: "5px",
  background: "#22c55e",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "11px",
  // marginBottom: "8px",
  color: "#fff",
  boxShadow: "0 2px 6px rgba(34, 197, 94, .3)",
};

const NAME_STYLE = {
  fontSize: 11,
  fontWeight: 400,
  fontFamily: "Arial, sans-serif",
  textAlign: "center",
  color: "#6b7280",
  marginBottom: "5px",
  marginTop: "10px",
};

const TOTAL_WRAPPER_STYLE = {
  textAlign: "center",
  borderRadius: "6px",
  fontSize: 12,
  padding: "2px 10px",
  fontFamily: "Georgia,serif",
  backgroundColor: "transparent",
};

function renderIcon(icon) {
  if (typeof icon === "string") {
    return icon;
  }

  if (typeof icon === "function") {
    const IconComponent = icon;
    return <IconComponent />;
  }

  return icon ?? null;
}

function getTotalStyle(hasValue) {
  return {
    ...TOTAL_WRAPPER_STYLE,
    border: hasValue
      ? "1px solid rgba(34, 197, 94, .4)"
      : "1px solid rgba(0, 0, 0, .1)",
    color: hasValue ? "#000" : "#9ca3af",
  };
}

function TotalValue({ name, value }) {
  const hasValue = Boolean(value);

  return (
    <>
      <p style={NAME_STYLE}>{name || "N/A"}</p>
      <div className="w-100 p-0">
        <div style={getTotalStyle(hasValue)}>{value || "$0"}</div>
      </div>
    </>
  );
}

function FormField({ name, value, callBackFunction }) {
  let [inputValue, setInputValue] = useState(value);
  let [loading, setLoading] = useState(false);
  let [isEditing, setIsEditing] = useState(false);
  const hasValue = Boolean(value);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  return (
    <>
      <p style={NAME_STYLE}>{name || "N/A"}</p>
      <div className="w-100 p-0 d-flex justify-content-center align-items-center">
        <Input
          style={{
            ...getTotalStyle(hasValue),
            borderRadius: "6px 0 0 6px",
            height: "25px",
            padding: "0",
            backgroundColor: !isEditing ? "rgb(243 244 246)" : "transparent",
          }}
          disabled={!isEditing}
          value={inputValue}
          onChange={(e) =>
            setInputValue(
              toCommaAndDollar(e.target.value.replace(/[^0-9]/g, "")),
            )
          }
        />
        <Button
          type="primary"
          style={{ fontSize: 12, height: "25px", borderRadius: "0 6px 6px 0" }}
          onClick={async () => {
            if (!isEditing) {
              setIsEditing(true);
              return;
            }

            setLoading(true);
            try {
              await callBackFunction(inputValue);
            } catch (error) {
              console.error(error);
            } finally {
              setLoading(false);
              setIsEditing(false);
            }
          }}
        >
          {isEditing ? (
            loading ? (
              <ConfigProvider
                theme={{
                  components: {
                    Spin: {
                      colorPrimary: "#fff",
                    },
                  },
                }}
              >
                <Spin size="small" />
              </ConfigProvider>
            ) : (
              <FaRegSave style={{ fontSize: 12 }} />
            )
          ) : (
            <MdModeEditOutline style={{ fontSize: 12 }} />
          )}
        </Button>
      </div>
    </>
  );
}

function DiscoveryTotalsCard({
  title,
  icon,
  firstName,
  firstTotal,
  secondName,
  secondTotal,
  showPartner = false,
  secondisFormInput = false,
  callBackFunction = () => {},
  OpenModal = () => {},
  onOpenModal,
  modalPayload,
}) {
  const handleOpen = () => {
    if (typeof onOpenModal === "function") {
      onOpenModal(modalPayload);
      return;
    }
    OpenModal();
  };

  return (
    <Card style={CARD_STYLE} styles={{ body: CARD_BODY_STYLE }}>
      <h6 style={TITLE_STYLE}>{title}</h6>
      <p style={ICON_WRAPPER_STYLE}>{renderIcon(icon)}</p>
      <div style={CONTENT_STYLE}>
        <div role="button" style={BADGE_STYLE} onClick={handleOpen}>
          <GoArrowUpRight />
        </div>

        <TotalValue name={firstName} value={firstTotal} />
        {secondisFormInput ? (
          <FormField
            name={secondName}
            value={secondTotal}
            callBackFunction={callBackFunction}
          />
        ) : showPartner ? (
          <TotalValue name={secondName} value={secondTotal} />
        ) : null}
      </div>
    </Card>
  );
}

export default memo(DiscoveryTotalsCard);
