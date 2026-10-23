import assert from "node:assert/strict";
import { test } from "node:test";
import { POST as simulateOffers } from "../src/app/api/mandates/[id]/offers/simulate/route";
import { POST as createQuote } from "../src/app/api/mandates/[id]/settlement/quote/route";
import { POST as approveQuote } from "../src/app/api/mandates/[id]/settlement/[quoteId]/approve/route";
import { POST as executeQuote } from "../src/app/api/mandates/[id]/settlement/[quoteId]/execute/route";
import { GET as getQuoteStatus } from "../src/app/api/mandates/[id]/settlement/[quoteId]/route";
import { GET as getMandate } from "../src/app/api/mandates/[id]/route";
import { applyPolicyEvaluation, evaluateOffer } from "../server/policy/policy-engine";
import { runDeterministicSupplierAgents } from "../server/agents/supplier-agents";
import { getOfferRunStore } from "../server/agents/offer-run-store";
import { createDemoSeedData, DEMO_MANDATE_ID } from "../server/persistence/demo-seed";
import {
  SimulatedSettlementAdapter,
  resetSimulatedSettlementAdapterForTests,
} from "../server/settlement/simulated-settlement-adapter";
import { SettlementLifecycleError } from "../server/settlement/settlement-adapter";
import type { EvaluatedSupplierOffer, ProcurementMandate } from "../src/domain/models";

const NOW = new Date("2026-10-23T12:00:00.000Z");
const EMPTY_PARAMS = Promise.resolve({ id: DEMO_MANDATE_ID });

function createRequest(url: string, body: unknown, idempotencyKey?: string): Request {
  const headers = new Headers({ "Content-Type": "application/json" });
  if (idempotencyKey) headers.set("Idempotency-Key", idempotencyKey);
  return new Request(url, { method: "POST", headers, body: JSON.stringify(body) });
}

function baseMandate(): ProcurementMandate {
  return structuredClone(createDemoSeedData().mandates[0]!);
}

function evaluatedOffer(
  mandate = baseMandate(),
  supplier = "Ember Compute",
  now = NOW,
): EvaluatedSupplierOffer {
  const run = runDeterministicSupplierAgents(mandate, {
    now,
    idempotencyKey: `test-settlement-${supplier.toLowerCase().replaceAll(" ", "-")}`,
  });
  const offer = run.offers.find((candidate) => candidate.supplierAgent === supplier);
  assert.ok(offer, `Expected ${supplier} fixture.`);
  return applyPolicyEvaluation(offer, evaluateOffer(mandate, offer, { now }));
}

test("threshold-only REVIEW quote remains REVIEW and requires explicit human approval before simulation", () => {
  const mandate = baseMandate();
  assert.equal(mandate.approvalThreshold, 1_000);
  const offer = evaluatedOffer(mandate);
  assert.equal(offer.amount, 4_920);
  assert.equal(offer.policyResult, "review");
  assert.equal(offer.policyEvaluation.approvalRequired, true);
  assert.equal(offer.policyEvaluation.reasons.length, 1);
  assert.match(offer.policyEvaluation.reasons[0] ?? "", /approval threshold/i);

  const adapter = new SimulatedSettlementAdapter();
  const created = adapter.createQuote({
    mandate,
    offer,
    idempotencyKey: "threshold-review-quote-001",
    now: NOW,
  });
  assert.equal(created.quote.policyResult, "review");
  assert.equal(created.quote.status, "quoted");
  assert.equal(created.quote.approvalStatus, "pending");
  assert.equal(Date.parse(created.quote.quoteExpiresAt), NOW.getTime() + 5 * 60 * 1_000);

  assert.throws(
    () => adapter.execute({
      mandate,
      quoteId: created.quote.id,
      idempotencyKey: "threshold-review-execute-001",
      now: NOW,
    }),
    (error: unknown) => error instanceof SettlementLifecycleError && error.code === "APPROVAL_REQUIRED",
  );

  const approved = adapter.approve({
    mandate,
    quoteId: created.quote.id,
    idempotencyKey: "threshold-review-approve-001",
    now: NOW,
  });
  assert.equal(approved.quote.policyResult, "review");
  assert.equal(approved.quote.status, "approved");
  assert.equal(approved.quote.approvalStatus, "approved");
  assert.equal(approved.quote.approvedAt, NOW.toISOString());

  const simulated = adapter.execute({
    mandate,
    quoteId: created.quote.id,
    idempotencyKey: "threshold-review-execute-002",
    now: NOW,
  });
  assert.equal(simulated.quote.policyResult, "review");
  assert.equal(simulated.quote.status, "simulated");
  assert.equal(simulated.quote.receipt?.status, "SIMULATED");
  assert.equal(simulated.quote.receipt?.moneyMoved, false);
  assert.equal(simulated.quote.receipt?.simulated, true);
  assert.equal(JSON.stringify(simulated.quote.receipt).includes("transactionHash"), false);
  assert.equal(adapter.getConsumedNonces().has(offer.nonce), true);
});

test("blocked offers and reviews unrelated to the approval threshold cannot receive quotes", () => {
  const mandate = baseMandate();
  const adapter = new SimulatedSettlementAdapter();
  const blocked = evaluatedOffer(mandate, "Aster Compute");
  assert.equal(blocked.policyResult, "blocked");
  assert.throws(
    () => adapter.createQuote({ mandate, offer: blocked, idempotencyKey: "blocked-quote-0001", now: NOW }),
    (error: unknown) => error instanceof SettlementLifecycleError && error.code === "POLICY_NOT_ELIGIBLE",
  );

  const missingPrice = evaluatedOffer(mandate);
  const reviewWithoutPrice = applyPolicyEvaluation(
    { ...missingPrice, unitPrice: undefined },
    evaluateOffer(mandate, { ...missingPrice, unitPrice: undefined }, { now: NOW }),
  );
  assert.equal(reviewWithoutPrice.policyResult, "review");
  assert.ok(reviewWithoutPrice.policyEvaluation.reasons.some((reason) => /unit price is missing/i.test(reason)));
  assert.throws(
    () => adapter.createQuote({ mandate, offer: reviewWithoutPrice, idempotencyKey: "other-review-quote-0001", now: NOW }),
    (error: unknown) => error instanceof SettlementLifecycleError && error.code === "POLICY_NOT_ELIGIBLE",
  );
});

test("server rechecks expiry, amount, asset, destination, and recipient before simulated receipt creation", () => {
  const mandate = baseMandate();
  const offer = evaluatedOffer(mandate);
  const cases: Array<{
    name: string;
    changedMandate: ProcurementMandate;
    code: string;
  }> = [
    { name: "budget amount", changedMandate: { ...mandate, budget: 4_800 }, code: "AMOUNT_INVALID" },
    { name: "asset", changedMandate: { ...mandate, asset: "USDT" }, code: "ASSET_INVALID" },
    { name: "destination", changedMandate: { ...mandate, allowedDestinations: ["ethereum-sepolia"] }, code: "DESTINATION_INVALID" },
    { name: "recipient", changedMandate: { ...mandate, approvedRecipients: ["demo:other-recipient"] }, code: "RECIPIENT_INVALID" },
  ];

  for (const item of cases) {
    const adapter = new SimulatedSettlementAdapter();
    const quote = adapter.createQuote({ mandate, offer, idempotencyKey: `quote-${item.name}-0001`, now: NOW }).quote;
    adapter.approve({ mandate, quoteId: quote.id, idempotencyKey: `approve-${item.name}-0001`, now: NOW });
    assert.throws(
      () => adapter.execute({ mandate: item.changedMandate, quoteId: quote.id, idempotencyKey: `execute-${item.name}-0001`, now: NOW }),
      (error: unknown) => error instanceof SettlementLifecycleError && error.code === item.code,
      `${item.name} must be rechecked immediately before simulated execution`,
    );
  }

  const expiredAdapter = new SimulatedSettlementAdapter();
  const expiredQuote = expiredAdapter.createQuote({ mandate, offer, idempotencyKey: "quote-expiry-check-001", now: NOW }).quote;
  expiredAdapter.approve({ mandate, quoteId: expiredQuote.id, idempotencyKey: "approve-expiry-check-001", now: NOW });
  assert.throws(
    () => expiredAdapter.execute({
      mandate,
      quoteId: expiredQuote.id,
      idempotencyKey: "execute-expiry-check-001",
      now: new Date(NOW.getTime() + 5 * 60 * 1_000),
    }),
    (error: unknown) => error instanceof SettlementLifecycleError && error.code === "QUOTE_EXPIRED",
  );
});

test("API requires explicit SIMULATED approval, keeps REVIEW visible, rejects blocked offers, and returns a no-transfer receipt", async () => {
  resetSimulatedSettlementAdapterForTests();
  getOfferRunStore().clear();
  const runResponse = await simulateOffers(
    createRequest(
      `http://localhost/api/mandates/${DEMO_MANDATE_ID}/offers/simulate`,
      { requestText: "Budget: 5,000 USDC; Approval threshold: 1,000 USDC." },
      "phase7-api-offer-run-0001",
    ),
    { params: EMPTY_PARAMS },
  );
  assert.equal(runResponse.status, 200);
  const runPayload = await runResponse.json() as {
    offerRunId: string;
    offers: Array<{ id: string; policyResult: string; amount: number }>;
  };
  const blockedOffer = runPayload.offers.find((offer) => offer.policyResult === "blocked");
  const reviewOffer = runPayload.offers.find((offer) => offer.policyResult === "review");
  assert.ok(blockedOffer);
  assert.ok(reviewOffer);
  assert.equal(reviewOffer.amount, 4_920);

  const blockedResponse = await createQuote(
    createRequest(
      `http://localhost/api/mandates/${DEMO_MANDATE_ID}/settlement/quote`,
      { mode: "SIMULATED", offerRunId: runPayload.offerRunId, offerId: blockedOffer.id },
      "phase7-api-blocked-quote-0001",
    ),
    { params: EMPTY_PARAMS },
  );
  assert.equal(blockedResponse.status, 422);

  const quoteResponse = await createQuote(
    createRequest(
      `http://localhost/api/mandates/${DEMO_MANDATE_ID}/settlement/quote`,
      { mode: "SIMULATED", offerRunId: runPayload.offerRunId, offerId: reviewOffer.id },
      "phase7-api-review-quote-0001",
    ),
    { params: EMPTY_PARAMS },
  );
  assert.equal(quoteResponse.status, 201);
  const quotePayload = await quoteResponse.json() as { quote: EvaluatedSupplierOffer & { id: string; policyResult: string; status: string; approvalStatus: string } };
  const quoteId = quotePayload.quote.id;
  assert.equal(quotePayload.quote.policyResult, "review");
  assert.equal(quotePayload.quote.status, "quoted");
  assert.equal(quotePayload.quote.approvalStatus, "pending");

  const quoteParams = { params: Promise.resolve({ id: DEMO_MANDATE_ID, quoteId }) };
  const executeBeforeApproval = await executeQuote(
    createRequest(
      `http://localhost/api/mandates/${DEMO_MANDATE_ID}/settlement/${quoteId}/execute`,
      { mode: "SIMULATED", simulateOnly: true },
      "phase7-api-early-execute-0001",
    ),
    quoteParams,
  );
  assert.equal(executeBeforeApproval.status, 403);

  const unconfirmed = await approveQuote(
    createRequest(
      `http://localhost/api/mandates/${DEMO_MANDATE_ID}/settlement/${quoteId}/approve`,
      { mode: "SIMULATED", confirmed: false },
      "phase7-api-unconfirmed-approve-0001",
    ),
    quoteParams,
  );
  assert.equal(unconfirmed.status, 400);

  const approvalResponse = await approveQuote(
    createRequest(
      `http://localhost/api/mandates/${DEMO_MANDATE_ID}/settlement/${quoteId}/approve`,
      { mode: "SIMULATED", confirmed: true },
      "phase7-api-human-approve-0001",
    ),
    quoteParams,
  );
  assert.equal(approvalResponse.status, 200);
  const approvedPayload = await approvalResponse.json() as { quote: { policyResult: string; status: string; approvalStatus: string } };
  assert.equal(approvedPayload.quote.status, "approved");
  assert.equal(approvedPayload.quote.policyResult, "review");
  assert.equal(approvedPayload.quote.approvalStatus, "approved");

  const executionResponse = await executeQuote(
    createRequest(
      `http://localhost/api/mandates/${DEMO_MANDATE_ID}/settlement/${quoteId}/execute`,
      { mode: "SIMULATED", simulateOnly: true },
      "phase7-api-simulate-execute-0001",
    ),
    quoteParams,
  );
  assert.equal(executionResponse.status, 200);
  const executionPayload = await executionResponse.json() as {
    quote: {
      policyResult: string;
      status: string;
      receipt: { status: string; simulated: boolean; moneyMoved: boolean; message: string };
    };
  };
  assert.equal(executionPayload.quote.status, "simulated");
  assert.equal(executionPayload.quote.policyResult, "review");
  assert.equal(executionPayload.quote.receipt.status, "SIMULATED");
  assert.equal(executionPayload.quote.receipt.simulated, true);
  assert.equal(executionPayload.quote.receipt.moneyMoved, false);
  assert.match(executionPayload.quote.receipt.message, /no funds were transferred/i);

  const statusResponse = await getQuoteStatus(
    new Request(`http://localhost/api/mandates/${DEMO_MANDATE_ID}/settlement/${quoteId}`),
    quoteParams,
  );
  assert.equal(statusResponse.status, 200);
  const statusPayload = await statusResponse.json() as { quote: { status: string; receipt?: { moneyMoved: boolean } } };
  assert.equal(statusPayload.quote.status, "simulated");
  assert.equal(statusPayload.quote.receipt?.moneyMoved, false);

  const auditResponse = await getMandate(
    new Request(`http://localhost/api/mandates/${DEMO_MANDATE_ID}`),
    { params: EMPTY_PARAMS },
  );
  const auditPayload = await auditResponse.json() as { auditEvents: Array<{ actor: string; summary: string; redacted: boolean }> };
  assert.ok(auditPayload.auditEvents.some((event) => event.actor === "human" && /approved simulated quote/i.test(event.summary)));
  assert.ok(auditPayload.auditEvents.some((event) => /no money moved/i.test(event.summary)));
  assert.ok(auditPayload.auditEvents.every((event) => event.redacted));
});
