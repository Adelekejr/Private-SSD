export type PrivacyMode = "simulated" | "private-ai" | "private-ai-attested";

export type MandateStatus =
  | "draft"
  | "open"
  | "review"
  | "approved"
  | "settling"
  | "settled"
  | "blocked";

export type SettlementStatus =
  | "not_started"
  | "quoted"
  | "approved"
  | "deposit_pending"
  | "settling"
  | "settled"
  | "refunded"
  | "simulated";

export type SettlementMode = "simulated" | "testnet" | "live";

export type PolicyResult = "not_evaluated" | "pass" | "blocked" | "review";

export interface PolicyEvaluation {
  result: Exclude<PolicyResult, "not_evaluated">;
  reasons: string[];
  approvalRequired: boolean;
  evaluatedAt: string;
}

export type Constraint =
  | {
      id: string;
      kind: "budget";
      amount: number;
      asset: string;
    }
  | {
      id: string;
      kind: "max_unit_price";
      amount: number;
      asset: string;
      unit: string;
    }
  | {
      id: string;
      kind: "min_reliability";
      score: number;
    }
  | {
      id: string;
      kind: "allowed_destinations";
      chains: string[];
    }
  | {
      id: string;
      kind: "approved_recipients";
      recipients: string[];
    }
  | {
      id: string;
      kind: "approval_threshold";
      amount: number;
      asset: string;
    };

export interface MandateTerms {
  purpose: string;
  asset: string;
  budget: number;
  maxUnitPrice?: number;
  minReliability?: number;
  allowedDestinations: string[];
  approvedRecipients: string[];
  approvalThreshold: number;
  privacyMode: PrivacyMode;
}

export interface ProcurementMandate extends MandateTerms {
  id: string;
  buyerAccount: string;
  constraints: Constraint[];
  status: MandateStatus;
}

export type NewProcurementMandate = Omit<ProcurementMandate, "id">;

export interface SupplierOffer {
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
  policyResult: PolicyResult;
  riskReasons: string[];
  /** Optional on legacy illustrative seed offers; required on validated supplier responses. */
  expiresAt?: string;
  nonce?: string;
  /** Separate from supplier-reported risk notes. */
  policyEvaluation?: PolicyEvaluation;
}

export interface EvaluatedSupplierOffer extends SupplierOffer {
  expiresAt: string;
  nonce: string;
  policyResult: Exclude<PolicyResult, "not_evaluated">;
  policyEvaluation: PolicyEvaluation;
}

export interface SettlementIntent {
  id: string;
  mandateId: string;
  quoteId?: string;
  sourceAsset: string;
  destinationAsset: string;
  destinationChain: string;
  amount: number;
  status: SettlementStatus;
  mode: SettlementMode;
}

export type SimulatedSettlementStatus = Extract<SettlementStatus, "quoted" | "approved" | "simulated">;

export interface SettlementOfferSnapshot {
  id: string;
  supplierAgent: string;
  amount: number;
  asset: string;
  destinationChain: string;
  recipient: string;
  expiresAt: string;
}

export interface SimulatedSettlementReceipt {
  id: string;
  issuedAt: string;
  status: "SIMULATED";
  simulated: true;
  moneyMoved: false;
  message: "Simulation only; no funds were transferred, reserved, or signed.";
}

export interface SimulatedSettlementQuote {
  id: string;
  mandateId: string;
  offer: SettlementOfferSnapshot;
  amount: number;
  asset: string;
  destinationChain: string;
  recipient: string;
  offerExpiresAt: string;
  quoteExpiresAt: string;
  createdAt: string;
  mode: "SIMULATED";
  policyResult: "pass" | "review";
  status: SimulatedSettlementStatus;
  approvalStatus: "pending" | "approved";
  approvedAt?: string;
  receipt?: SimulatedSettlementReceipt;
}

export type AuditActor =
  | "system"
  | "human"
  | "supplier_agent"
  | "policy_engine"
  | "settlement_adapter";

export type AuditEventType =
  | "demo_seed_loaded"
  | "mandate_created"
  | "mandate_updated"
  | "mandate_status_changed"
  | "settlement_status_changed";

export interface AuditEvent {
  id: string;
  mandateId: string;
  actor: AuditActor;
  eventType: AuditEventType;
  summary: string;
  occurredAt: string;
  redacted: true;
}
