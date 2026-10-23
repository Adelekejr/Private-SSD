import { parseBuyerRequest } from "../../../../../../domain/buyer-request-parser";
import { getProcurementRepository } from "../../../../../../../server/persistence/in-memory-repository";
import { runDeterministicSupplierAgents } from "../../../../../../../server/agents/supplier-agents";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ id: string }> };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  if (!isRecord(body) || typeof body.requestText !== "string" || body.requestText.length > 2_000) {
    return Response.json(
      { error: "Provide buyer request text of 2,000 characters or fewer." },
      { status: 400 },
    );
  }

  const mandate = await getProcurementRepository().getMandate(id);
  if (!mandate) {
    return Response.json({ error: "Mandate not found." }, { status: 404 });
  }

  const buyerProposal = parseBuyerRequest(body.requestText, mandate);
  const result = runDeterministicSupplierAgents(mandate);
  return Response.json({
    mode: "SIMULATED",
    buyerProposal,
    offers: result.offers,
    rejectedResponses: result.rejectedResponses,
  });
}
