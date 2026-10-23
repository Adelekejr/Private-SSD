import { createHash, randomUUID } from "node:crypto";
import type {
  EvaluatedSupplierOffer,
  ProcurementMandate,
  SettlementOfferSnapshot,
  SimulatedSettlementQuote,
  SimulatedSettlementReceipt,
  PolicyEvaluation,
  SupplierOffer,
} from "../../src/domain/models";
import { checkOfferBeforeExecution, type PreExecutionCheck } from "../policy/policy-engine";
import { assertSettlementStatusTransition } from "../../src/domain/transitions";
import {
  SettlementLifecycleError,
  type CreateSettlementQuoteInput,
  type SettlementActionInput,
  type SettlementAdapter,
  type SettlementAdapterResult,
} from "./settlement-adapter";

const QUOTE_TTL_MS = 5 * 60 * 1_000;
const MAX_RECORDS = 500;
const MAX_IDEMPOTENCY_KEYS = 2_000;

interface StoredQuote {
  quote: SimulatedSettlementQuote;
  offer: EvaluatedSupplierOffer;
}

interface IdempotencyRecord {
  digest: string;
  quoteId: string;
}

function digest(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function snapshot(offer: EvaluatedSupplierOffer): SettlementOfferSnapshot {
  return {
    id: offer.id,
    supplierAgent: offer.supplierAgent,
    amount: offer.amount,
    asset: offer.asset,
    destinationChain: offer.destinationChain,
    recipient: offer.recipient,
    expiresAt: offer.expiresAt,
  };
}

function toUntrustedSupplierResponse(offer: SupplierOffer): Record<string, unknown> {
  return {
    id: offer.id,
    mandateId: offer.mandateId,
    supplierAgent: offer.supplierAgent,
    amount: offer.amount,
    ...(offer.unitPrice === undefined ? {} : { unitPrice: offer.unitPrice }),
    asset: offer.asset,
    destinationChain: offer.destinationChain,
    recipient: offer.recipient,
    reliabilityScore: offer.reliabilityScore,
    evidence: offer.evidence,
    riskNotes: offer.riskReasons,
    expiresAt: offer.expiresAt,
    nonce: offer.nonce,
  };
}

function validClock(now: Date): void {
  if (!Number.isFinite(now.getTime())) {
    throw new SettlementLifecycleError("INVALID_CLOCK", "A valid server clock is required.", 500);
  }
}

function isThresholdOnlyReview(evaluation: PolicyEvaluation): boolean {
  return (
    evaluation.result === "review" &&
    evaluation.approvalRequired &&
    evaluation.reasons.length === 1 &&
    evaluation.reasons[0]?.toLowerCase().includes("approval threshold") === true
  );
}

function matchesCurrentPolicy(
  offer: EvaluatedSupplierOffer,
  current: PreExecutionCheck,
): boolean {
  if (
    offer.policyResult === "pass" &&
    offer.policyEvaluation.result === "pass" &&
    !offer.policyEvaluation.approvalRequired
  ) {
    return current.status === "eligible" && current.policyEvaluation.result === "pass";
  }
  if (offer.policyResult === "review" && isThresholdOnlyReview(offer.policyEvaluation)) {
    return current.status === "approval_required" &&
      isThresholdOnlyReview(current.policyEvaluation);
  }
  return false;
}

/** Local demonstration adapter. It never contacts a provider, wallet, chain, or funds. */
export class SimulatedSettlementAdapter implements SettlementAdapter {
  private readonly records = new Map<string, StoredQuote>();
  private readonly idempotency = new Map<string, IdempotencyRecord>();
  private readonly consumedNonces = new Set<string>();

  createQuote(input: CreateSettlementQuoteInput): SettlementAdapterResult {
    const now = input.now ?? new Date();
    validClock(now);
    const requestDigest = digest({
      mandateId: input.mandate.id,
      offer: input.offer,
    });
    const replay = this.replay("quote", input.mandate.id, input.idempotencyKey, requestDigest);
    if (replay) return replay;

    if (input.offer.mandateId !== input.mandate.id) {
      throw new SettlementLifecycleError(
        "POLICY_NOT_ELIGIBLE",
        "The offer does not belong to this mandate.",
        422,
      );
    }
    const currentCheck = this.policyCheck(input.mandate, input.offer, now);
    if (!matchesCurrentPolicy(input.offer, currentCheck)) {
      throw new SettlementLifecycleError(
        "POLICY_NOT_ELIGIBLE",
        currentCheck.status === "blocked"
          ? "Current server policy blocks this offer from simulated settlement."
          : "Only a current PASS or a threshold-only REVIEW awaiting explicit human approval can receive a simulated quote.",
        422,
      );
    }

    const offerExpiry = Date.parse(input.offer.expiresAt);
    const quoteExpiry = Math.min(offerExpiry, now.getTime() + QUOTE_TTL_MS);
    if (!Number.isFinite(offerExpiry) || offerExpiry <= now.getTime() || quoteExpiry <= now.getTime()) {
      throw new SettlementLifecycleError("OFFER_EXPIRED", "The supplier offer has expired.", 409);
    }

    assertSettlementStatusTransition("not_started", "quoted");
    const quote: SimulatedSettlementQuote = {
      id: `sim-quote-${randomUUID()}`,
      mandateId: input.mandate.id,
      offer: snapshot(input.offer),
      amount: input.offer.amount,
      asset: input.offer.asset,
      destinationChain: input.offer.destinationChain,
      recipient: input.offer.recipient,
      offerExpiresAt: input.offer.expiresAt,
      quoteExpiresAt: new Date(quoteExpiry).toISOString(),
      createdAt: now.toISOString(),
      mode: "SIMULATED",
      policyResult: input.offer.policyResult === "review" ? "review" : "pass",
      status: "quoted",
      approvalStatus: "pending",
    };
    this.records.set(quote.id, { quote, offer: structuredClone(input.offer) });
    this.register("quote", input.mandate.id, input.idempotencyKey, requestDigest, quote.id);
    this.prune(input.now ?? now);
    return { quote: structuredClone(quote), disposition: "created" };
  }

  approve(input: SettlementActionInput): SettlementAdapterResult {
    const now = input.now ?? new Date();
    validClock(now);
    const requestDigest = digest({ mandateId: input.mandate.id, quoteId: input.quoteId });
    const replay = this.replay("approve", input.mandate.id, input.idempotencyKey, requestDigest);
    if (replay) return replay;

    const stored = this.requireRecord(input.mandate.id, input.quoteId);
    if (stored.quote.status === "approved" || stored.quote.status === "simulated") {
      return this.unchanged("approve", input.mandate.id, input.idempotencyKey, requestDigest, stored.quote);
    }
    if (stored.quote.status !== "quoted") {
      throw new SettlementLifecycleError("INVALID_STATUS", "This quote is not awaiting approval.");
    }
    this.recheckQuote(stored, input.mandate, now);

    assertSettlementStatusTransition("quoted", "approved");
    stored.quote = {
      ...stored.quote,
      status: "approved",
      approvalStatus: "approved",
      approvedAt: now.toISOString(),
    };
    this.register("approve", input.mandate.id, input.idempotencyKey, requestDigest, input.quoteId);
    return { quote: structuredClone(stored.quote), disposition: "approved" };
  }

  execute(input: SettlementActionInput): SettlementAdapterResult {
    const now = input.now ?? new Date();
    validClock(now);
    const requestDigest = digest({ mandateId: input.mandate.id, quoteId: input.quoteId });
    const replay = this.replay("execute", input.mandate.id, input.idempotencyKey, requestDigest);
    if (replay) return replay;

    const stored = this.requireRecord(input.mandate.id, input.quoteId);
    if (stored.quote.status === "simulated") {
      return this.unchanged("execute", input.mandate.id, input.idempotencyKey, requestDigest, stored.quote);
    }
    if (stored.quote.status !== "approved" || stored.quote.approvalStatus !== "approved") {
      throw new SettlementLifecycleError(
        "APPROVAL_REQUIRED",
        "A human must explicitly approve this simulated quote before the simulation can run.",
        403,
      );
    }
    this.recheckQuote(stored, input.mandate, now);

    assertSettlementStatusTransition("approved", "simulated");
    const receipt: SimulatedSettlementReceipt = {
      id: `sim-receipt-${randomUUID()}`,
      issuedAt: now.toISOString(),
      status: "SIMULATED",
      simulated: true,
      moneyMoved: false,
      message: "Simulation only; no funds were transferred, reserved, or signed.",
    };
    stored.quote = { ...stored.quote, status: "simulated", receipt };
    if (stored.offer.nonce) this.consumedNonces.add(stored.offer.nonce);
    this.register("execute", input.mandate.id, input.idempotencyKey, requestDigest, input.quoteId);
    return { quote: structuredClone(stored.quote), disposition: "simulated" };
  }

  getQuote(mandateId: string, quoteId: string): SimulatedSettlementQuote | null {
    const stored = this.records.get(quoteId);
    if (!stored || stored.quote.mandateId !== mandateId) return null;
    return structuredClone(stored.quote);
  }

  getConsumedNonces(): ReadonlySet<string> {
    return new Set(this.consumedNonces);
  }

  clear(): void {
    this.records.clear();
    this.idempotency.clear();
    this.consumedNonces.clear();
  }

  private policyCheck(
    mandate: ProcurementMandate,
    offer: EvaluatedSupplierOffer,
    now: Date,
  ): PreExecutionCheck {
    return checkOfferBeforeExecution(mandate, toUntrustedSupplierResponse(offer), {
      now,
      consumedNonces: this.consumedNonces,
    });
  }

  private recheckQuote(stored: StoredQuote, mandate: ProcurementMandate, now: Date): void {
    const { quote, offer } = stored;
    if (quote.mandateId !== mandate.id || offer.mandateId !== mandate.id) {
      throw new SettlementLifecycleError("MANDATE_MISMATCH", "The quote does not belong to this mandate.", 404);
    }
    if (
      quote.offer.id !== offer.id ||
      quote.amount !== offer.amount ||
      quote.asset !== offer.asset ||
      quote.destinationChain !== offer.destinationChain ||
      quote.recipient !== offer.recipient ||
      quote.offerExpiresAt !== offer.expiresAt ||
      quote.policyResult !== offer.policyResult
    ) {
      throw new SettlementLifecycleError("QUOTE_MISMATCH", "The stored quote no longer matches its validated offer.", 409);
    }
    if (Date.parse(quote.quoteExpiresAt) <= now.getTime() || Date.parse(quote.offerExpiresAt) <= now.getTime()) {
      throw new SettlementLifecycleError("QUOTE_EXPIRED", "The simulated quote or source offer has expired.", 409);
    }
    if (
      !Number.isFinite(quote.amount) ||
      quote.amount <= 0 ||
      quote.amount !== offer.amount ||
      quote.amount > mandate.budget
    ) {
      throw new SettlementLifecycleError("AMOUNT_INVALID", "The quote amount does not satisfy the current mandate.", 422);
    }
    if (
      quote.asset.toUpperCase() !== mandate.asset.toUpperCase() ||
      quote.asset !== offer.asset
    ) {
      throw new SettlementLifecycleError("ASSET_INVALID", "The quote asset does not satisfy the current mandate.", 422);
    }
    if (
      quote.destinationChain !== offer.destinationChain ||
      !mandate.allowedDestinations.some(
        (chain) => chain.trim().toLowerCase() === quote.destinationChain.trim().toLowerCase(),
      )
    ) {
      throw new SettlementLifecycleError("DESTINATION_INVALID", "The quote destination is not allowed by the current mandate.", 422);
    }
    if (
      quote.recipient !== offer.recipient ||
      !mandate.approvedRecipients.includes(quote.recipient)
    ) {
      throw new SettlementLifecycleError("RECIPIENT_INVALID", "The quote recipient is not approved by the current mandate.", 422);
    }
    const currentCheck = this.policyCheck(mandate, offer, now);
    if (!matchesCurrentPolicy(offer, currentCheck)) {
      throw new SettlementLifecycleError(
        "POLICY_NOT_ELIGIBLE",
        currentCheck.status === "blocked"
          ? "Current server policy blocks this offer from simulated settlement."
          : "The offer no longer has the same eligible policy outcome; create a new offer run.",
        422,
      );
    }
  }

  private requireRecord(mandateId: string, quoteId: string): StoredQuote {
    const stored = this.records.get(quoteId);
    if (!stored || stored.quote.mandateId !== mandateId) {
      throw new SettlementLifecycleError("QUOTE_NOT_FOUND", "Simulated quote not found.", 404);
    }
    return stored;
  }

  private replay(
    action: string,
    mandateId: string,
    idempotencyKey: string,
    requestDigest: string,
  ): SettlementAdapterResult | null {
    const key = `${action}:${mandateId}:${idempotencyKey}`;
    const existing = this.idempotency.get(key);
    if (!existing) return null;
    if (existing.digest !== requestDigest) {
      throw new SettlementLifecycleError(
        "IDEMPOTENCY_CONFLICT",
        "The idempotency key was already used for a different settlement request.",
        409,
      );
    }
    const stored = this.records.get(existing.quoteId);
    if (!stored) {
      throw new SettlementLifecycleError("QUOTE_NOT_FOUND", "The simulated quote is no longer available.", 404);
    }
    return { quote: structuredClone(stored.quote), disposition: "replayed" };
  }

  private unchanged(
    action: string,
    mandateId: string,
    idempotencyKey: string,
    requestDigest: string,
    quote: SimulatedSettlementQuote,
  ): SettlementAdapterResult {
    this.register(action, mandateId, idempotencyKey, requestDigest, quote.id);
    return { quote: structuredClone(quote), disposition: "unchanged" };
  }

  private register(
    action: string,
    mandateId: string,
    idempotencyKey: string,
    requestDigest: string,
    quoteId: string,
  ): void {
    const key = `${action}:${mandateId}:${idempotencyKey}`;
    this.idempotency.set(key, { digest: requestDigest, quoteId });
    while (this.idempotency.size > MAX_IDEMPOTENCY_KEYS) {
      const oldest = this.idempotency.keys().next().value as string | undefined;
      if (!oldest) break;
      this.idempotency.delete(oldest);
    }
  }

  private prune(now: Date): void {
    const cutoff = now.getTime() - 24 * 60 * 60 * 1_000;
    for (const [id, stored] of this.records) {
      if (Date.parse(stored.quote.quoteExpiresAt) < cutoff) this.records.delete(id);
    }
    while (this.records.size > MAX_RECORDS) {
      const oldest = this.records.keys().next().value as string | undefined;
      if (!oldest) break;
      this.records.delete(oldest);
    }
  }
}

let processSettlementAdapter: SimulatedSettlementAdapter | undefined;

export function getSimulatedSettlementAdapter(): SimulatedSettlementAdapter {
  processSettlementAdapter ??= new SimulatedSettlementAdapter();
  return processSettlementAdapter;
}

export function resetSimulatedSettlementAdapterForTests(): void {
  processSettlementAdapter = undefined;
}
