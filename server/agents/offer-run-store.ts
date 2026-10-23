import { randomUUID } from "node:crypto";
import type { EvaluatedSupplierOffer } from "../../src/domain/models";

const OFFER_RUN_TTL_MS = 30 * 60 * 1_000;
const MAX_OFFER_RUNS = 500;

type OfferRun = {
  mandateId: string;
  createdAt: number;
  expiresAt: number;
  offers: EvaluatedSupplierOffer[];
};

export type OfferRunLookup =
  | { status: "found"; offer: EvaluatedSupplierOffer }
  | { status: "not_found" }
  | { status: "expired" };

/** Stores only server-generated structured offers, never the buyer's raw request. */
export class InMemoryOfferRunStore {
  private readonly runs = new Map<string, OfferRun>();

  create(
    mandateId: string,
    offers: EvaluatedSupplierOffer[],
    now = new Date(),
  ): string {
    if (!Number.isFinite(now.getTime())) {
      throw new Error("Offer run storage requires a valid clock value.");
    }
    this.prune(now.getTime());
    const id = `offer-run-${randomUUID()}`;
    this.runs.set(id, {
      mandateId,
      createdAt: now.getTime(),
      expiresAt: now.getTime() + OFFER_RUN_TTL_MS,
      offers: structuredClone(offers),
    });
    while (this.runs.size > MAX_OFFER_RUNS) {
      const oldest = this.runs.keys().next().value as string | undefined;
      if (!oldest) break;
      this.runs.delete(oldest);
    }
    return id;
  }

  lookup(
    mandateId: string,
    runId: string,
    offerId: string,
    now = new Date(),
  ): OfferRunLookup {
    if (!Number.isFinite(now.getTime())) {
      throw new Error("Offer run lookup requires a valid clock value.");
    }
    const run = this.runs.get(runId);
    if (!run || run.mandateId !== mandateId) return { status: "not_found" };
    if (run.expiresAt <= now.getTime()) {
      this.runs.delete(runId);
      return { status: "expired" };
    }
    const offer = run.offers.find((candidate) => candidate.id === offerId);
    return offer
      ? { status: "found", offer: structuredClone(offer) }
      : { status: "not_found" };
  }

  clear(): void {
    this.runs.clear();
  }

  private prune(now: number): void {
    for (const [id, run] of this.runs) {
      if (run.expiresAt <= now) this.runs.delete(id);
    }
  }
}

let processOfferRunStore: InMemoryOfferRunStore | undefined;

export function getOfferRunStore(): InMemoryOfferRunStore {
  processOfferRunStore ??= new InMemoryOfferRunStore();
  return processOfferRunStore;
}
