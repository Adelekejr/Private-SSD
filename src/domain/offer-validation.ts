import type { SupplierOffer } from "./models";

export interface SupplierAgentResponse {
  id: string;
  mandateId: string;
  supplierAgent: string;
  amount: number;
  unitPrice?: number;
  asset: string;
  destinationChain: string;
  recipient: string;
  reliabilityScore: number;
  evidence: string[];
  riskNotes: string[];
  expiresAt: string;
  nonce: string;
}

export type SupplierResponseValidation =
  | { success: true; data: SupplierAgentResponse }
  | { success: false; reason: string };

const REQUIRED_KEYS = [
  "id",
  "mandateId",
  "supplierAgent",
  "amount",
  "asset",
  "destinationChain",
  "recipient",
  "reliabilityScore",
  "evidence",
  "riskNotes",
  "expiresAt",
  "nonce",
] as const;
const OPTIONAL_KEYS = ["unitPrice"] as const;
const ALLOWED_KEYS = new Set<string>([...REQUIRED_KEYS, ...OPTIONAL_KEYS]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isText(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLength;
}

function isTextList(value: unknown, maxItems: number): value is string[] {
  return (
    Array.isArray(value) &&
    value.length <= maxItems &&
    value.every((item) => isText(item, 240))
  );
}

function isPositiveFinite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isIsoDateTime(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value;
}

export function validateSupplierAgentResponse(
  input: unknown,
  expectedMandateId: string,
): SupplierResponseValidation {
  if (!isRecord(input)) {
    return { success: false, reason: "Response must be a structured object." };
  }
  const keys = Object.keys(input);
  if (keys.some((key) => !ALLOWED_KEYS.has(key))) {
    return {
      success: false,
      reason: "Response contains an unexpected field; untrusted instructions were ignored.",
    };
  }
  if (
    REQUIRED_KEYS.some((key) => !Object.hasOwn(input, key)) ||
    (Object.hasOwn(input, "unitPrice") && !OPTIONAL_KEYS.some((key) => Object.hasOwn(input, key)))
  ) {
    return { success: false, reason: "Response is missing a required offer field." };
  }

  const valid =
    isText(input.id, 128) &&
    input.mandateId === expectedMandateId &&
    isText(input.supplierAgent, 80) &&
    isPositiveFinite(input.amount) &&
    (input.unitPrice === undefined || isPositiveFinite(input.unitPrice)) &&
    typeof input.asset === "string" && /^[A-Z][A-Z0-9._-]{1,15}$/.test(input.asset) &&
    isText(input.destinationChain, 80) &&
    isText(input.recipient, 128) &&
    typeof input.reliabilityScore === "number" &&
    Number.isFinite(input.reliabilityScore) &&
    input.reliabilityScore >= 0 &&
    input.reliabilityScore <= 1 &&
    isTextList(input.evidence, 6) &&
    isTextList(input.riskNotes, 6) &&
    isIsoDateTime(input.expiresAt) &&
    isText(input.nonce, 128) &&
    /^[A-Za-z0-9._:-]{1,128}$/.test(input.nonce);

  if (!valid) {
    return { success: false, reason: "Response does not match the required offer schema." };
  }

  const response = input as unknown as SupplierAgentResponse;
  return {
    success: true,
    data: {
      id: response.id,
      mandateId: response.mandateId,
      supplierAgent: response.supplierAgent,
      amount: response.amount,
      ...(response.unitPrice === undefined ? {} : { unitPrice: response.unitPrice }),
      asset: response.asset,
      destinationChain: response.destinationChain,
      recipient: response.recipient,
      reliabilityScore: response.reliabilityScore,
      evidence: [...response.evidence],
      riskNotes: [...response.riskNotes],
      expiresAt: response.expiresAt,
      nonce: response.nonce,
    },
  };
}

export function toSupplierOffer(response: SupplierAgentResponse): SupplierOffer {
  return {
    id: response.id,
    mandateId: response.mandateId,
    supplierAgent: response.supplierAgent,
    amount: response.amount,
    ...(response.unitPrice === undefined ? {} : { unitPrice: response.unitPrice }),
    asset: response.asset,
    destinationChain: response.destinationChain,
    recipient: response.recipient,
    reliabilityScore: response.reliabilityScore,
    evidence: [...response.evidence],
    expiresAt: response.expiresAt,
    nonce: response.nonce,
    policyResult: "not_evaluated",
    riskReasons: [...response.riskNotes],
  };
}
