import type {
  AuditEvent,
  AuditActor,
  AuditEventType,
  MandateStatus,
  MandateTerms,
  NewProcurementMandate,
  ProcurementMandate,
  SettlementIntent,
  SettlementStatus,
  SupplierOffer,
} from "../../src/domain/models";

export interface ProcurementSeedData {
  mandates: ProcurementMandate[];
  offers: SupplierOffer[];
  settlements: SettlementIntent[];
  auditEvents: AuditEvent[];
}

/**
 * Async-shaped boundary for persistence implementations. A durable adapter can
 * replace the in-memory implementation without changing callers' domain types.
 */
export interface ProcurementRepository {
  listMandates(): Promise<ProcurementMandate[]>;
  getMandate(id: string): Promise<ProcurementMandate | null>;
  listOffers(mandateId: string): Promise<SupplierOffer[]>;
  getSettlement(mandateId: string): Promise<SettlementIntent | null>;
  listAuditEvents(mandateId: string): Promise<AuditEvent[]>;
  recordAuditEvent(event: {
    mandateId: string;
    actor: AuditActor;
    eventType: AuditEventType;
    summary: string;
    occurredAt?: string;
  }): Promise<AuditEvent>;
  createMandate(
    mandate: NewProcurementMandate,
    idempotencyKey: string,
    occurredAt?: string,
  ): Promise<ProcurementMandate>;
  updateMandate(
    id: string,
    terms: MandateTerms,
    idempotencyKey: string,
    occurredAt?: string,
  ): Promise<ProcurementMandate>;
  transitionMandateStatus(
    id: string,
    nextStatus: MandateStatus,
    occurredAt?: string,
  ): Promise<ProcurementMandate>;
  transitionSettlementStatus(
    mandateId: string,
    nextStatus: SettlementStatus,
    occurredAt?: string,
  ): Promise<SettlementIntent>;
}

export class RepositoryEntityNotFoundError extends Error {
  readonly entity: "mandate" | "settlement";
  readonly id: string;

  constructor(entity: "mandate" | "settlement", id: string) {
    super(`${entity} not found: ${id}`);
    this.name = "RepositoryEntityNotFoundError";
    this.entity = entity;
    this.id = id;
  }
}

export class RepositoryIdempotencyConflictError extends Error {
  constructor() {
    super("The idempotency key was already used for a different request.");
    this.name = "RepositoryIdempotencyConflictError";
  }
}
