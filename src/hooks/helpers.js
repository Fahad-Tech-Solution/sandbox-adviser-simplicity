/* ================================
   STRING HELPERS
================================ */

// Capitalize first letter of each word
export const capitalizeWords = (text = "") =>
  text.replace(/\b\w/g, (c) => c.toUpperCase());

// Capitalize only first letter
export const capitalizeFirst = (text = "") =>
  text.charAt(0).toUpperCase() + text.slice(1);

// Convert to kebab-case
export const toKebabCase = (text = "") =>
  text.toLowerCase().trim().replace(/\s+/g, "-");

// Convert to camelCase
export const toCamelCase = (text = "") =>
  text
    .toLowerCase()
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ""));

// Truncate string
export const truncate = (text = "", length = 50) =>
  text.length > length ? `${text.slice(0, length)}...` : text;

// Remove extra spaces
export const normalizeSpaces = (text = "") => text.replace(/\s+/g, " ").trim();

/* ================================
   NUMBER HELPERS
================================ */

// Format number with commas
export const formatNumber = (num = 0) => new Intl.NumberFormat().format(num);

export const toCommaAndDollar = (x) =>
  "$" +
  Math.ceil(x)
    .toFixed(0)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

// Clamp number between min and max
export const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

// Random number between min & max
export const randomBetween = (min = 0, max = 1) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

/* ================================
   ARRAY HELPERS
================================ */

// Remove duplicates
export const uniqueArray = (arr = []) => [...new Set(arr)];

// Chunk array
export const chunkArray = (arr = [], size = 1) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size),
  );

// Check if array is empty
export const isEmptyArray = (arr) => !Array.isArray(arr) || arr.length === 0;

/* ================================
   OBJECT HELPERS
================================ */

// Check if object is empty
export const isEmptyObject = (obj = {}) => Object.keys(obj).length === 0;

// Pick keys from object
export const pick = (obj = {}, keys = []) =>
  keys.reduce((acc, k) => (k in obj ? { ...acc, [k]: obj[k] } : acc), {});

// Omit keys from object
export const omit = (obj = {}, keys = []) =>
  Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k)));

/* ================================
   BOOLEAN / VALIDATION
================================ */

// Check if value exists
export const isTruthy = (value) =>
  value !== null && value !== undefined && value !== "";

// Email validation
export const isValidEmail = (email = "") =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/* ================================
   MISC HELPERS
================================ */

// No-op function
export const noop = () => {};

// Delay (promise-based)
export const sleep = (ms = 1000) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Safe JSON parse
export const safeJSONParse = (value, fallback = null) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

// Convert ISO date to Australian format (DD/MM/YYYY)
export const formatAustralianDate = (dateString = "") => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-AU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch {
    return "";
  }
};

/* ================================
   MY CLIENTS (Jotai + API shape)
================================ */

/** GET may return a bare array, `{ clients: [] }`, or `{ data: [] }`. */
export function normalizeMyClientsList(value) {
  if (value == null) return [];
  if (Array.isArray(value)) return value;
  if (Array.isArray(value.clients)) return value.clients;
  if (Array.isArray(value.data)) return value.data;
  return [];
}

/** Always store `{ clients: [...] }` in MyClientsData. */
export function wrapMyClientsState(list) {
  return { clients: Array.isArray(list) ? list : [] };
}

/**
 * POST /personalDetails/Add — HouseholdTable needs a full row `{ _id, client, partner, updatedAt }`.
 * Do not return only `res.client` or the table shows UNKNOWN / dashes.
 */
export function unwrapCreatedClientResponse(res) {
  if (res == null) return null;
  if (Array.isArray(res) && res[0]) return res[0];
  if (res.data != null) {
    const d = res.data;
    return Array.isArray(d) ? d[0] : d;
  }
  if (typeof res === "object" && !Array.isArray(res)) {
    if (res.client && typeof res.client === "object") {
      if (
        res._id ||
        res.updatedAt ||
        Object.prototype.hasOwnProperty.call(res, "partner")
      ) {
        return res;
      }
    }
    return res;
  }
  return null;
}

/**
 * Build a household row in the same shape as GET /api/user/Clients (for optimistic UI after Add).
 */
export function buildClientRowFromAddForm(values, apiRes = {}) {
  const id =
    apiRes?._id ||
    apiRes?.id ||
    (apiRes?.data && typeof apiRes.data === "object" && apiRes.data._id) ||
    `temp-${Date.now()}`;

  const updatedAt =
    apiRes?.updatedAt ||
    (apiRes?.data && apiRes.data?.updatedAt) ||
    new Date().toISOString();

  const client = {
    clientLastName: values.clientLastName,
    clientPreferredName: values.clientPreferredName,
    clientAge: values.clientAge,
    clientWorkPhone: values.clientWorkPhone,
    Email: values.Email,
    clientHomeAddress: values.clientHomeAddress,
    clientMaritalStatus: values.clientMaritalStatus,
  };

  const ms = String(values.clientMaritalStatus || "")
    .trim()
    .toLowerCase();
  const hidePartner = ["single", "widowed", "", null, undefined].includes(ms) || !ms;

  const partner =
    hidePartner || !(values.partnerPreferredName || values.partnerAge)
      ? {}
      : {
          partnerPreferredName: values.partnerPreferredName,
          partnerAge: values.partnerAge,
          partnerWorkPhone: values.clientWorkPhone,
        };

  return {
    _id: id,
    client,
    partner,
    updatedAt,
  };
}

/** Prefer full API household document; otherwise build from submitted form + ids from response. */
export function mergeNewClientRowForTable(apiRes, formValues) {
  const unwrapped = unwrapCreatedClientResponse(apiRes);
  if (
    unwrapped &&
    typeof unwrapped === "object" &&
    unwrapped.client &&
    typeof unwrapped.client === "object" &&
    (unwrapped._id || unwrapped.updatedAt)
  ) {
    return unwrapped;
  }
  if (formValues && typeof formValues === "object") {
    return buildClientRowFromAddForm(formValues, apiRes);
  }
  return unwrapped;
}
