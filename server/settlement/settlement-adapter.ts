import type {
  EvaluatedSupplierOffer,
  ProcurementMandate,
  SimulatedSettlementQuote,
} from "../../src/domain/models";

export type SettlementActionDisposition =
  | "created"
  | "approved"
  | "simulated"
  | "replayed"
  | "unchanged";

export interface SettlementAdapterResult {
  quote: SimulatedSettlementQuote;
  disposition: SettlementActionDisposition;
}

export interface CreateSettlementQuoteInput {
  mandate: ProcurementMandate;
  offer: EvaluatedSupplierOffer;
  idempotencyKey: string;
  now?: Date;
}

export interface SettlementActionInput {
  mandate: ProcurementMandate;
  quoteId: string;
  idempotencyKey: string;
  now?: Date;
}

/** Provider-neutral server boundary. The Phase 7 implementation is simulated only. */
export interface SettlementAdapter {
  createQuote(input: CreateSettlementQuoteInput): SettlementAdapterResult;
  approve(input: SettlementActionInput): SettlementAdapterResult;
  execute(input: SettlementActionInput): SettlementAdapterResult;
  getQuote(mandateId: string, quoteId: string): SimulatedSettlementQuote | null;
  getConsumedNonces(): ReadonlySet<string>;
}

export class SettlementLifecycleError extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(code: string, message: string, statusCode = 409) {
    super(message);
    this.name = "SettlementLifecycleError";
    this.code = code;
    this.statusCode = statusCode;
  }
}
