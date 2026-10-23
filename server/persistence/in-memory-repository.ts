import type {
  AuditEvent,
  MandateStatus,
  ProcurementMandate,
  SettlementIntent,
  SettlementStatus,
  SupplierOffer,
} from "../../src/domain/models";
import {
  assertMandateStatusTransition,
  assertSettlementStatusTransition,
} from "../../src/domain/transitions";
import { createDemoSeedData } from "./demo-seed";
import {
  RepositoryEntityNotFoundError,
  type ProcurementRepository,
  type ProcurementSeedData,
} from "./repository";

export class InMemoryProcurementRepository implements ProcurementRepository {
  private readonly mandates = new Map<string, ProcurementMandate>();
  private readonly offers: SupplierOffer[];
  private readonly settlements = new Map<string, SettlementIntent>();
  private readonly auditEvents: AuditEvent[];
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
    eventType: "mandate_status_changed" | "settlement_status_changed";
    summary: string;
    occurredAt: string;
  }): void {
    this.auditSequence += 1;
    this.auditEvents.push({
      id: `audit-memory-${String(this.auditSequence).padStart(3, "0")}`,
      mandateId: event.mandateId,
      actor: "system",
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
