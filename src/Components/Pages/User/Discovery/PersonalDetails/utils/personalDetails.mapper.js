import dayjs from "dayjs";

/**
 * @typedef {Object} PersonImage
 * @property {string} [url]
 * @property {string} [public_id]
 */

/**
 * @typedef {Object} ClientPersonalDetails
 * @property {string} [clientTitle]
 * @property {string} [clientGivenName]
 * @property {string} [clientMiddleName]
 * @property {string} [clientLastName]
 * @property {string} [clientSurname]
 * @property {string} [clientPreferredName]
 * @property {string} [clientGender]
 * @property {string} [clientDOB]
 * @property {number|string} [clientAge]
 * @property {string} [clientMaritalStatus]
 * @property {string} [clientEmploymentStatus]
 * @property {string} [clientHealth]
 * @property {string} [clientSmoker]
 * @property {number|string} [clientPlannedRetirementAge]
 * @property {string} [clientHomeAddress]
 * @property {string} [clientPostcode]
 * @property {string} [clientHomePhone]
 * @property {string} [clientWorkPhone]
 * @property {string} [clientMobile]
 * @property {string} [Email]
 * @property {string} [clientPostalAddress]
 * @property {string} [clientPostalPostCode]
 * @property {string} [clientOccupationID]
 * @property {string} [clientTaxResidentRadio]
 * @property {string} [clientPrivateHealthCoverRadio]
 * @property {string} [clientHELPSDebtRadio]
 * @property {boolean} [clientSameAsAbove]
 * @property {PersonImage} [image]
 */

/**
 * @typedef {Object} PartnerPersonalDetails
 * @property {string} [partnerTitle]
 * @property {string} [partnerGivenName]
 * @property {string} [partnerMiddleName]
 * @property {string} [partnerLastName]
 * @property {string} [partnerSurname]
 * @property {string} [partnerPreferredName]
 * @property {string} [partnerGender]
 * @property {string} [partnerDOB]
 * @property {number|string} [partnerAge]
 * @property {string} [partnerMaritalStatus]
 * @property {string} [partnerEmploymentStatus]
 * @property {string} [partnerHealth]
 * @property {string} [partnerSmoker]
 * @property {number|string} [partnerPlannedRetirementAge]
 * @property {string} [partnerHomeAddress]
 * @property {string} [partnerPostcode]
 * @property {string} [partnerHomePhone]
 * @property {string} [partnerWorkPhone]
 * @property {string} [partnerMobile]
 * @property {string} [partnerEmail]
 * @property {string} [partnerPostalAddress]
 * @property {string} [partnerPostalPostCode]
 * @property {string} [partnerOccupationID]
 * @property {string} [partnerTaxResidentRadio]
 * @property {string} [partnerPrivateHealthCoverRadio]
 * @property {string} [partnerHELPSDebtRadio]
 * @property {boolean} [partnerSameAsClient]
 * @property {PersonImage} [image]
 */

/**
 * @typedef {Object} ChildDetails
 * @property {string} [name]
 * @property {string} [dob]
 * @property {string} [gender]
 * @property {string} [relationship]
 * @property {string} [depenantChild]
 * @property {string} [firstName]
 * @property {string} [lastName]
 * @property {string} [age]
 */

/**
 * @typedef {Object} PersonalDetailsData
 * @property {string} [_id]
 * @property {ClientPersonalDetails} [client]
 * @property {PartnerPersonalDetails} [partner]
 * @property {{ arrayOfChildren?: ChildDetails[] }} [children]
 * @property {"Yes"|"No"|string} [haveAnyChildren]
 */

/**
 * @typedef {Object} PersonalDetailsFormValues
 * @property {ClientPersonalDetails & { clientDOB?: import("dayjs").Dayjs }} [client]
 * @property {PartnerPersonalDetails & { partnerDOB?: import("dayjs").Dayjs }} [partner]
 * @property {{ arrayOfChildren?: (ChildDetails & { dob?: import("dayjs").Dayjs })[] }} [children]
 * @property {"Yes"|"No"|string} [haveAnyChildren]
 */

/**
 * @typedef {Object} PersonalDetailsSubmitPayload
 * @property {ClientPersonalDetails} [client]
 * @property {PartnerPersonalDetails} [partner]
 * @property {{ arrayOfChildren?: ChildDetails[] }} [children]
 * @property {"Yes"|"No"|string} [haveAnyChildren]
 */

/** @param {unknown} value */
function formatDateValue(value) {
  if (!value) return "—";
  const date = dayjs(value);
  return date.isValid() ? date.format("DD/MM/YYYY") : "—";
}

/** @param {unknown} value */
function formatAgeValue(value) {
  return value != null && value !== "" && !Number.isNaN(Number(value))
    ? String(value)
    : "—";
}

/**
 * Resolve personal details from nested discovery payloads.
 * @param {Record<string, any> | null | undefined} data
 * @returns {PersonalDetailsData | null}
 */
export function getPersonalDetailsFromDiscovery(data) {
  if (!data || typeof data !== "object") return null;
  if (data.personaldetails && typeof data.personaldetails === "object") {
    return data.personaldetails;
  }
  if (data.personalDetails && typeof data.personalDetails === "object") {
    return data.personalDetails;
  }
  if (
    data.client != null &&
    (data._id || data.client?.clientGivenName != null)
  ) {
    return data;
  }
  return null;
}

/**
 * Format nullable values for read-only table display.
 * @param {unknown} value
 * @returns {string}
 */
export function displayVal(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object" && dayjs.isDayjs(value)) {
    return value.format("DD/MM/YYYY");
  }
  return String(value);
}

/**
 * Split a full child name into first and last parts.
 * @param {string | null | undefined} name
 * @returns {{ firstName: string, lastName: string }}
 */
export function splitFullName(name) {
  if (!name || typeof name !== "string") {
    return { firstName: "", lastName: "" };
  }

  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

/**
 * Compute age in years from a DOB value.
 * @param {string | import("dayjs").Dayjs | null | undefined} dob
 * @returns {string}
 */
export function childAgeFromDob(dob) {
  if (!dob) return "";
  const date = dayjs.isDayjs(dob) ? dob : dayjs(dob);
  if (!date.isValid()) return "";
  return String(dayjs().diff(date, "year"));
}

/**
 * Convert a raw date-like value to a valid Dayjs instance.
 * @param {string | import("dayjs").Dayjs | null | undefined} value
 * @returns {import("dayjs").Dayjs | undefined}
 */
export function toDayjs(value) {
  if (!value) return undefined;
  if (dayjs.isDayjs(value)) return value;
  const date = dayjs(value);
  return date.isValid() ? date : undefined;
}

/**
 * Normalize numeric postcode-like values into strings for form inputs and API payloads.
 * @param {unknown} value
 * @returns {string}
 */
function toStringValue(value) {
  if (value === null || value === undefined) return "";
  return String(value);
}

/**
 * @template {Record<string, any>} T
 * @param {T | null | undefined} person
 * @param {string[]} postcodeKeys
 * @returns {T}
 */
function normalizePostcodeFields(person, postcodeKeys) {
  if (!person || typeof person !== "object") {
    return /** @type {T} */ ({});
  }

  const next = { ...person };
  postcodeKeys.forEach((key) => {
    if (key in next) {
      next[key] = toStringValue(next[key]);
    }
  });
  return /** @type {T} */ (next);
}

/**
 * Build Ant Design form initial values from the API shape.
 * Keeps the submit contract intact while normalizing date fields.
 * @param {PersonalDetailsData | null} pd
 * @returns {PersonalDetailsFormValues}
 */
export function buildInitialValues(pd) {
  const client = normalizePostcodeFields(pd?.client ?? {}, [
    "clientPostcode",
    "clientPostalPostCode",
  ]);
  const partner = normalizePostcodeFields(pd?.partner ?? {}, [
    "partnerPostcode",
    "partnerPostalPostCode",
  ]);
  const rows = pd?.children?.arrayOfChildren ?? [];

  return {
    client: {
      ...client,
      clientDOB: toDayjs(client.clientDOB),
    },
    partner: {
      ...partner,
      partnerDOB: toDayjs(partner.partnerDOB),
    },
    children: {
      arrayOfChildren: rows.map((child) => {
        const { firstName, lastName } = splitFullName(child.name);
        return {
          ...child,
          firstName,
          lastName,
          age: childAgeFromDob(child.dob),
          dob: toDayjs(child.dob),
        };
      }),
    },
    haveAnyChildren: pd?.haveAnyChildren ?? "No",
  };
}

/**
 * Map form values back to the API submit shape.
 * @param {PersonalDetailsFormValues} values
 * @returns {PersonalDetailsSubmitPayload}
 */
export function mapSubmitValues(values) {
  const iso = (value) =>
    value && dayjs.isDayjs(value)
      ? value.toISOString()
      : value && typeof value.toISOString === "function"
        ? value.toISOString()
        : value;

  const mapPersonDates = (person, dobKey) => {
    if (!person || typeof person !== "object") return person;

    const next = normalizePostcodeFields(person, [
      "clientPostcode",
      "clientPostalPostCode",
      "partnerPostcode",
      "partnerPostalPostCode",
    ]);
    if (next[dobKey]) {
      next[dobKey] = iso(next[dobKey]);
    }
    return next;
  };

  const childrenRows = values.children?.arrayOfChildren ?? [];
  const mappedChildren =
    values.haveAnyChildren === "No"
      ? []
      : childrenRows.map((row) => ({
          name: [row.firstName, row.lastName].filter(Boolean).join(" ").trim(),
          dob: iso(row.dob),
          gender: row.gender,
          relationship: row.relationship,
          depenantChild: row.depenantChild,
        }));

  return {
    ...values,
    client: mapPersonDates(values.client, "clientDOB"),
    partner: mapPersonDates(values.partner, "partnerDOB"),
    children: { arrayOfChildren: mappedChildren },
  };
}

/**
 * Build read-only table rows for the personal details section.
 * @param {PersonalDetailsData | null} pd
 * @returns {Array<Record<string, string>>}
 */
export function buildViewPersonalRows(pd) {
  const client = pd?.client ?? {};
  const partner = pd?.partner ?? {};

  return [
    {
      key: "client",
      preferred: displayVal(client.clientPreferredName),
      title: displayVal(client.clientTitle),
      firstName: displayVal(client.clientGivenName),
      middleName: displayVal(client.clientMiddleName),
      lastName: displayVal(client.clientLastName ?? client.clientSurname),
      gender: displayVal(client.clientGender),
      dobOnly: formatDateValue(client.clientDOB),
      ageOnly: formatAgeValue(client.clientAge),
      marital: displayVal(client.clientMaritalStatus),
    },
    {
      key: "partner",
      preferred: displayVal(partner.partnerPreferredName),
      title: displayVal(partner.partnerTitle),
      firstName: displayVal(partner.partnerGivenName),
      middleName: displayVal(partner.partnerMiddleName),
      lastName: displayVal(partner.partnerLastName ?? partner.partnerSurname),
      gender: displayVal(partner.partnerGender),
      dobOnly: formatDateValue(partner.partnerDOB),
      ageOnly: formatAgeValue(partner.partnerAge),
      marital: displayVal(partner.partnerMaritalStatus),
    },
  ];
}

/**
 * Build read-only table rows for the financial and health section.
 * @param {PersonalDetailsData | null} pd
 * @returns {Array<Record<string, string>>}
 */
export function buildViewFinancialRows(pd) {
  const client = pd?.client ?? {};
  const partner = pd?.partner ?? {};

  return [
    {
      key: "client",
      preferred: displayVal(client.clientPreferredName),
      workStatus: displayVal(client.clientEmploymentStatus),
      occupation: displayVal(client.clientOccupationID),
      retire: displayVal(client.clientPlannedRetirementAge),
      taxRes: displayVal(client.clientTaxResidentRadio),
      helpDebt: displayVal(client.clientHELPSDebtRadio),
      health: displayVal(client.clientHealth),
      smoker: displayVal(client.clientSmoker),
      phc: displayVal(client.clientPrivateHealthCoverRadio),
    },
    {
      key: "partner",
      preferred: displayVal(partner.partnerPreferredName),
      workStatus: displayVal(partner.partnerEmploymentStatus),
      occupation: displayVal(partner.partnerOccupationID),
      retire: displayVal(partner.partnerPlannedRetirementAge),
      taxRes: displayVal(partner.partnerTaxResidentRadio),
      helpDebt: displayVal(partner.partnerHELPSDebtRadio),
      health: displayVal(partner.partnerHealth),
      smoker: displayVal(partner.partnerSmoker),
      phc: displayVal(partner.partnerPrivateHealthCoverRadio),
    },
  ];
}

/**
 * Build read-only table rows for the contact details section.
 * @param {PersonalDetailsData | null} pd
 * @returns {Array<Record<string, string>>}
 */
export function buildViewContactRows(pd) {
  const client = pd?.client ?? {};
  const partner = pd?.partner ?? {};

  return [
    {
      key: "client",
      preferred: displayVal(client.clientPreferredName),
      home: displayVal(client.clientHomeAddress),
      homePc: displayVal(client.clientPostcode),
      postal: displayVal(client.clientPostalAddress),
      postalPc: displayVal(client.clientPostalPostCode),
      mobile: displayVal(client.clientMobile),
      homePhone: displayVal(client.clientHomePhone),
      workPhone: displayVal(client.clientWorkPhone),
      email: displayVal(client.Email),
    },
    {
      key: "partner",
      preferred: displayVal(partner.partnerPreferredName),
      home: displayVal(partner.partnerHomeAddress),
      homePc: displayVal(partner.partnerPostcode),
      postal: displayVal(partner.partnerPostalAddress),
      postalPc: displayVal(partner.partnerPostalPostCode),
      mobile: displayVal(partner.partnerMobile),
      homePhone: displayVal(partner.partnerHomePhone),
      workPhone: displayVal(partner.partnerWorkPhone),
      email: displayVal(partner.partnerEmail),
    },
  ];
}

/**
 * Build read-only table rows for the children section.
 * @param {PersonalDetailsData | null} pd
 * @returns {Array<Record<string, string>>}
 */
export function buildViewChildrenRows(pd) {
  const rows = pd?.children?.arrayOfChildren ?? [];

  return rows.map((child, index) => {
    const { firstName, lastName } = splitFullName(child.name);

    return {
      key: `ch-${index}`,
      firstName: displayVal(firstName),
      lastName: displayVal(lastName),
      dob: child.dob ? formatDateValue(child.dob) : "—",
      age: childAgeFromDob(child.dob) || "—",
      gender: displayVal(child.gender),
      relationship: displayVal(child.relationship),
      dependent: displayVal(child.depenantChild),
    };
  });
}
