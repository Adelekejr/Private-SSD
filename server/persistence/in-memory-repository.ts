import { createHash, randomUUID } from "node:crypto";
import type {
  AuditEvent,
  AuditEventType,
  MandateStatus,
  MandateTerms,
  NewProcurementMandate,
  ProcurementMandate,
  SettlementIntent,
  SettlementStatus,
  SupplierOffer,
} from "../../src/domain/models";
import { buildMandateConstraints } from "../../src/domain/mandate-validation";
import {
  assertMandateStatusTransition,
  assertSettlementStatusTransition,
} from "../../src/domain/transitions";
import { createDemoSeedData } from "./demo-seed";
import {
  RepositoryEntityNotFoundError,
  RepositoryIdempotencyConflictError,
  type ProcurementRepository,
  type ProcurementSeedData,
} from "./repository";

interface CompletedWrite {
  requestDigest: string;
  mandate: ProcurementMandate;
}

const editableFields = [
  "purpose",
  "budget",
  "asset",
  "maxUnitPrice",
  "minReliability",
  "allowedDestinations",
  "approvedRecipients",
  "approvalThreshold",
  "privacyMode",
] as const satisfies readonly (keyof MandateTerms)[];

function digest(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function sameValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export class InMemoryProcurementRepository implements ProcurementRepository {
  private readonly mandates = new Map<string, ProcurementMandate>();
  private readonly offers: SupplierOffer[];
  private readonly settlements = new Map<string, SettlementIntent>();
  private readonly auditEvents: AuditEvent[];
  private readonly completedWrites = new Map<string, CompletedWrite>();
  private auditSequence: number;

  constructor(seed: ProcurementSeedData = createDemoSeedData()) {
    const copy = structuredClone(seed);
    for (const mandate of copy.mandates) {
      this.mandates.set(mandate.id, mandate);
    }
    this.offers = copy.offers;
    for (const settlement of copy.settlements) {
      this.settlements.set(settlement.mandateId, settlement);
    }
    this.auditEvents = copy.auditEvents;
    this.auditSequence = copy.auditEvents.length;
  }

  async listMandates(): Promise<ProcurementMandate[]> {
    return structuredClone([...this.mandates.values()]);
  }

  async getMandate(id: string): Promise<ProcurementMandate | null> {
    const mandate = this.mandates.get(id);
    return mandate ? structuredClone(mandate) : null;
  }

  async listOffers(mandateId: string): Promise<SupplierOffer[]> {
    return structuredClone(this.offers.filter((offer) => offer.mandateId === mandateId));
  }

  async getSettlement(mandateId: string): Promise<SettlementIntent | null> {
    const settlement = this.settlements.get(mandateId);
    return settlement ? structuredClone(settlement) : null;
  }

  async listAuditEvents(mandateId: string): Promise<AuditEvent[]> {
    return structuredClone(
      this.auditEvents.filter((event) => event.mandateId === mandateId),
    );
  }

  async recordAuditEvent(event: {
    mandateId: string;
    actor: AuditEvent["actor"];
    eventType: AuditEventType;
    summary: string;
    occurredAt?: string;
  }): Promise<AuditEvent> {
    if (!this.mandates.has(event.mandateId)) {
      throw new RepositoryEntityNotFoundError("mandate", event.mandateId);
    }
    this.appendAuditEvent({
      ...event,
      occurredAt: event.occurredAt ?? new Date().toISOString(),
    });
    return structuredClone(this.auditEvents.at(-1)!);
  }

  async createMandate(
    input: NewProcurementMandate,
    idempotencyKey: string,
    occurredAt = new Date().toISOString(),
  ): Promise<ProcurementMandate> {
    const key = `create:${idempotencyKey}`;
    const requestDigest = digest(input);
    const replay = this.completedWrites.get(key);
    if (replay) {
      if (replay.requestDigest !== requestDigest) {
        throw new RepositoryIdempotencyConflictError();
      }
      return structuredClone(replay.mandate);
    }

    const mandate: ProcurementMandate = {
      ...structuredClone(input),
      id: `mandate-${randomUUID()}`,
    };
    this.mandates.set(mandate.id, mandate);
    this.appendAuditEvent({
      mandateId: mandate.id,
      actor: "human",
      eventType: "mandate_created",
      summary: "Mandate created. Purpose and recipient values are redacted.",
      occurredAt,
    });
    this.completedWrites.set(key, {
      requestDigest,
      mandate: structuredClone(mandate),
    });
    return structuredClone(mandate);
  }

  async updateMandate(
    id: string,
    terms: MandateTerms,
    idempotencyKey: string,
    occurredAt = new Date().toISOString(),
  ): Promise<ProcurementMandate> {
    const key = `update:${id}:${idempotencyKey}`;
    const requestDigest = digest(terms);
    const replay = this.completedWrites.get(key);
    if (replay) {
      if (replay.requestDigest !== requestDigest) {
        throw new RepositoryIdempotencyConflictError();
      }
      return structuredClone(replay.mandate);
    }

    const mandate = this.mandates.get(id);
    if (!mandate) {
      throw new RepositoryEntityNotFoundError("mandate", id);
    }
    const changedFields = editableFields.filter(
      (field) => !sameValue(mandate[field], terms[field]),
    );
    const updated: ProcurementMandate = {
      ...mandate,
      ...structuredClone(terms),
      constraints: buildMandateConstraints(terms),
    };
    this.mandates.set(id, updated);
    if (changedFields.length > 0) {
      this.appendAuditEvent({
        mandateId: id,
        actor: "human",
        eventType: "mandate_updated",
        summary: `Mandate updated: ${changedFields.join(", ")}. Values are redacted.`,
        occurredAt,
      });
    }
    this.completedWrites.set(key, {
      requestDigest,
      mandate: structuredClone(updated),
    });
    return structuredClone(updated);
  }

  async transitionMandateStatus(
    id: string,
    nextStatus: MandateStatus,
    occurredAt = new Date().toISOString(),
  ): Promise<ProcurementMandate> {
    const mandate = this.mandates.get(id);
    if (!mandate) {
      throw new RepositoryEntityNotFoundError("mandate", id);
    }

    assertMandateStatusTransition(mandate.status, nextStatus);
    const previousStatus = mandate.status;
    mandate.status = nextStatus;
    this.appendAuditEvent({
      mandateId: mandate.id,
      eventType: "mandate_status_changed",
      summary: `Mandate status changed from ${previousStatus} to ${nextStatus}.`,
      occurredAt,
    });
    return structuredClone(mandate);
  }

  async transitionSettlementStatus(
    mandateId: string,
    nextStatus: SettlementStatus,
    occurredAt = new Date().toISOString(),
  ): Promise<SettlementIntent> {
    const settlement = this.settlements.get(mandateId);
    if (!settlement) {
      throw new RepositoryEntityNotFoundError("settlement", mandateId);
    }

    assertSettlementStatusTransition(settlement.status, nextStatus);
    const previousStatus = settlement.status;
    settlement.status = nextStatus;
    this.appendAuditEvent({
      mandateId,
      eventType: "settlement_status_changed",
      summary: `Settlement status changed from ${previousStatus} to ${nextStatus}.`,
      occurredAt,
    });
    return structuredClone(settlement);
  }

  private appendAuditEvent(event: {
    mandateId: string;
    actor?: AuditEvent["actor"];
    eventType: AuditEventType;
    summary: string;
    occurredAt: string;
  }): void {
    this.auditSequence += 1;
    this.auditEvents.push({
      id: `audit-memory-${String(this.auditSequence).padStart(3, "0")}`,
      mandateId: event.mandateId,
      actor: event.actor ?? "system",
      eventType: event.eventType,
      summary: event.summary,
      occurredAt: event.occurredAt,
      redacted: true,
    });
  }
}

let processRepository: InMemoryProcurementRepository | undefined;

/**
 * Returns a process-local singleton. Data is volatile and is not shared across
 * workers, serverless instances, or restarts.
 */
export function getProcurementRepository(): ProcurementRepository {
  processRepository ??= new InMemoryProcurementRepository();
  return processRepository;
}
