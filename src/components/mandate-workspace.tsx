"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import type {
  AuditEvent,
  PrivacyMode,
  ProcurementMandate,
} from "../domain/models";
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
  const idempotencyKey = useRef<string | null>(null);

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
    idempotencyKey.current = null;
  }

  function beginEdit(mandate: ProcurementMandate) {
    setMode("edit");
    setSelectedId(mandate.id);
    setForm(formFromMandate(mandate));
    setErrors({});
    setMessage("");
    idempotencyKey.current = null;
  }

  async function selectMandate(mandate: ProcurementMandate) {
    setMode("view");
    setSelectedId(mandate.id);
    setForm(formFromMandate(mandate));
    setErrors({});
    setMessage("");
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
          <span className="phase-tag">MANDATE WORKFLOW / PHASE 03</span>
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
        <span className="workflow-current" aria-current="step">
          <b>01</b> MANDATE
        </span>
        <span className="workflow-future"><b>02</b> OFFERS · LATER PHASE</span>
        <span className="workflow-future"><b>03</b> POLICY · LATER PHASE</span>
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
                Offer evaluation, policy decisions, approval actions, private inference, and settlement are not part of this phase.
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
        <span>PHASE 03 · MANDATE CREATION + EDITING</span>
        <span className="footer-note">NO SUPPLIERS CONTACTED · NO POLICY RUN · NO FUNDS MOVED</span>
      </footer>
    </main>
  );
}
