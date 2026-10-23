import { parseBuyerRequest } from "../../../../../../domain/buyer-request-parser";
import { getProcurementRepository } from "../../../../../../../server/persistence/in-memory-repository";
import { runDeterministicSupplierAgents } from "../../../../../../../server/agents/supplier-agents";
import {
  applyPolicyEvaluation,
  evaluateOffer,
} from "../../../../../../../server/policy/policy-engine";
import { InMemoryIdempotencyStore } from "../../../../../../../server/policy/idempotency";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ id: string }> };

interface OfferSimulationPayload {
  mode: "SIMULATED";
  policyAuthority: "SERVER";
  buyerProposal: ReturnType<typeof parseBuyerRequest>;
  offers: ReturnType<typeof applyPolicyEvaluation>[];
  rejectedResponses: ReturnType<typeof runDeterministicSupplierAgents>["rejectedResponses"];
}

const idempotencyStore = new InMemoryIdempotencyStore<OfferSimulationPayload>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validIdempotencyKey(request: Request): string | null {
  const key = request.headers.get("Idempotency-Key");
  return key && /^[A-Za-z0-9._:-]{8,128}$/.test(key) ? key : null;
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const idempotencyKey = validIdempotencyKey(request);
  if (!idempotencyKey) {
    return Response.json(
      { error: "A valid Idempotency-Key header is required." },
      { status: 400 },
    );
  }

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

  const result = await idempotencyStore.run(
    `offer-simulation:${id}:${idempotencyKey}`,
    { requestText: body.requestText, mandate },
    () => {
      const now = new Date();
      const buyerProposal = parseBuyerRequest(body.requestText as string, mandate);
      const supplierRun = runDeterministicSupplierAgents(mandate, {
        now,
        idempotencyKey,
      });
      const observedNonces = new Set<string>();
      const offers = supplierRun.offers.map((offer) => {
        const policyEvaluation = evaluateOffer(mandate, offer, {
          now,
          consumedNonces: observedNonces,
        });
        if (offer.nonce) observedNonces.add(offer.nonce);
        return applyPolicyEvaluation(offer, policyEvaluation);
      });

      return {
        mode: "SIMULATED",
        policyAuthority: "SERVER",
        buyerProposal,
        offers,
        rejectedResponses: supplierRun.rejectedResponses,
      };
    },
  );

  if (result.status === "conflict") {
    return Response.json(
      { error: "The idempotency key was already used for a different request." },
      { status: 409 },
    );
  }

  return Response.json({
    ...result.response,
    idempotency: result.status === "replayed" ? "REPLAYED" : "NEW",
  });
}
