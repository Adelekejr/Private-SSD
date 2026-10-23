import assert from "node:assert/strict";
import { test } from "node:test";
import type { ProcurementMandate, SupplierOffer } from "../src/domain/models";
import { createDemoSeedData, DEMO_MANDATE_ID } from "../server/persistence/demo-seed";
import { checkOfferBeforeExecution, evaluateOffer } from "../server/policy/policy-engine";
import { InMemoryIdempotencyStore } from "../server/policy/idempotency";

const NOW = new Date("2026-10-23T20:00:00.000Z");

function mandate(overrides: Partial<ProcurementMandate> = {}): ProcurementMandate {
  return {
    ...structuredClone(createDemoSeedData().mandates[0]!),
    approvalThreshold: 5_000,
    ...overrides,
  };
}

function offer(overrides: Partial<SupplierOffer> = {}): SupplierOffer {
  return {
    id: "offer-policy-test-001",
    mandateId: DEMO_MANDATE_ID,
    supplierAgent: "Test Supplier",
    amount: 500,
    unitPrice: 0.1,
    asset: "USDC",
    destinationChain: "near-testnet",
    recipient: "demo:ember-compute-recipient",
    reliabilityScore: 0.98,
    evidence: ["Local test fixture."],
    policyResult: "not_evaluated",
    riskReasons: [],
    expiresAt: "2026-10-23T21:00:00.000Z",
    nonce: "nonce-policy-001",
    ...overrides,
  };
}

function supplierResponse(candidate: SupplierOffer): Record<string, unknown> {
  return {
    id: candidate.id,
    mandateId: candidate.mandateId,
    supplierAgent: candidate.supplierAgent,
    amount: candidate.amount,
    ...(candidate.unitPrice === undefined ? {} : { unitPrice: candidate.unitPrice }),
    asset: candidate.asset,
    destinationChain: candidate.destinationChain,
    recipient: candidate.recipient,
    reliabilityScore: candidate.reliabilityScore,
    evidence: candidate.evidence,
    riskNotes: candidate.riskReasons,
    expiresAt: candidate.expiresAt,
    nonce: candidate.nonce,
  };
}

test("a fully compliant offer passes below the approval threshold", () => {
  const result = evaluateOffer(mandate(), offer(), { now: NOW });
  assert.equal(result.result, "pass");
  assert.equal(result.approvalRequired, false);
  assert.deepEqual(result.reasons, []);
});

test("offer amount above the mandate budget is blocked", () => {
  const result = evaluateOffer(mandate(), offer({ amount: 5_001 }), { now: NOW });
  assert.equal(result.result, "blocked");
  assert.ok(result.reasons.some((reason) => reason.includes("budget")));
});

test("unit price above the mandate maximum is blocked", () => {
  const result = evaluateOffer(mandate(), offer({ unitPrice: 0.16 }), { now: NOW });
  assert.equal(result.result, "blocked");
  assert.ok(result.reasons.some((reason) => /unit price/i.test(reason)));
});

test("a missing unit price when a maximum is configured requires review, not a pass", () => {
  const result = evaluateOffer(mandate(), offer({ unitPrice: undefined }), { now: NOW });
  assert.equal(result.result, "review");
  assert.equal(result.approvalRequired, false);
  assert.ok(result.reasons.some((reason) => reason.includes("cannot be verified")));
});

test("asset mismatch is blocked", () => {
  const result = evaluateOffer(mandate(), offer({ asset: "USDT" }), { now: NOW });
  assert.equal(result.result, "blocked");
  assert.ok(result.reasons.some((reason) => reason.includes("asset")));
});

test("an unapproved recipient is blocked", () => {
  const result = evaluateOffer(mandate(), offer({ recipient: "demo:other-recipient" }), { now: NOW });
  assert.equal(result.result, "blocked");
  assert.ok(result.reasons.some((reason) => reason.includes("Recipient is not approved")));
});

test("a disallowed destination chain is blocked", () => {
  const result = evaluateOffer(mandate(), offer({ destinationChain: "ethereum-mainnet" }), { now: NOW });
  assert.equal(result.result, "blocked");
  assert.ok(result.reasons.some((reason) => reason.includes("Destination chain")));
});

test("reliability below the mandate minimum is blocked", () => {
  const result = evaluateOffer(mandate(), offer({ reliabilityScore: 0.94 }), { now: NOW });
  assert.equal(result.result, "blocked");
  assert.ok(result.reasons.some((reason) => reason.includes("reliability")));
});

test("expiry at or before the evaluation clock is blocked", () => {
  const result = evaluateOffer(
    mandate(),
    offer({ expiresAt: NOW.toISOString() }),
    { now: NOW },
  );
  assert.equal(result.result, "blocked");
  assert.ok(result.reasons.some((reason) => reason.includes("expired")));
});

test("a previously consumed nonce is blocked as a replay", () => {
  const candidate = offer();
  const result = evaluateOffer(mandate(), candidate, {
    now: NOW,
    consumedNonces: new Set([candidate.nonce!]),
  });
  assert.equal(result.result, "blocked");
  assert.ok(result.reasons.some((reason) => reason.includes("nonce has already been used")));
});

test("amount above the approval threshold is review-required, not blocked or eligible", () => {
  const result = evaluateOffer(
    mandate({ approvalThreshold: 1_000 }),
    offer({ amount: 1_001 }),
    { now: NOW },
  );
  assert.equal(result.result, "review");
  assert.equal(result.approvalRequired, true);
  assert.ok(result.reasons.some((reason) => reason.includes("human approval")));
});

test("the server guard rechecks against current mandate terms and does not execute or consume a nonce", () => {
  const candidate = offer({ amount: 500 });
  const body = supplierResponse(candidate);
  const beforeChange = checkOfferBeforeExecution(mandate(), body, { now: NOW });
  assert.equal(beforeChange.status, "eligible");

  const afterChange = checkOfferBeforeExecution(
    mandate({ budget: 400, approvalThreshold: 400 }),
    body,
    { now: NOW },
  );
  assert.equal(afterChange.status, "blocked");
  if (afterChange.status === "blocked") {
    assert.ok(afterChange.policyEvaluation?.reasons.some((reason) => reason.includes("budget")));
  }

  const sameNonceStillAvailable = checkOfferBeforeExecution(mandate(), body, { now: NOW });
  assert.equal(sameNonceStillAvailable.status, "eligible");
});

test("the server guard reports approval-required separately from policy block and eligibility", () => {
  const candidate = offer({ amount: 1_500 });
  const result = checkOfferBeforeExecution(
    mandate({ approvalThreshold: 1_000 }),
    supplierResponse(candidate),
    { now: NOW },
  );
  assert.equal(result.status, "approval_required");
});

test("the idempotency store replays matching requests and conflicts on changed input", async () => {
  const store = new InMemoryIdempotencyStore<{ result: number }>();
  let calls = 0;
  const create = () => ({ result: ++calls });
  const first = await store.run("request-123", { value: "same" }, create);
  const replay = await store.run("request-123", { value: "same" }, create);
  const conflict = await store.run("request-123", { value: "different" }, create);

  assert.equal(first.status, "created");
  assert.equal(replay.status, "replayed");
  assert.equal(conflict.status, "conflict");
  assert.equal(calls, 1);
});
