import { Avatar, Card, Typography } from "antd";
import AppModal from "../../../../../Common/AppModal";
import UploadImage from "./UploadImage";
import { useEffect, useState } from "react";

const { Text } = Typography;

export const PRIMARY_GREEN = "#22c55e";

function formatAuDate(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-AU");
}

function calcAge(dob) {
  if (!dob) return null;
  const d = dob instanceof Date ? dob : new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age -= 1;
  return age;
}

function buildFormalName(person = {}, role = "client") {
  const isClient = role === "client";
  const title = isClient
    ? person.clientTitle || person.title || ""
    : person.partnerTitle || person.title || "";
  const given = isClient
    ? person.clientGivenName || person.firstName || ""
    : person.partnerGivenName || person.firstName || "";
  const middle = isClient
    ? person.clientMiddleName || person.middleName || ""
    : person.partnerMiddleName || person.middleName || "";
  const last = isClient
    ? person.clientLastName || person.lastName || ""
    : person.partnerLastName || person.lastName || "";

  const parts = [
    title,
    given && String(given).toUpperCase(),
    middle && String(middle).toLowerCase(),
    last && String(last).toUpperCase(),
  ].filter(Boolean);
  return parts.join(" ").trim() || "—";
}

function nicknameLine(person = {}, role = "client") {
  const pref =
    role === "client"
      ? person.clientPreferredName || person.preferredName
      : person.partnerPreferredName || person.preferredName;
  if (!pref) return null;
  return `(${String(pref).toLowerCase()})`;
}

function phoneLine(person = {}, role = "client") {
  const raw =
    role === "client"
      ? person.clientMobile ||
        person.clientWorkPhone ||
        person.clientPhone ||
        person.clientHomePhone ||
        person.phone
      : person.partnerMobile ||
        person.partnerWorkPhone ||
        person.partnerPhone ||
        person.partnerHomePhone ||
        person.phone;
  const s = raw != null ? String(raw).trim() : "";
  return s || "N/A";
}

function emailLine(person = {}, role = "client") {
  const e =
    role === "client"
      ? person.Email || person.email
      : person.partnerEmail || person.email;
  return e?.trim() || "—";
}

function addressLine(person = {}, role = "client") {
  const a =
    role === "client"
      ? person.clientHomeAddress || person.clientAddress || person.address
      : person.partnerHomeAddress || person.partnerAddress || person.address;
  const pc = role === "client" ? person.clientPostcode : person.partnerPostcode;
  const base = a?.trim() || "";
  if (!base) return "—";
  if (pc != null && pc !== "") return `${base} (${pc})`;
  return base;
}

function dobAgeLine(person = {}, role = "client") {
  const raw =
    role === "client"
      ? person.clientDOB || person.dateOfBirth || person.dob
      : person.partnerDOB || person.dateOfBirth || person.dob;

  const ageStr = role === "client" ? person.clientAge : person.partnerAge;
  const dateStr = formatAuDate(raw);
  const ageNum =
    ageStr != null && ageStr !== ""
      ? parseInt(String(ageStr), 10)
      : calcAge(raw);

  if (!dateStr && ageNum == null) return "—";
  if (dateStr && ageNum != null && !Number.isNaN(ageNum))
    return `${dateStr} (${ageNum})`;
  return dateStr || (ageNum != null ? `(${ageNum})` : "—");
}

function hasPartnerDetails(partner = {}) {
  return Boolean(
    partner.partnerPreferredName ||
    partner.partnerGivenName ||
    partner.partnerLastName ||
    partner.partnerEmail ||
    partner.partnerWorkPhone ||
    partner.partnerPhone ||
    partner.partnerMobile,
  );
}

export function ProfileCard({ person, role, imageUrl, personalDetailsId }) {
  const formal = buildFormalName(person, role);
  const nick = nicknameLine(person, role);
  const [open, setOpen] = useState(false);
  const [image, setImage] = useState(imageUrl);

  useEffect(() => {
    setImage(imageUrl);
  }, [imageUrl]);

  if (role === "partner" && !hasPartnerDetails(person)) {
    return (
      <Card
        bordered={false}
        style={{
          borderRadius: 12,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          border: "1px solid #f0f0f0",
          // minHeight: 320,
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        styles={{ body: { padding: 24 } }}
      >
        <Text type="secondary" style={{ fontSize: 13 }}>
          No partner details for this household.
        </Text>
      </Card>
    );
  }

  const showAvatarImg = Boolean(image);

  return (
    <Card
      bordered={false}
      style={{
        borderRadius: 12,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        border: "1px solid #f0f0f0",
        height: "100%",
        width: "100%",
      }}
      styles={{ body: { padding: "28px 24px" } }}
    >
      <AppModal
        open={open}
        onClose={() => setOpen(false)}
        title="Upload Image"
        subtitle="Upload an image for your profile"
        width={500}
        destroyOnClose
      >
        <UploadImage
          personalDetailsId={personalDetailsId}
          owner={role}
          currentImage={image}
          onClose={() => setOpen(false)}
          onSuccess={(nextImage) => {
            setImage(nextImage?.url || nextImage || "");
            setOpen(false);
          }}
        />
      </AppModal>

      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div
          style={{
            display: "inline-block",
            position: "relative",
            marginBottom: 16,
          }}
        >
          <Avatar
            size={88}
            src={showAvatarImg ? image : undefined}
            style={{
              background: "#f3f4f6",
              border: "3px solid rgba(34,197,94,.2)",
              color: "#fff",
              fontSize: 36,
              fontWeight: 600,
            }}
          >
            {!showAvatarImg ? (role === "client" ? "👨" : "👩") : null}
          </Avatar>
          <div
            style={{
              position: "absolute",
              right: -2,
              bottom: -2,
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: PRIMARY_GREEN,
              border: "2px solid #fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
            }}
            title="Primary"
            onClick={() => {
              setOpen(true);
            }}
            role="button"
          >
            📷
          </div>
        </div>

        <div
          style={{
            fontFamily: "Georgia, serif",
            fontWeight: 500,
            fontSize: 16,
            color: "#111827",
            lineHeight: 1.35,
            textTransform: "none",
          }}
        >
          {formal}
        </div>
        {nick ? (
          <div
            style={{
              marginTop: 6,
              fontSize: 13,
              color: "#6b7280",
              fontFamily: "Georgia, serif",
            }}
          >
            {nick}
          </div>
        ) : null}
      </div>

      <div
        style={{
          display: "grid",
          gap: 14,
          fontSize: 12,
          color: "#374151",
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span>📅</span>
          <span>{dobAgeLine(person, role)}</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span>📞</span>
          <span>{phoneLine(person, role)}</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span>📧</span>
          <span style={{ wordBreak: "break-word" }}>
            {emailLine(person, role)}
          </span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span>🏠</span>
          <span style={{ wordBreak: "break-word" }}>
            {addressLine(person, role)}
          </span>
        </div>
      </div>
    </Card>
  );
}
