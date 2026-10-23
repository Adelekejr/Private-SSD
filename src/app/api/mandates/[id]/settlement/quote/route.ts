import { getOfferRunStore } from "../../../../../../../server/agents/offer-run-store";
import { getProcurementRepository } from "../../../../../../../server/persistence/in-memory-repository";
import { getSimulatedSettlementAdapter } from "../../../../../../../server/settlement/simulated-settlement-adapter";
import { SettlementLifecycleError } from "../../../../../../../server/settlement/settlement-adapter";
import {
  hasExactKeys,
  isRecord,
  parseJsonBody,
  quoteIsExpired,
  recordSettlementAudit,
  validIdempotencyKey,
} from "../../../../../../../server/settlement/http";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const idempotencyKey = validIdempotencyKey(request);
  if (!idempotencyKey) {
    return Response.json({ error: "A valid Idempotency-Key header is required." }, { status: 400 });
  }

  const parsed = await parseJsonBody(request);
  if (!parsed.ok || !isRecord(parsed.value) ||
      !hasExactKeys(parsed.value, ["mode", "offerRunId", "offerId"]) ||
      parsed.value.mode !== "SIMULATED" ||
      typeof parsed.value.offerRunId !== "string" || parsed.value.offerRunId.length > 128 ||
      typeof parsed.value.offerId !== "string" || parsed.value.offerId.length > 128) {
    return Response.json(
      { error: "Provide mode SIMULATED and a valid server-issued offer run and offer ID." },
      { status: 400 },
    );
  }

  const repository = getProcurementRepository();
  const mandate = await repository.getMandate(id);
  if (!mandate) return Response.json({ error: "Mandate not found." }, { status: 404 });

  const now = new Date();
  const lookup = getOfferRunStore().lookup(
    id,
    parsed.value.offerRunId,
    parsed.value.offerId,
    now,
  );
  if (lookup.status === "expired") {
    return Response.json({ error: "The server-issued offer run has expired; rerun the simulated comparison." }, { status: 410 });
  }
  if (lookup.status === "not_found") {
    return Response.json({ error: "Server-issued offer not found for this mandate." }, { status: 404 });
  }
  try {
    const result = getSimulatedSettlementAdapter().createQuote({
      mandate,
      offer: lookup.offer,
      idempotencyKey,
      now,
    });
    await recordSettlementAudit(repository, result, "quote");
    return Response.json(
      { quote: result.quote, disposition: result.disposition, expired: quoteIsExpired(result.quote, now) },
      { status: result.disposition === "created" ? 201 : 200 },
    );
  } catch (error) {
    if (error instanceof SettlementLifecycleError) {
      return Response.json({ error: error.message, code: error.code }, { status: error.statusCode });
    }
    return Response.json({ error: "Could not create the simulated quote." }, { status: 500 });
  }
}
