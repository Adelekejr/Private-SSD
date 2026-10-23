import { getProcurementRepository } from "../../../../../../../server/persistence/in-memory-repository";
import { getSimulatedSettlementAdapter } from "../../../../../../../server/settlement/simulated-settlement-adapter";
import { quoteIsExpired } from "../../../../../../../server/settlement/http";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ id: string; quoteId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id, quoteId } = await context.params;
  const mandate = await getProcurementRepository().getMandate(id);
  if (!mandate) return Response.json({ error: "Mandate not found." }, { status: 404 });
  const quote = getSimulatedSettlementAdapter().getQuote(id, quoteId);
  if (!quote) return Response.json({ error: "Simulated quote not found." }, { status: 404 });
  return Response.json({ quote, expired: quoteIsExpired(quote) });
}
