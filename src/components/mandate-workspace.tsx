"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import type {
  AuditEvent,
  Constraint,
  EvaluatedSupplierOffer,
  PrivacyMode,
  ProcurementMandate,
} from "../domain/models";
import type { BuyerRequestProposal } from "../domain/buyer-request-parser";
import {
  parseMandateTerms,
  type MandateValidationErrors,
} from "../domain/mandate-validation";

type WorkspaceMode = "view" | "create" | "edit";
type FormField =
  | "purpose"
  | "budget"
  | "asset"
  | "maxUnitPrice"
  | "minReliability"
  | "allowedDestinations"
  | "approvedRecipients"
  | "approvalThreshold"
  | "privacyMode";
type FormState = Record<FormField, string>;
type SaveResponse = {
  mandate: ProcurementMandate;
  auditEvents: AuditEvent[];
  error?: string;
  errors?: MandateValidationErrors;
};
type OfferRunResponse = {
  mode: "SIMULATED";
  policyAuthority: "SERVER";
  idempotency?: "NEW" | "REPLAYED";
  buyerProposal: BuyerRequestProposal;
  offers: EvaluatedSupplierOffer[];
  rejectedResponses: Array<{
    supplierAgent: string;
    fixtureType: "prompt-injection" | "malformed-response";
    reason: string;
  }>;
  error?: string;
};

const privacyModes: { value: PrivacyMode; label: string; note: string }[] = [
  {
    value: "simulated",
    label: "SIMULATED",
    note: "No private inference is connected in this phase.",
  },
  {
    value: "private-ai",
    label: "PRIVATE AI",
    note: "Preference only — no provider is connected.",
  },
  {
    value: "private-ai-attested",
    label: "PRIVATE AI + ATTESTATION",
    note: "Preference only — attestation is not available here.",
  },
];

function blankForm(): FormState {
  return {
    purpose: "",
    budget: "",
    asset: "USDC",
    maxUnitPrice: "",
    minReliability: "",
    allowedDestinations: "",
    approvedRecipients: "",
    approvalThreshold: "",
    privacyMode: "simulated",
  };
}

function formFromMandate(mandate: ProcurementMandate): FormState {
  return {
    purpose: mandate.purpose,
    budget: String(mandate.budget),
    asset: mandate.asset,
    maxUnitPrice:
      mandate.maxUnitPrice === undefined ? "" : String(mandate.maxUnitPrice),
    minReliability:
      mandate.minReliability === undefined
        ? ""
        : String(mandate.minReliability),
    allowedDestinations: mandate.allowedDestinations.join("\n"),
    approvedRecipients: mandate.approvedRecipients.join("\n"),
    approvalThreshold: String(mandate.approvalThreshold),
    privacyMode: mandate.privacyMode,
  };
}

function buyerPromptForMandate(mandate: ProcurementMandate): string {
  const parts = [
    `Purpose: ${mandate.purpose}`,
    `Budget: ${formatMoney(mandate.budget, mandate.asset)}`,
  ];
  if (mandate.maxUnitPrice !== undefined) {
    parts.push(`Max unit price: ${formatMoney(mandate.maxUnitPrice, mandate.asset)}`);
  }
  if (mandate.minReliability !== undefined) {
    parts.push(`Minimum reliability: ${(mandate.minReliability * 100).toFixed(0)}%`);
  }
  parts.push(
    `Allowed destination: ${mandate.allowedDestinations.join(", ")}`,
    `Approved recipients: ${mandate.approvedRecipients.join(", ")}`,
    `Approval threshold: ${formatMoney(mandate.approvalThreshold, mandate.asset)}`,
  );
  return parts.join("; ");
}

function constraintDisplay(constraint: Constraint): { label: string; value: string } {
  switch (constraint.kind) {
    case "budget":
      return { label: "Budget", value: formatMoney(constraint.amount, constraint.asset) };
    case "max_unit_price":
      return {
        label: "Maximum unit price",
        value: `${formatMoney(constraint.amount, constraint.asset)} / ${constraint.unit}`,
      };
    case "min_reliability":
      return { label: "Minimum reliability", value: `${(constraint.score * 100).toFixed(0)}%` };
    case "allowed_destinations":
      return { label: "Allowed destinations", value: constraint.chains.join(", ") };
    case "approved_recipients":
      return { label: "Approved recipients", value: constraint.recipients.join(", ") };
    case "approval_threshold":
      return {
        label: "Human approval threshold",
        value: formatMoney(constraint.amount, constraint.asset),
      };
  }
}

function splitList(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formPayload(form: FormState): unknown {
  const numberOrUndefined = (value: string) =>
    value.trim() === "" ? undefined : Number(value);
  return {
    purpose: form.purpose,
    budget: Number(form.budget),
    asset: form.asset,
    maxUnitPrice: numberOrUndefined(form.maxUnitPrice),
    minReliability: numberOrUndefined(form.minReliability),
    allowedDestinations: splitList(form.allowedDestinations),
    approvedRecipients: splitList(form.approvedRecipients),
    approvalThreshold: Number(form.approvalThreshold),
    privacyMode: form.privacyMode,
  };
}

function formatMoney(amount: number, asset: string): string {
  return `${new Intl.NumberFormat("en", { maximumFractionDigits: 8 }).format(amount)} ${asset}`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <span className="field-error" id={id}>
      {message}
    </span>
  ) : null;
}

export function MandateWorkspace({
  initialMandates,
  initialAuditEvents,
}: {
  initialMandates: ProcurementMandate[];
  initialAuditEvents: AuditEvent[];
}) {
  const [mandates, setMandates] = useState(initialMandates);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialMandates[0]?.id ?? null,
  );
  const [auditEvents, setAuditEvents] = useState(initialAuditEvents);
  const [mode, setMode] = useState<WorkspaceMode>(
    initialMandates.length > 0 ? "view" : "create",
  );
  const [form, setForm] = useState<FormState>(() =>
    initialMandates[0] ? formFromMandate(initialMandates[0]) : blankForm(),
  );
  const [errors, setErrors] = useState<MandateValidationErrors>({});
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [buyerRequest, setBuyerRequest] = useState(() =>
    initialMandates[0] ? buyerPromptForMandate(initialMandates[0]) : "",
  );
  const [offerRun, setOfferRun] = useState<OfferRunResponse | null>(null);
  const [offerMessage, setOfferMessage] = useState("");
  const [runningOffers, setRunningOffers] = useState(false);
  const idempotencyKey = useRef<string | null>(null);
  const offerRequestKey = useRef<string | null>(null);

  const selectedMandate = mandates.find((mandate) => mandate.id === selectedId) ?? null;
  const selectedPrivacy = privacyModes.find(
    (item) => item.value === selectedMandate?.privacyMode,
  );

  function updateField(field: FormField, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setMessage("");
  }

  function beginCreate() {
    setMode("create");
    setSelectedId(null);
    setForm(blankForm());
    setErrors({});
    setMessage("");
    setOfferRun(null);
    setOfferMessage("");
    offerRequestKey.current = null;
    setBuyerRequest("");
    idempotencyKey.current = null;
  }

  function beginEdit(mandate: ProcurementMandate) {
    setMode("edit");
    setSelectedId(mandate.id);
    setForm(formFromMandate(mandate));
    setErrors({});
    setMessage("");
    setOfferRun(null);
    setOfferMessage("");
    offerRequestKey.current = null;
    idempotencyKey.current = null;
  }

  async function selectMandate(mandate: ProcurementMandate) {
    setMode("view");
    setSelectedId(mandate.id);
    setForm(formFromMandate(mandate));
    setErrors({});
    setMessage("");
    setBuyerRequest(buyerPromptForMandate(mandate));
    setOfferRun(null);
    setOfferMessage("");
    offerRequestKey.current = null;
    try {
      const response = await fetch(`/api/mandates/${encodeURIComponent(mandate.id)}`);
      const payload = (await response.json()) as SaveResponse;
      if (!response.ok) {
        throw new Error(payload.error ?? "Could not load the audit trail.");
      }
      setAuditEvents(payload.auditEvents);
      setMandates((current) =>
        current.map((item) => (item.id === payload.mandate.id ? payload.mandate : item)),
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load the mandate.");
    }
  }

  function cancelForm() {
    setMode("view");
    setErrors({});
    setMessage("");
    idempotencyKey.current = null;
    if (selectedMandate) {
      setForm(formFromMandate(selectedMandate));
    } else if (mandates[0]) {
      setSelectedId(mandates[0].id);
      setForm(formFromMandate(mandates[0]));
    } else {
      setMode("create");
      setForm(blankForm());
    }
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseMandateTerms(formPayload(form));
    if (!parsed.success) {
      setErrors(parsed.errors);
      setMessage("Some mandate fields need attention.");
      return;
    }

    setSaving(true);
    setMessage("");
    idempotencyKey.current ??= globalThis.crypto.randomUUID();
    const isEditing = mode === "edit" && selectedId !== null;
    const url = isEditing
      ? `/api/mandates/${encodeURIComponent(selectedId as string)}`
      : "/api/mandates";
    try {
      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey.current,
        },
        body: JSON.stringify(parsed.data),
      });
      const payload = (await response.json()) as SaveResponse;
      if (!response.ok) {
        if (payload.errors) {
          setErrors(payload.errors);
        }
        throw new Error(payload.error ?? "The mandate could not be saved.");
      }

      setMandates((current) => {
        const exists = current.some((item) => item.id === payload.mandate.id);
        return exists
          ? current.map((item) =>
              item.id === payload.mandate.id ? payload.mandate : item,
            )
          : [payload.mandate, ...current];
      });
      setSelectedId(payload.mandate.id);
      setAuditEvents(payload.auditEvents);
      setForm(formFromMandate(payload.mandate));
      setBuyerRequest(buyerPromptForMandate(payload.mandate));
      setOfferRun(null);
      setMode("view");
      setErrors({});
      setMessage(
        isEditing
          ? "Mandate updated. Changed field names are recorded; values remain redacted."
          : "Mandate created. Purpose and recipient values remain redacted in the audit trail.",
      );
      idempotencyKey.current = null;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The mandate could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function simulateOffers() {
    if (!selectedMandate) return;
    setRunningOffers(true);
    setOfferMessage("");
    offerRequestKey.current ??= globalThis.crypto.randomUUID();
    try {
      const response = await fetch(
        `/api/mandates/${encodeURIComponent(selectedMandate.id)}/offers/simulate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": offerRequestKey.current,
          },
          body: JSON.stringify({ requestText: buyerRequest }),
        },
      );
      const payload = (await response.json()) as OfferRunResponse;
      if (!response.ok) {
        throw new Error(payload.error ?? "Could not generate offer proposals.");
      }
      setOfferRun(payload);
      offerRequestKey.current = null;
      setOfferMessage("Three local offers were evaluated against the saved mandate on the server; no supplier was contacted and no execution occurred.");
    } catch (error) {
      setOfferRun(null);
      setOfferMessage(
        error instanceof Error ? error.message : "Could not generate offer proposals.",
      );
    } finally {
      setRunningOffers(false);
    }
  }

  return (
    <main className="site-shell workspace-shell">
      <header className="topline">
        <Link className="wordmark" href="/" aria-label="PrivateSpend Network home">
          <span className="mark" aria-hidden="true">
            <span />
          </span>
          <span>PRIVATE SPEND NETWORK</span>
        </Link>
        <div className="header-meta">
          <span className="phase-tag">POLICY &amp; SECURITY / PHASE 05</span>
          <span className="workspace-tag">DEMO WORKSPACE · VOLATILE STORAGE</span>
        </div>
      </header>

      <section className="workspace-intro" aria-labelledby="page-title">
        <p className="eyebrow">PROCUREMENT CONTROL ROOM / 01</p>
        <h1 id="page-title">Set the boundaries before spend begins.</h1>
        <p className="lead">
          Create a mandate with explicit limits for budget, recipients, routes, and human review.
        </p>
      </section>

      <nav className="workflow-rail" aria-label="Procurement workflow stages">
        <span className="workflow-available">
          <b>01</b> MANDATE
        </span>
        <span className="workflow-available"><b>02</b> OFFERS</span>
        <span className="workflow-current" aria-current="step"><b>03</b> POLICY</span>
        <span className="workflow-future"><b>04</b> APPROVAL · LATER PHASE</span>
        <span className="workflow-future"><b>05</b> SETTLEMENT · LATER PHASE</span>
        <span className="workflow-available"><b>06</b> AUDIT TRAIL · AVAILABLE</span>
      </nav>

      <div className="workspace-grid">
        <aside className="mandate-index" aria-labelledby="mandate-list-title">
          <div className="section-heading">
            <p className="eyebrow">WORKSPACE</p>
            <h2 id="mandate-list-title">Mandates</h2>
          </div>
          <button className="button button-primary new-mandate" type="button" onClick={beginCreate}>
            <span aria-hidden="true">+</span> New mandate
          </button>
          <div className="mandate-list" role="list" aria-label="Saved mandates">
            {mandates.length === 0 ? (
              <p className="empty-state">No mandates yet. Create one to begin.</p>
            ) : (
              mandates.map((mandate) => (
                <button
                  className={`mandate-list-item${selectedId === mandate.id ? " is-selected" : ""}`}
                  type="button"
                  key={mandate.id}
                  role="listitem"
                  aria-current={selectedId === mandate.id && mode !== "create" ? "true" : undefined}
                  onClick={() => void selectMandate(mandate)}
                >
                  <span className="mandate-item-top">
                    <span className={`state-pill state-${mandate.status}`}>{mandate.status}</span>
                    <span className="mono item-budget">{formatMoney(mandate.budget, mandate.asset)}</span>
                  </span>
                  <span className="mandate-item-title">{mandate.purpose}</span>
                  <span className="mono mandate-item-id">{mandate.id}</span>
                </button>
              ))
            )}
          </div>
          <p className="aside-note">
            Records live in this server process and reset when it restarts. This is not durable storage.
          </p>
        </aside>

        <section className="mandate-panel" aria-labelledby="mandate-panel-title">
          <div className="panel-topline">
            <div>
              <p className="eyebrow">MANDATE / {mode === "create" ? "NEW" : mode === "edit" ? "EDIT" : "DETAILS"}</p>
              <h2 id="mandate-panel-title">
                {mode === "create"
                  ? "Create a mandate"
                  : mode === "edit"
                    ? "Edit mandate terms"
                    : selectedMandate?.purpose ?? "No mandate selected"}
              </h2>
            </div>
            {mode === "view" && selectedMandate ? (
              <button className="button button-secondary" type="button" onClick={() => beginEdit(selectedMandate)}>
                Edit terms
              </button>
            ) : null}
          </div>

          {mode === "view" && selectedMandate ? (
            <div className="mandate-detail">
              <div className="detail-status-row">
                <span className={`state-pill state-${selectedMandate.status}`}>{selectedMandate.status}</span>
                <span className="mono detail-id">{selectedMandate.id}</span>
              </div>
              <div className="detail-group">
                <p className="eyebrow">PURPOSE</p>
                <p className="detail-purpose">{selectedMandate.purpose}</p>
              </div>
              <div className="detail-grid">
                <div className="detail-cell">
                  <span className="eyebrow">TOTAL BUDGET</span>
                  <strong className="mono">{formatMoney(selectedMandate.budget, selectedMandate.asset)}</strong>
                </div>
                <div className="detail-cell">
                  <span className="eyebrow">ASSET</span>
                  <strong className="mono">{selectedMandate.asset}</strong>
                </div>
                <div className="detail-cell">
                  <span className="eyebrow">MAX UNIT PRICE</span>
                  <strong className="mono">
                    {selectedMandate.maxUnitPrice === undefined
                      ? "No limit set"
                      : formatMoney(selectedMandate.maxUnitPrice, selectedMandate.asset)}
                  </strong>
                </div>
                <div className="detail-cell">
                  <span className="eyebrow">MIN. RELIABILITY</span>
                  <strong className="mono">
                    {selectedMandate.minReliability === undefined
                      ? "No minimum"
                      : `${(selectedMandate.minReliability * 100).toFixed(0)}%`}
                  </strong>
                </div>
                <div className="detail-cell">
                  <span className="eyebrow">APPROVAL THRESHOLD</span>
                  <strong className="mono">{formatMoney(selectedMandate.approvalThreshold, selectedMandate.asset)}</strong>
                </div>
                <div className="detail-cell">
                  <span className="eyebrow">PRIVACY MODE</span>
                  <strong className="mono">{selectedPrivacy?.label ?? selectedMandate.privacyMode}</strong>
                </div>
              </div>
              <div className="detail-group list-detail">
                <p className="eyebrow">ALLOWED CHAINS</p>
                <ul className="tag-list">
                  {selectedMandate.allowedDestinations.map((chain) => <li key={chain}>{chain}</li>)}
                </ul>
              </div>
              <div className="detail-group list-detail">
                <p className="eyebrow">APPROVED RECIPIENTS</p>
                <ul className="tag-list">
                  {selectedMandate.approvedRecipients.map((recipient) => <li key={recipient}>{recipient}</li>)}
                </ul>
              </div>
              <div className="privacy-notice">
                <strong>{selectedPrivacy?.label ?? "PRIVACY MODE"}</strong>
                <span>{selectedPrivacy?.note ?? "This value is stored as a mandate preference only."}</span>
              </div>
              <p className="phase-boundary">
                Offers are proposals only. Policy is evaluated deterministically on the server; human approval, private inference, and settlement are not implemented here.
              </p>
            </div>
          ) : (
            <form className="mandate-form" onSubmit={(event) => void submitForm(event)} noValidate>
              <p className="form-intro">
                Every constraint is checked in your browser and revalidated by the server before it is stored.
              </p>
              <div className="form-field full-field">
                <label htmlFor="purpose">Procurement purpose</label>
                <textarea
                  id="purpose"
                  name="purpose"
                  rows={2}
                  maxLength={240}
                  placeholder="e.g. Cloud compute capacity for one month"
                  value={form.purpose}
                  onChange={(event) => updateField("purpose", event.target.value)}
                  aria-invalid={Boolean(errors.purpose)}
                  aria-describedby={errors.purpose ? "purpose-error" : "purpose-hint"}
                />
                <span className="field-hint" id="purpose-hint">Keep purpose concise; it is not copied into audit details.</span>
                <FieldError id="purpose-error" message={errors.purpose} />
              </div>

              <div className="form-two-column">
                <div className="form-field">
                  <label htmlFor="budget">Total budget</label>
                  <div className="input-suffix">
                    <input id="budget" name="budget" type="number" min="0.00000001" step="any" value={form.budget} onChange={(event) => updateField("budget", event.target.value)} aria-invalid={Boolean(errors.budget)} aria-describedby={errors.budget ? "budget-error" : "budget-hint"} />
                    <span className="mono">{form.asset || "ASSET"}</span>
                  </div>
                  <span className="field-hint" id="budget-hint">Must be greater than zero.</span>
                  <FieldError id="budget-error" message={errors.budget} />
                </div>
                <div className="form-field">
                  <label htmlFor="asset">Settlement asset</label>
                  <input id="asset" name="asset" type="text" maxLength={16} autoCapitalize="characters" placeholder="USDC" value={form.asset} onChange={(event) => updateField("asset", event.target.value)} aria-invalid={Boolean(errors.asset)} aria-describedby={errors.asset ? "asset-error" : undefined} />
                  <FieldError id="asset-error" message={errors.asset} />
                </div>
                <div className="form-field">
                  <label htmlFor="maxUnitPrice">Maximum unit price <span className="optional-label">OPTIONAL</span></label>
                  <div className="input-suffix">
                    <input id="maxUnitPrice" name="maxUnitPrice" type="number" min="0.00000001" step="any" value={form.maxUnitPrice} onChange={(event) => updateField("maxUnitPrice", event.target.value)} aria-invalid={Boolean(errors.maxUnitPrice)} aria-describedby={errors.maxUnitPrice ? "maxUnitPrice-error" : undefined} />
                    <span className="mono">{form.asset || "ASSET"}</span>
                  </div>
                  <FieldError id="maxUnitPrice-error" message={errors.maxUnitPrice} />
                </div>
                <div className="form-field">
                  <label htmlFor="minReliability">Minimum reliability <span className="optional-label">OPTIONAL</span></label>
                  <div className="input-suffix">
                    <input id="minReliability" name="minReliability" type="number" min="0" max="1" step="0.01" placeholder="0.95" value={form.minReliability} onChange={(event) => updateField("minReliability", event.target.value)} aria-invalid={Boolean(errors.minReliability)} aria-describedby={errors.minReliability ? "minReliability-error" : "reliability-hint"} />
                    <span className="mono">0–1</span>
                  </div>
                  <span className="field-hint" id="reliability-hint">Enter a score from 0 to 1.</span>
                  <FieldError id="minReliability-error" message={errors.minReliability} />
                </div>
                <div className="form-field">
                  <label htmlFor="approvalThreshold">Human approval threshold</label>
                  <div className="input-suffix">
                    <input id="approvalThreshold" name="approvalThreshold" type="number" min="0" step="any" value={form.approvalThreshold} onChange={(event) => updateField("approvalThreshold", event.target.value)} aria-invalid={Boolean(errors.approvalThreshold)} aria-describedby={errors.approvalThreshold ? "approvalThreshold-error" : "threshold-hint"} />
                    <span className="mono">{form.asset || "ASSET"}</span>
                  </div>
                  <span className="field-hint" id="threshold-hint">Cannot exceed the total budget.</span>
                  <FieldError id="approvalThreshold-error" message={errors.approvalThreshold} />
                </div>
              </div>

              <div className="form-two-column list-fields">
                <div className="form-field">
                  <label htmlFor="allowedDestinations">Allowed destination chains</label>
                  <textarea id="allowedDestinations" name="allowedDestinations" rows={3} placeholder={"near-testnet\nethereum-sepolia"} value={form.allowedDestinations} onChange={(event) => updateField("allowedDestinations", event.target.value)} aria-invalid={Boolean(errors.allowedDestinations)} aria-describedby={errors.allowedDestinations ? "allowedDestinations-error" : "chains-hint"} />
                  <span className="field-hint" id="chains-hint">One chain per line. No spaces or duplicate entries.</span>
                  <FieldError id="allowedDestinations-error" message={errors.allowedDestinations} />
                </div>
                <div className="form-field">
                  <label htmlFor="approvedRecipients">Approved recipients</label>
                  <textarea id="approvedRecipients" name="approvedRecipients" rows={3} placeholder={"vendor-account.near\n0x…"} value={form.approvedRecipients} onChange={(event) => updateField("approvedRecipients", event.target.value)} aria-invalid={Boolean(errors.approvedRecipients)} aria-describedby={errors.approvedRecipients ? "approvedRecipients-error" : "recipients-hint"} />
                  <span className="field-hint" id="recipients-hint">One address per line; values are omitted from audit details.</span>
                  <FieldError id="approvedRecipients-error" message={errors.approvedRecipients} />
                </div>
              </div>

              <fieldset
                className="privacy-fieldset"
                aria-invalid={Boolean(errors.privacyMode)}
                aria-describedby={errors.privacyMode ? "privacy-mode-hint privacyMode-error" : "privacy-mode-hint"}
              >
                <legend>Privacy mode</legend>
                <p className="field-hint" id="privacy-mode-hint">This is a mandate preference. No AI provider or attestation is connected in this phase.</p>
                <div className="privacy-options">
                  {privacyModes.map((item) => (
                    <label className={`privacy-option${form.privacyMode === item.value ? " is-checked" : ""}`} key={item.value}>
                      <input type="radio" name="privacyMode" value={item.value} checked={form.privacyMode === item.value} onChange={(event) => updateField("privacyMode", event.target.value)} />
                      <span><strong>{item.label}</strong><small>{item.note}</small></span>
                    </label>
                  ))}
                </div>
                <FieldError id="privacyMode-error" message={errors.privacyMode} />
              </fieldset>

              <div className="form-actions">
                <button className="button button-primary" type="submit" disabled={saving}>
                  {saving ? "Saving…" : mode === "edit" ? "Save mandate changes" : "Create mandate"}
                </button>
                {mode === "edit" || mandates.length > 0 ? (
                  <button className="button button-secondary" type="button" onClick={cancelForm} disabled={saving}>Cancel</button>
                ) : null}
                <span className="form-privacy-note">Only changed field names enter the audit trail.</span>
              </div>
            </form>
          )}
          {mode === "view" && selectedMandate ? (
            <section className="offer-workspace" aria-labelledby="offers-title">
              <div className="offer-section-heading">
                <div>
                  <p className="eyebrow">BUYER AGENT / DETERMINISTIC PARSER</p>
                <h3 id="offers-title">Compare policy-checked proposals</h3>
                </div>
                <span className="state-pill">SIMULATED</span>
              </div>
              <p className="offer-intro">
                Parse a request into non-binding suggestions, then evaluate three local offers against the saved mandate on the server. No supplier is contacted.
              </p>
              <div className="form-field buyer-request-field">
                <label htmlFor="buyer-request">Buyer request</label>
                <textarea
                  id="buyer-request"
                  name="buyer-request"
                  rows={4}
                  maxLength={2_000}
                  value={buyerRequest}
                  aria-describedby="buyer-request-hint"
                  onChange={(event) => {
                    setBuyerRequest(event.target.value);
                    setOfferRun(null);
                    setOfferMessage("");
                    offerRequestKey.current = null;
                  }}
                />
                <span className="field-hint" id="buyer-request-hint">
                  Deterministic parsing only. Suggestions do not update the saved mandate or authorize spend.
                </span>
              </div>
              <div className="offer-actions">
                <button
                  className="button button-primary"
                  type="button"
                  onClick={() => void simulateOffers()}
                  disabled={runningOffers}
                >
                  {runningOffers ? "Running server-side checks…" : "Parse request + evaluate offers"}
                </button>
                <span className="offer-simulation-note">LOCAL FIXTURES · NO EXTERNAL CALLS</span>
              </div>
              {offerMessage ? (
                <p className="offer-message" role="status" aria-live="polite">{offerMessage}</p>
              ) : null}

              {!offerRun ? (
                <p className="empty-state offer-empty-state">
                  Run the comparison to inspect the typed buyer proposal, supplier evidence, and any rejected response.
                </p>
              ) : (
                <>
                  <section className="buyer-proposal" aria-labelledby="proposal-title">
                    <div className="offer-section-heading">
                      <div>
                        <p className="eyebrow">HUMAN-REVIEWABLE SUGGESTION</p>
                        <h4 id="proposal-title">Typed buyer constraints</h4>
                      </div>
                      <span className="state-pill">NOT APPLIED</span>
                    </div>
                    <p className="proposal-provenance">
                      Parsed fields: {offerRun.buyerProposal.extractedFields.length > 0
                        ? offerRun.buyerProposal.extractedFields.join(", ")
                        : "none"}. Other values are inherited from the saved mandate.
                    </p>
                    <dl className="proposal-constraints">
                      {offerRun.buyerProposal.constraints.map((constraint) => {
                        const item = constraintDisplay(constraint);
                        return (
                          <div className="proposal-constraint" key={constraint.id}>
                            <dt>{item.label}</dt>
                            <dd>{item.value}</dd>
                          </div>
                        );
                      })}
                    </dl>
                    {offerRun.buyerProposal.warnings.map((warning) => (
                      <p className="proposal-warning" key={warning}>{warning}</p>
                    ))}
                  </section>

                  <section className="offer-comparison" aria-labelledby="comparison-title">
                    <div className="offer-section-heading">
                      <div>
                        <p className="eyebrow">SUPPLIER AGENTS / THREE DETERMINISTIC FIXTURES</p>
                        <h4 id="comparison-title">Offer comparison</h4>
                      </div>
                      <span className="state-pill state-pass">SERVER POLICY APPLIED</span>
                    </div>
                    <div className="offer-list">
                      {offerRun.offers.map((offer) => (
                        <article className="offer-card" key={offer.id}>
                          <div className="offer-card-heading">
                            <div>
                              <p className="eyebrow">SUPPLIER PROPOSAL</p>
                              <h5>{offer.supplierAgent}</h5>
                            </div>
                            <span className={`state-pill state-${offer.policyResult}`}>
                              {offer.policyResult === "review" ? "REVIEW REQUIRED" : offer.policyResult.toUpperCase()}
                            </span>
                          </div>
                          <dl className="offer-facts">
                            <div><dt>Total amount</dt><dd>{formatMoney(offer.amount, offer.asset)}</dd></div>
                            <div><dt>Unit price</dt><dd>{offer.unitPrice === undefined ? "Not supplied" : `${formatMoney(offer.unitPrice, offer.asset)} / unit`}</dd></div>
                            <div><dt>Reliability claim</dt><dd>{(offer.reliabilityScore * 100).toFixed(0)}%</dd></div>
                            <div><dt>Destination</dt><dd>{offer.destinationChain}</dd></div>
                            <div><dt>Proposed recipient</dt><dd>{offer.recipient}</dd></div>
                            <div><dt>Offer expires</dt><dd>{formatDate(offer.expiresAt)}</dd></div>
                            <div><dt>Nonce</dt><dd className="mono offer-nonce">{offer.nonce}</dd></div>
                          </dl>
                          <div className="offer-evidence-group offer-policy-group">
                            <p className="offer-detail-label">DETERMINISTIC POLICY · SERVER-EVALUATED</p>
                            {offer.policyEvaluation.reasons.length > 0 ? (
                              <ul>{offer.policyEvaluation.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
                            ) : <p>All configured deterministic policy checks passed.</p>}
                            {offer.policyEvaluation.approvalRequired ? (
                              <p className="policy-approval-note">HUMAN APPROVAL REQUIRED · No approval action is available in this phase.</p>
                            ) : null}
                          </div>
                          <div className="offer-evidence-group">
                            <p className="offer-detail-label">EVIDENCE</p>
                            <ul>{offer.evidence.map((item) => <li key={item}>{item}</li>)}</ul>
                          </div>
                          <div className="offer-evidence-group offer-risk-group">
                            <p className="offer-detail-label">SUPPLIER RISK NOTES · UNVERIFIED</p>
                            {offer.riskReasons.length > 0 ? (
                              <ul>{offer.riskReasons.map((item) => <li key={item}>{item}</li>)}</ul>
                            ) : <p>No supplier risk notes provided.</p>}
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>

                  <section className="rejected-responses" aria-labelledby="rejected-title">
                    <div className="offer-section-heading">
                      <div>
                        <p className="eyebrow">SCHEMA VALIDATION</p>
                        <h4 id="rejected-title">Rejected responses</h4>
                      </div>
                    </div>
                    {offerRun.rejectedResponses.map((item) => (
                      <div className="rejected-response" key={`${item.supplierAgent}-${item.fixtureType}`}>
                        <strong>{item.fixtureType === "prompt-injection" ? "PROMPT-INJECTION FIXTURE REJECTED" : "MALFORMED RESPONSE REJECTED"}</strong>
                        <span>{item.supplierAgent}</span>
                        <p>{item.reason}</p>
                      </div>
                    ))}
                    {offerRun.rejectedResponses.length === 0 ? (
                      <p className="empty-state">No invalid responses in this run.</p>
                    ) : null}
                  </section>
                  <p className="phase-boundary">
                    These are local demo proposals. Policy outcomes are deterministic and computed on the server from the saved mandate; supplier risk notes remain unverified. No approval or execution action exists.
                  </p>
                </>
              )}
            </section>
          ) : null}
          <p className="form-message" role="status" aria-live="polite">{message}</p>
        </section>

        <aside className="audit-panel" aria-labelledby="audit-title">
          <div className="section-heading">
            <p className="eyebrow">EVIDENCE</p>
            <h2 id="audit-title">Audit trail</h2>
          </div>
          {!selectedMandate || auditEvents.length === 0 ? (
            <p className="empty-state">Creation and changes will appear here with sensitive values redacted.</p>
          ) : (
            <ol className="audit-timeline">
              {[...auditEvents].reverse().map((event) => (
                <li className="audit-event" key={event.id}>
                  <span className="audit-node" aria-hidden="true" />
                  <p className="mono audit-time">{formatDate(event.occurredAt)}</p>
                  <p className="audit-event-type">{event.eventType.replaceAll("_", " ")}</p>
                  <p className="audit-summary">{event.summary}</p>
                  <span className="audit-redacted">{event.actor.toUpperCase()} · REDACTED</span>
                </li>
              ))}
            </ol>
          )}
          <div className="audit-privacy">
            <span className="status-dot" aria-hidden="true" />
            <p>Audit entries record changed field names, not purpose, budget, chain, or recipient values.</p>
          </div>
        </aside>
      </div>

      <footer className="footer-line workspace-footer">
        <span>PHASE 05 · POLICY + SECURITY</span>
        <span className="footer-note">NO SUPPLIERS CONTACTED · NO APPROVAL OR EXECUTION · NO FUNDS MOVED</span>
      </footer>
    </main>
  );
}
