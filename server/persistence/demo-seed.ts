import type {
  AuditEvent,
  Constraint,
  ProcurementMandate,
  SettlementIntent,
  SupplierOffer,
} from "../../src/domain/models";
import type { ProcurementSeedData } from "./repository";

export const DEMO_MANDATE_ID = "mandate-demo-cloud-compute-001";
export const DEMO_SEED_TIMESTAMP = "2026-10-23T00:00:00.000Z";

const constraints: Constraint[] = [
  { id: "constraint-budget", kind: "budget", amount: 5_000, asset: "USDC" },
  {
    id: "constraint-unit-price",
    kind: "max_unit_price",
    amount: 0.15,
    asset: "USDC",
    unit: "compute-hour",
  },
  { id: "constraint-reliability", kind: "min_reliability", score: 0.95 },
  {
    id: "constraint-destinations",
    kind: "allowed_destinations",
    chains: ["near-testnet"],
  },
  {
    id: "constraint-recipients",
    kind: "approved_recipients",
    recipients: ["demo:ember-compute-recipient"],
  },
  {
    id: "constraint-approval",
    kind: "approval_threshold",
    amount: 1_000,
    asset: "USDC",
  },
];

const mandate: ProcurementMandate = {
  id: DEMO_MANDATE_ID,
  buyerAccount: "demo-finance-workspace",
  purpose: "Cloud compute capacity for one month",
  asset: "USDC",
  budget: 5_000,
  maxUnitPrice: 0.15,
  minReliability: 0.95,
  constraints,
  allowedDestinations: ["near-testnet"],
  approvedRecipients: ["demo:ember-compute-recipient"],
  approvalThreshold: 1_000,
  privacyMode: "simulated",
  status: "review",
};

const offers: SupplierOffer[] = [
  {
    id: "offer-demo-price-limit-001",
    mandateId: DEMO_MANDATE_ID,
    supplierAgent: "Aster Compute (demo fixture)",
    amount: 5_180,
    unitPrice: 0.17,
    asset: "USDC",
    destinationChain: "near-testnet",
    recipient: "demo:aster-compute-recipient",
    reliabilityScore: 0.91,
    evidence: ["Deterministic sample offer; no supplier service was contacted."],
    policyResult: "blocked",
    riskReasons: [
      "Sample fixture: amount exceeds budget and unit price exceeds the stated limit.",
    ],
  },
  {
    id: "offer-demo-recipient-001",
    mandateId: DEMO_MANDATE_ID,
    supplierAgent: "Northstar Compute (demo fixture)",
    amount: 4_800,
    unitPrice: 0.14,
    asset: "USDC",
    destinationChain: "near-testnet",
    recipient: "demo:unapproved-compute-recipient",
    reliabilityScore: 0.97,
    evidence: ["Deterministic sample offer; no supplier service was contacted."],
    policyResult: "blocked",
    riskReasons: ["Sample fixture: recipient is not on the mandate allowlist."],
  },
  {
    id: "offer-demo-eligible-001",
    mandateId: DEMO_MANDATE_ID,
    supplierAgent: "Ember Compute (demo fixture)",
    amount: 4_920,
    unitPrice: 0.13,
    asset: "USDC",
    destinationChain: "near-testnet",
    recipient: "demo:ember-compute-recipient",
    reliabilityScore: 0.98,
    evidence: ["Deterministic sample offer; no supplier service was contacted."],
    policyResult: "pass",
    riskReasons: [],
  },
];

const settlement: SettlementIntent = {
  id: "settlement-demo-001",
  mandateId: DEMO_MANDATE_ID,
  sourceAsset: "USDC",
  destinationAsset: "USDC",
  destinationChain: "near-testnet",
  amount: 4_920,
  status: "not_started",
  mode: "simulated",
};

const auditEvents: AuditEvent[] = [
  {
    id: "audit-demo-seed-001",
    mandateId: DEMO_MANDATE_ID,
    actor: "system",
    eventType: "demo_seed_loaded",
    summary:
      "Deterministic sample mandate, offers, and simulated settlement initialized; no external services were contacted.",
    occurredAt: DEMO_SEED_TIMESTAMP,
    redacted: true,
  },
];

export function createDemoSeedData(): ProcurementSeedData {
  return structuredClone({
    mandates: [mandate],
    offers,
    settlements: [settlement],
    auditEvents,
  });
}
