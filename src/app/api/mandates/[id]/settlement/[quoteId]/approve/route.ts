import { getProcurementRepository } from "../../../../../../../../server/persistence/in-memory-repository";
import { getSimulatedSettlementAdapter } from "../../../../../../../../server/settlement/simulated-settlement-adapter";
import { SettlementLifecycleError } from "../../../../../../../../server/settlement/settlement-adapter";
import {
  hasExactKeys,
  isRecord,
  parseJsonBody,
  quoteIsExpired,
  recordSettlementAudit,
  validIdempotencyKey,
} from "../../../../../../../../server/settlement/http";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ id: string; quoteId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { id, quoteId } = await context.params;
  const idempotencyKey = validIdempotencyKey(request);
  if (!idempotencyKey) {
    return Response.json({ error: "A valid Idempotency-Key header is required." }, { status: 400 });
  }

  const parsed = await parseJsonBody(request);
  if (!parsed.ok || !isRecord(parsed.value) ||
      !hasExactKeys(parsed.value, ["mode", "confirmed"]) ||
      parsed.value.mode !== "SIMULATED" || parsed.value.confirmed !== true) {
    return Response.json(
      { error: "Explicit human approval must confirm mode SIMULATED." },
      { status: 400 },
    );
  }

  const repository = getProcurementRepository();
  const mandate = await repository.getMandate(id);
  if (!mandate) return Response.json({ error: "Mandate not found." }, { status: 404 });
  const now = new Date();

  try {
    const result = getSimulatedSettlementAdapter().approve({
      mandate,
      quoteId,
      idempotencyKey,
      now,
    });
    await recordSettlementAudit(repository, result, "approval");
    return Response.json({
      quote: result.quote,
      disposition: result.disposition,
      expired: quoteIsExpired(result.quote, now),
    });
  } catch (error) {
    if (error instanceof SettlementLifecycleError) {
      return Response.json({ error: error.message, code: error.code }, { status: error.statusCode });
    }
    return Response.json({ error: "Could not approve the simulated quote." }, { status: 500 });
  }
}
