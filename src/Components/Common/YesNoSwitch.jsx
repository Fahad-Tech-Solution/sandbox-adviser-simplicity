import "./YesNoSwitch.css";

const sanitizeId = (value = "") => String(value).replace(/[.\[\]\s]/g, "_");

export default function YesNoSwitch({
  value = "No",
  onChange,
  name = "yesNoSwitch",
  id,
  yesLabel = "Yes",
  noLabel = "No",
  className = "",
  disabled = false,
}) {
  const safeId = sanitizeId(id || name);

  const handleChange = (next) => {
    if (disabled) return;
    onChange?.(next);
  };

  return (
    <div className={`yes-no-switch ${className} ${disabled ? "is-disabled" : ""}`}>
      <input
        type="radio"
        id={`${safeId}_no`}
        name={name}
        value="No"
        checked={value === "No"}
        onChange={() => handleChange("No")}
        disabled={disabled}
      />
      <label htmlFor={`${safeId}_no`} className="yes-no-switch__label">
        <span>{noLabel}</span>
      </label>

      <input
        type="radio"
        id={`${safeId}_yes`}
        name={name}
        value="Yes"
        checked={value === "Yes"}
        onChange={() => handleChange("Yes")}
        disabled={disabled}
      />
      <label htmlFor={`${safeId}_yes`} className="yes-no-switch__label">
        <span>{yesLabel}</span>
      </label>
    </div>
  );
}
