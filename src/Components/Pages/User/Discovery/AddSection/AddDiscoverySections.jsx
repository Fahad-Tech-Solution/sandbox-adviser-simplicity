import { App as AntdApp, Alert, Button, Form, Input, Modal, Spin } from "antd";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useApi from "../../../../../hooks/useApi";
import {
  addDiscoverySectionsModalOpen,
  discoverySectionQuestionsAtom,
  SelectedClient,
} from "../../../../../store/authState";

const PRIMARY_GREEN = "#22c55e";
const CARD_BORDER = "rgba(34, 197, 94, 0.25)";
const CARD_BORDER_SELECTED = PRIMARY_GREEN;
const CARD_BG_SELECTED = "rgba(34, 197, 94, 0.08)";

/**
 * Same keys / behaviour as AdviserSimplisity `ImportantQuestion.jsx`:
 * toggles Yes/No on API fields; Personal Insurance also sets life, TPD, trauma, incomeProtection.
 */
const SECTION_CARDS = [
  {
    title: "Personal Insurance",
    key: "personalInsuranceTab",
    icon: "🛡️",
  },
  {
    title: "Business Entities",
    key: "BusinessAsTrusts",
    icon: "🏢",
  },
  {
    title: "SMSF",
    key: "SMSFManagedFundsTab",
    icon: "🔐",
  },
  {
    title: "Investment Trust",
    key: "businessAsInvestmentTab",
    icon: "📊",
  },
];

/** All keys stored in Form and sent on submit (includes fields not shown as cards). */
const FORM_FIELD_NAMES = [
  "_id",
  "clientFK",
  "personalInsuranceTab",
  "BusinessAsCompanyStructure",
  "BusinessAsTrusts",
  "SMSFManagedFundsTab",
  "businessAsInvestmentTab",
  "life",
  "TPD",
  "trauma",
  "incomeProtection",
];

function unwrapQuestionsResponse(res) {
  if (res == null) return null;
  if (
    typeof res === "object" &&
    res.data !== undefined &&
    !Array.isArray(res)
  ) {
    return res.data;
  }
  return res;
}

/** Mirrors ImportantQuestion `QuestionClick` toggle logic. */
function applyQuestionToggle(values, elem) {
  const next = { ...values };
  const k = elem.key;
  const v = next[k];

  if (v === "No" || v == null) {
    next[k] = "Yes";
    if (k === "personalInsuranceTab") {
      next.life = "Yes";
      next.TPD = "Yes";
      next.trauma = "Yes";
      next.incomeProtection = "Yes";
    }
  } else if (v === "Yes") {
    next[k] = "No";
    if (k === "personalInsuranceTab") {
      next.life = "No";
      next.TPD = "No";
      next.trauma = "No";
      next.incomeProtection = "No";
    }
  }
  return next;
}

function buildEmptyDefaults(clientFk) {
  return {
    clientFK: clientFk ?? "",
    personalInsuranceTab: "No",
    BusinessAsCompanyStructure: "No",
    BusinessAsTrusts: "No",
    SMSFManagedFundsTab: "No",
    businessAsInvestmentTab: "No",
    life: "No",
    TPD: "No",
    trauma: "No",
    incomeProtection: "No",
  };
}

function mergeLoadedPayload(clientId, data) {
  if (data && typeof data === "object") {
    return {
      ...buildEmptyDefaults(clientId),
      ...data,
      clientFK: data.clientFK ?? clientId,
    };
  }
  return buildEmptyDefaults(clientId);
}

function pickPayload(values) {
  const out = {};
  for (const name of FORM_FIELD_NAMES) {
    if (values[name] !== undefined) out[name] = values[name];
  }
  return out;
}

/**
 * Modal — `Form` holds all question fields; `onFinish` runs POST/PATCH (same as before visually).
 */
export default function AddDiscoverySectionsModal() {
  const { message } = AntdApp.useApp();
  const [form] = Form.useForm();
  const { get, post, patch } = useApi();
  const [open, setOpen] = useAtom(addDiscoverySectionsModalOpen);
  const selectedClient = useAtomValue(SelectedClient);
  const setDiscoverySectionQuestions = useSetAtom(
    discoverySectionQuestionsAtom,
  );

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const clientId = selectedClient?._id ?? selectedClient?.id;

  /** Re-render cards when these toggles change. */
  const wPersonalInsurance = Form.useWatch("personalInsuranceTab", form);
  const wTrusts = Form.useWatch("BusinessAsTrusts", form);
  const wSmsf = Form.useWatch("SMSFManagedFundsTab", form);
  const wInvestment = Form.useWatch("businessAsInvestmentTab", form);

  const cardWatchMap = useMemo(
    () => ({
      personalInsuranceTab: wPersonalInsurance,
      BusinessAsTrusts: wTrusts,
      SMSFManagedFundsTab: wSmsf,
      businessAsInvestmentTab: wInvestment,
    }),
    [wPersonalInsurance, wTrusts, wSmsf, wInvestment],
  );

  /**
   * `useApi()` returns new `get`/`post`/`patch` every render — do not put them in
   * `useCallback` deps or a load effect will re-run forever. Fetch only when
   * `open` or `clientId` changes.
   */
  const getRef = useRef(get);
  getRef.current = get;
  const messageRef = useRef(message);
  messageRef.current = message;
  const formRef = useRef(form);
  formRef.current = form;

  useEffect(() => {
    if (!open) return;

    if (!clientId) {
      formRef.current.resetFields();
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const res = await getRef.current(`/api/questions/${clientId}`);
        if (cancelled) return;
        const data = unwrapQuestionsResponse(res) ?? res;
        formRef.current.setFieldsValue(mergeLoadedPayload(clientId, data));
      } catch {
        if (cancelled) return;
        messageRef.current.error("Could not load discovery questions.");
        formRef.current.setFieldsValue(mergeLoadedPayload(clientId, null));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, clientId]);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const handleCardClick = (elem) => {
    const current = form.getFieldsValue(FORM_FIELD_NAMES);
    const base = { ...buildEmptyDefaults(clientId), ...current };
    form.setFieldsValue(applyQuestionToggle(base, elem));
  };

  const handleFinish = async (values) => {
    if (!clientId) {
      message.warning("Select a client from My Clients first.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...pickPayload(values),
        clientFK: clientId,
      };

      let saved;
      if (!payload._id) {
        saved = await post("/api/questions/Add", payload);
      } else {
        saved = await patch(`/api/questions/Update/${clientId}`, payload);
      }
      const normalized = unwrapQuestionsResponse(saved) ?? saved;
      if (normalized && typeof normalized === "object") {
        setDiscoverySectionQuestions(normalized);
      }
      message.success("Discovery sections saved.");
      handleClose();
    } catch (e) {
      console.error(e);
      message.error(
        e?.response?.data?.message || e?.message || "Could not save.",
      );
    } finally {
      setSaving(false);
    }
  };

  const isYes = (key) => (cardWatchMap[key] ?? "No") === "Yes";

  const hiddenFields = useMemo(
    () =>
      FORM_FIELD_NAMES.map((name) => (
        <Form.Item key={name} name={name} hidden>
          <Input />
        </Form.Item>
      )),
    [],
  );

  return (
    <Modal
      title={
        <span
          style={{
            fontFamily: "Arial, sans-serif",
            fontWeight: 700,
            fontSize: 18,
            color: "#111827",
          }}
        >
          Add Discovery Sections
        </span>
      }
      open={open}
      onCancel={handleClose}
      afterClose={() => form.resetFields()}
      footer={
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            paddingTop: 4,
            borderTop: "1px solid #f0f0f0",
            marginTop: 8,
          }}
        >
          <Button
            type="primary"
            htmlType="submit"
            form="add-discovery-sections-form"
            size="large"
            loading={saving}
            disabled={!clientId || loading}
            style={{
              background: PRIMARY_GREEN,
              borderColor: PRIMARY_GREEN,
              fontWeight: 700,
              borderRadius: 8,
              minWidth: 140,
            }}
          >
            Save and Exit
          </Button>
        </div>
      }
      width={560}
      centered
      destroyOnHidden
      closable
      maskClosable
      styles={{
        header: {
          marginBottom: 0,
          paddingBottom: 16,
          borderBottom: "1px solid #f0f0f0",
        },
        body: { paddingTop: 24, paddingBottom: 8, position: "relative" },
        content: { borderRadius: 12, overflow: "hidden" },
      }}
    >
      {!clientId ? (
        <Alert
          type="info"
          showIcon
          message="Select a household from My Clients (gear → Select) before adding sections."
        />
      ) : null}

      <Form
        id="add-discovery-sections-form"
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        style={{ margin: 0 }}
      >
        {hiddenFields}

        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: 200,
            }}
          >
            <Spin size="large" />
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
            }}
          >
            {SECTION_CARDS.map((elem) => {
              const on = isYes(elem.key);
              return (
                <button
                  key={elem.key}
                  type="button"
                  onClick={() => handleCardClick(elem)}
                  disabled={!clientId}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 12,
                    padding: "22px 16px",
                    minHeight: 120,
                    borderRadius: 12,
                    border: `2px solid ${
                      on ? CARD_BORDER_SELECTED : CARD_BORDER
                    }`,
                    background: on ? CARD_BG_SELECTED : "#fff",
                    cursor: clientId ? "pointer" : "not-allowed",
                    opacity: clientId ? 1 : 0.6,
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                >
                  <span style={{ fontSize: 32 }}>{elem.icon}</span>
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: 14,
                      color: "#111827",
                      textAlign: "center",
                      lineHeight: 1.25,
                    }}
                  >
                    {elem.title}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </Form>
    </Modal>
  );
}
