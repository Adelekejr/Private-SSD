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

export type PolicyResult = "pass" | "blocked" | "review";

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

export interface ProcurementMandate {
  id: string;
  buyerAccount: string;
  purpose: string;
  asset: string;
  budget: number;
  maxUnitPrice?: number;
  minReliability?: number;
  constraints: Constraint[];
  allowedDestinations: string[];
  approvedRecipients: string[];
  approvalThreshold: number;
  privacyMode: PrivacyMode;
  status: MandateStatus;
}

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

export type AuditActor =
  | "system"
  | "human"
  | "supplier_agent"
  | "policy_engine"
  | "settlement_adapter";

export type AuditEventType =
  | "demo_seed_loaded"
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
