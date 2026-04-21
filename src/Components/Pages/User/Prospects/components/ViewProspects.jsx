import { Col, Row, Typography } from "antd";
import { formatAustralianDate } from "../../../../../hooks/helpers";

const { Text, Title } = Typography;

function getDisplayValue(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return value;
}

/** Matches normalizeCDFProspect / household table logic for “has a partner row”. */
function getPersonDisplayName(person = {}) {
  return (
    person?.preferredName ||
    person?.firstName ||
    person?.name ||
    person?.fullName ||
    ""
  );
}

function shouldShowPartnerSection(client, partner) {
  const relationshipStatus = (client?.relationshipStatus || "").toLowerCase();
  if (relationshipStatus !== "couple") return false;
  return Boolean(getPersonDisplayName(partner));
}

function SectionTitle({ children }) {
  return (
    <div style={{ marginTop: 0, marginBottom: 8 }}>
      <Title
        level={4}
        style={{
          margin: 0,
          fontSize: 13,
          fontWeight: 700,
          color: "#374151",
        }}
      >
        {children}
      </Title>
      <div
        style={{
          marginTop: 10,
          borderBottom: "1px solid #e5e7eb",
        }}
      />
    </div>
  );
}

function DetailCell({ label, value, valueColor }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1.2fr",
        alignItems: "center",
        padding: "10px 14px",
        borderBottom: "1px solid #eef2f7",
      }}
    >
      <Text
        style={{
          fontSize: 12,
          color: "#6b7280",
          fontWeight: 400,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontSize: 12,
          color: valueColor || "#111827",
          fontWeight: 700,
          wordBreak: "break-word",
        }}
      >
        {getDisplayValue(value)}
      </Text>
    </div>
  );
}

function DetailGrid({ rows, rowKeyPrefix = "row" }) {
  return (
    <div
      style={{
        border: "1px solid #dbe3ec",
        borderRadius: 16,
        overflow: "hidden",
        background: "#fff",
        marginBottom: 16,
      }}
    >
      {rows.map((row, index) => (
        <Row key={`${rowKeyPrefix}-${index}`} gutter={0}>
          <Col xs={24} md={12} style={{ borderRight: "1px solid #eef2f7" }}>
            <DetailCell
              label={row.left.label}
              value={row.left.value}
              valueColor={row.left.valueColor}
            />
          </Col>
          <Col xs={24} md={12}>
            <DetailCell
              label={row.right.label}
              value={row.right.value}
              valueColor={row.right.valueColor}
            />
          </Col>
        </Row>
      ))}
    </div>
  );
}

function buildPersonalRows({ person, record, preferredRole }) {
  const nameFromTable = record.clients?.find(
    (item) => item.role === preferredRole,
  )?.name;

  return [
    {
      left: { label: "First Name", value: person.firstName },
      right: { label: "Middle Name", value: person.middleName },
    },
    {
      left: {
        label: "Last Name",
        value: person.lastName || record.household,
      },
      right: {
        label: "Preferred Name",
        value: person.preferredName || nameFromTable,
      },
    },
    {
      left: {
        label: "Date of Birth",
        value: formatAustralianDate(person.dateOfBirth || person.dob),
      },
      right: {
        label: "Email",
        value:
          person.email || record.emails?.[preferredRole === "Partner" ? 1 : 0],
      },
    },
    {
      left: {
        label: "Phone Number",
        value:
          person.phoneNumber ||
          person.phone ||
          record.contacts?.[preferredRole === "Partner" ? 1 : 0],
      },
      right: {
        label: "Relationship Status",
        value: person.relationshipStatus,
      },
    },
  ];
}

function buildEmploymentRows({ person, raw }) {
  return [
    {
      left: {
        label: "Employment Income",
        value:
          person.employmentIncome ||
          person.income ||
          raw.employmentIncome ||
          "$0",
        valueColor: "#22c55e",
      },
      right: {
        label: "Business Income",
        value: person.businessIncome || raw.businessIncome || "$0",
        valueColor: "#9ca3af",
      },
    },
    {
      left: {
        label: "Centrelink Payments",
        value: person.centrelinkPayments || raw.centrelinkPayments || "$0",
        valueColor: "#22c55e",
      },
      right: {
        label: "Super Payments",
        value: person.superPayments || raw.superPayments || "$0",
        valueColor: "#9ca3af",
      },
    },
  ];
}

export default function ViewProspects({ record }) {
  if (!record) return null;

  const raw = record.raw || {};
  const client = raw.client || {};
  const partner = raw.partner || {};

  const showPartner = shouldShowPartnerSection(client, partner);

  const personalRows = buildPersonalRows({
    person: client,
    record,
    preferredRole: "Primary",
  });

  const employmentRows = buildEmploymentRows({ person: client, raw });

  const partnerPersonalRows = showPartner
    ? buildPersonalRows({
        person: partner,
        record,
        preferredRole: "Partner",
      })
    : [];

  const partnerEmploymentRows = showPartner
    ? buildEmploymentRows({ person: partner, raw })
    : [];

  return (
    <div style={{ paddingTop: 4 }}>
      <Title
        level={3}
        style={{
          margin: "0 0 4px",
          fontFamily: "Arial,serif",
          fontWeight: 800,
          fontSize: 15,
          margin: "20px 0 16px 0",
        }}
      >
        Personal Details
      </Title>

      <SectionTitle>Client Data</SectionTitle>
      <DetailGrid rowKeyPrefix="client-personal" rows={personalRows} />

      <SectionTitle>Client Employment &amp; Income</SectionTitle>
      <DetailGrid rowKeyPrefix="client-employment" rows={employmentRows} />

      {showPartner && (
        <>
          <SectionTitle>Partner Data</SectionTitle>
          <DetailGrid
            rowKeyPrefix="partner-personal"
            rows={partnerPersonalRows}
          />

          <SectionTitle>Partner Employment &amp; Income</SectionTitle>
          <DetailGrid
            rowKeyPrefix="partner-employment"
            rows={partnerEmploymentRows}
          />
        </>
      )}
    </div>
  );
}
