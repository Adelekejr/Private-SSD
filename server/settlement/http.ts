import type { ProcurementRepository } from "../persistence/repository";
import type { SimulatedSettlementQuote } from "../../src/domain/models";
import type { SettlementAdapterResult } from "./settlement-adapter";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const received = Object.keys(value);
  return received.length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

export async function parseJsonBody(
  request: Request,
): Promise<{ ok: true; value: unknown } | { ok: false }> {
  try {
    return { ok: true, value: await request.json() };
  } catch {
    return { ok: false };
  }
}

export function validIdempotencyKey(request: Request): string | null {
  const key = request.headers.get("Idempotency-Key");
  return key && /^[A-Za-z0-9._:-]{8,128}$/.test(key) ? key : null;
}

export function quoteIsExpired(quote: SimulatedSettlementQuote, now = new Date()): boolean {
  return (
    !Number.isFinite(Date.parse(quote.quoteExpiresAt)) ||
    !Number.isFinite(Date.parse(quote.offerExpiresAt)) ||
    Date.parse(quote.quoteExpiresAt) <= now.getTime() ||
    Date.parse(quote.offerExpiresAt) <= now.getTime()
  );
}

export async function recordSettlementAudit(
  repository: ProcurementRepository,
  result: SettlementAdapterResult,
  action: "quote" | "approval" | "simulation",
): Promise<void> {
  if (!["created", "approved", "simulated"].includes(result.disposition)) return;
  const quote = result.quote;
  const event =
    action === "quote"
      ? {
          actor: "settlement_adapter" as const,
          summary: `SIMULATED quote ${quote.id} created for offer ${quote.offer.id}; no provider was contacted.`,
          occurredAt: quote.createdAt,
        }
      : action === "approval"
        ? {
            actor: "human" as const,
            summary: `Human approved simulated quote ${quote.id}; no signing or funds movement occurred.`,
            occurredAt: quote.approvedAt ?? new Date().toISOString(),
          }
        : {
            actor: "settlement_adapter" as const,
            summary: `Simulation receipt ${quote.receipt?.id ?? "unavailable"} issued for quote ${quote.id}; no money moved.`,
            occurredAt: quote.receipt?.issuedAt ?? new Date().toISOString(),
          };
  await repository.recordAuditEvent({
    mandateId: quote.mandateId,
    actor: event.actor,
    eventType: "settlement_status_changed",
    summary: event.summary,
    occurredAt: event.occurredAt,
  });
}
