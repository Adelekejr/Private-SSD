import type {
  EvaluatedSupplierOffer,
  PolicyEvaluation,
  ProcurementMandate,
  SupplierOffer,
} from "../../src/domain/models";
import {
  toSupplierOffer,
  validateSupplierAgentResponse,
} from "../../src/domain/offer-validation";

export interface PolicyEvaluationContext {
  now?: Date;
  /** Nonces already consumed by an eventual execution adapter; this module never mutates it. */
  consumedNonces?: ReadonlySet<string>;
}

export type PreExecutionCheck =
  | {
      status: "blocked";
      reason: string;
      policyEvaluation?: PolicyEvaluation;
    }
  | { status: "approval_required"; policyEvaluation: PolicyEvaluation }
  | { status: "eligible"; policyEvaluation: PolicyEvaluation };

const NONCE_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;

function hasExact(value: string, allowed: readonly string[]): boolean {
  return allowed.includes(value.trim());
}

function hasChain(value: string, allowed: readonly string[]): boolean {
  const normalized = value.trim().toLowerCase();
  return allowed.some((chain) => chain.trim().toLowerCase() === normalized);
}

export function evaluateOffer(
  mandate: ProcurementMandate,
  offer: SupplierOffer,
  context: PolicyEvaluationContext = {},
): PolicyEvaluation {
  const now = context.now ?? new Date();
  if (!Number.isFinite(now.getTime())) {
    throw new Error("Policy evaluation requires a valid clock value.");
  }

  const blockedReasons: string[] = [];
  const reviewReasons: string[] = [];
  const nowMs = now.getTime();

  if (!Number.isFinite(offer.amount) || offer.amount <= 0) {
    blockedReasons.push("Offer amount is invalid.");
  } else if (offer.amount > mandate.budget) {
    blockedReasons.push("Offer amount exceeds the mandate budget.");
  }

  if (offer.asset.trim().toUpperCase() !== mandate.asset.trim().toUpperCase()) {
    blockedReasons.push("Offer asset does not match the mandate asset.");
  }

  if (mandate.maxUnitPrice !== undefined) {
    if (offer.unitPrice === undefined) {
      reviewReasons.push("Unit price is missing; the maximum cannot be verified.");
    } else if (!Number.isFinite(offer.unitPrice) || offer.unitPrice <= 0) {
      blockedReasons.push("Offer unit price is invalid.");
    } else if (offer.unitPrice > mandate.maxUnitPrice) {
      blockedReasons.push("Unit price exceeds the mandate maximum.");
    }
  }

  if (!hasExact(offer.recipient, mandate.approvedRecipients)) {
    blockedReasons.push("Recipient is not approved by the mandate.");
  }

  if (!hasChain(offer.destinationChain, mandate.allowedDestinations)) {
    blockedReasons.push("Destination chain is not allowed by the mandate.");
  }

  if (mandate.minReliability !== undefined) {
    if (
      !Number.isFinite(offer.reliabilityScore) ||
      offer.reliabilityScore < mandate.minReliability
    ) {
      blockedReasons.push("Supplier reliability is below the mandate minimum.");
    }
  }

  const expiresAtMs =
    typeof offer.expiresAt === "string" ? Date.parse(offer.expiresAt) : Number.NaN;
  if (!Number.isFinite(expiresAtMs) || expiresAtMs <= nowMs) {
    blockedReasons.push("Offer is expired or has an invalid expiry timestamp.");
  }

  if (typeof offer.nonce !== "string" || !NONCE_PATTERN.test(offer.nonce)) {
    blockedReasons.push("Offer nonce is missing or malformed.");
  } else if (context.consumedNonces?.has(offer.nonce)) {
    blockedReasons.push("Offer nonce has already been used.");
  }

  const approvalRequired =
    blockedReasons.length === 0 &&
    Number.isFinite(offer.amount) &&
    offer.amount > mandate.approvalThreshold;
  if (approvalRequired) {
    reviewReasons.push(
      "Offer exceeds the approval threshold; explicit human approval is required.",
    );
  }

  const result: PolicyEvaluation["result"] =
    blockedReasons.length > 0
      ? "blocked"
      : reviewReasons.length > 0
        ? "review"
        : "pass";

  return {
    result,
    reasons: [...blockedReasons, ...reviewReasons],
    approvalRequired,
    evaluatedAt: now.toISOString(),
  };
}

export function applyPolicyEvaluation(
  offer: SupplierOffer,
  policyEvaluation: PolicyEvaluation,
): EvaluatedSupplierOffer {
  const expiresAt = offer.expiresAt;
  const nonce = offer.nonce;
  if (!expiresAt || !nonce) {
    throw new Error("Only offers with expiry and nonce metadata can be evaluated.");
  }
  return {
    ...offer,
    expiresAt,
    nonce,
    policyResult: policyEvaluation.result,
    policyEvaluation,
  };
}

/** Revalidates an untrusted offer against the current saved mandate; it does not execute or consume a nonce. */
export function checkOfferBeforeExecution(
  mandate: ProcurementMandate,
  candidate: unknown,
  context: PolicyEvaluationContext = {},
): PreExecutionCheck {
  const parsed = validateSupplierAgentResponse(candidate, mandate.id);
  if (!parsed.success) {
    return {
      status: "blocked",
      reason: "Offer does not pass server-side schema validation.",
    };
  }

  const offer = toSupplierOffer(parsed.data);
  const policyEvaluation = evaluateOffer(mandate, offer, context);
  if (policyEvaluation.result === "blocked") {
    return {
      status: "blocked",
      reason: "Current mandate policy blocks this offer.",
      policyEvaluation,
    };
  }
  if (policyEvaluation.result === "review" || policyEvaluation.approvalRequired) {
    return { status: "approval_required", policyEvaluation };
  }
  return { status: "eligible", policyEvaluation };
}
