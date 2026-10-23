import assert from "node:assert/strict";
import { test } from "node:test";
import type {
  AuditEvent,
  MandateTerms,
  NewProcurementMandate,
  ProcurementMandate,
} from "../src/domain/models";
import {
  buildMandateConstraints,
  parseMandateTerms,
} from "../src/domain/mandate-validation";
import { GET as getMandate, PUT as updateMandate } from "../src/app/api/mandates/[id]/route";
import { POST as createMandate } from "../src/app/api/mandates/route";
import {
  DEMO_MANDATE_ID,
  createDemoSeedData,
} from "../server/persistence/demo-seed";
import { InMemoryProcurementRepository } from "../server/persistence/in-memory-repository";
import { RepositoryIdempotencyConflictError } from "../server/persistence/repository";

const FIXED_TIME = "2026-10-23T12:34:56.000Z";

const validTerms: MandateTerms = {
  purpose: "Cloud compute for a month",
  asset: "USDC",
  budget: 5_000,
  maxUnitPrice: 0.15,
  minReliability: 0.95,
  allowedDestinations: ["near-testnet"],
  approvedRecipients: ["demo:approved-recipient"],
  approvalThreshold: 1_000,
  privacyMode: "simulated",
};

function buildNewMandate(terms: MandateTerms): NewProcurementMandate {
  return {
    ...terms,
    buyerAccount: "demo-finance-workspace",
    constraints: buildMandateConstraints(terms),
    status: "draft",
  };
}

function request(url: string, method: string, body: unknown, key: string) {
  return new Request(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": key,
    },
    body: JSON.stringify(body),
  });
}

test("shared mandate validation normalizes terms and derives typed constraints", () => {
  const parsed = parseMandateTerms({ ...validTerms, purpose: "  Cloud compute  ", asset: "usdc" });
  assert.equal(parsed.success, true);
  if (!parsed.success) return;

  assert.equal(parsed.data.purpose, "Cloud compute");
  assert.equal(parsed.data.asset, "USDC");
  assert.deepEqual(
    buildMandateConstraints(parsed.data).map((constraint) => constraint.kind),
    [
      "budget",
      "max_unit_price",
      "min_reliability",
      "allowed_destinations",
      "approved_recipients",
      "approval_threshold",
    ],
  );
});

test("shared mandate validation rejects invalid numbers, threshold, and duplicate lists", () => {
  const parsed = parseMandateTerms({
    ...validTerms,
    budget: 0,
    minReliability: 1.2,
    approvalThreshold: 5_001,
    allowedDestinations: ["near-testnet", "NEAR-TESTNET"],
  });
  assert.equal(parsed.success, false);
  if (parsed.success) return;

  assert.ok(parsed.errors.budget);
  assert.ok(parsed.errors.minReliability);
  assert.ok(parsed.errors.allowedDestinations);

  const thresholdParsed = parseMandateTerms({
    ...validTerms,
    approvalThreshold: 5_001,
  });
  assert.equal(thresholdParsed.success, false);
  if (!thresholdParsed.success) {
    assert.ok(thresholdParsed.errors.approvalThreshold);
  }
});

test("repository creates mandates with redacted human audit and replays writes idempotently", async () => {
  const repository = new InMemoryProcurementRepository();
  const createInput = buildNewMandate(validTerms);
  const created = await repository.createMandate(createInput, "phase3-create-key-001", FIXED_TIME);
  const replayed = await repository.createMandate(createInput, "phase3-create-key-001", FIXED_TIME);
  const events = await repository.listAuditEvents(created.id);

  assert.equal(created.id, replayed.id);
  assert.equal(created.status, "draft");
  assert.equal(events.length, 1);
  assert.equal(events[0]?.actor, "human");
  assert.equal(events[0]?.eventType, "mandate_created");
  assert.equal(events[0]?.occurredAt, FIXED_TIME);
  assert.equal(events[0]?.redacted, true);
  assert.equal(events[0]?.summary.includes(validTerms.purpose), false);
  assert.equal(events[0]?.summary.includes(validTerms.approvedRecipients[0]!), false);

  await assert.rejects(
    repository.createMandate(
      buildNewMandate({ ...validTerms, purpose: "Different purpose" }),
      "phase3-create-key-001",
      FIXED_TIME,
    ),
    RepositoryIdempotencyConflictError,
  );
  assert.equal((await repository.listMandates()).length, 2);
});

test("repository edits mandate constraints, preserves identity/status, and audits changed fields only", async () => {
  const repository = new InMemoryProcurementRepository(createDemoSeedData());
  const revised: MandateTerms = {
    ...validTerms,
    purpose: "Sensitive revised compute purpose",
    asset: "DAI",
    budget: 6_000,
    allowedDestinations: ["near-testnet", "ethereum-sepolia"],
    approvedRecipients: ["demo:confidential-recipient"],
  };
  const updated = await repository.updateMandate(
    DEMO_MANDATE_ID,
    revised,
    "phase3-update-key-001",
    FIXED_TIME,
  );
  const events = await repository.listAuditEvents(DEMO_MANDATE_ID);
  const event = events.at(-1);

  assert.equal(updated.id, DEMO_MANDATE_ID);
  assert.equal(updated.status, "review");
  assert.equal(updated.asset, "DAI");
  assert.equal(updated.constraints.find((item) => item.kind === "budget")?.amount, 6_000);
  assert.deepEqual(
    updated.constraints.find((item) => item.kind === "approved_recipients")?.recipients,
    ["demo:confidential-recipient"],
  );
  assert.equal(event?.actor, "human");
  assert.equal(event?.eventType, "mandate_updated");
  assert.match(event?.summary ?? "", /purpose/);
  assert.match(event?.summary ?? "", /budget/);
  assert.equal(event?.summary.includes(revised.purpose), false);
  assert.equal(event?.summary.includes(revised.approvedRecipients[0]!), false);

  await assert.rejects(
    repository.updateMandate(
      DEMO_MANDATE_ID,
      { ...revised, purpose: "Conflicting replacement" },
      "phase3-update-key-001",
      FIXED_TIME,
    ),
    RepositoryIdempotencyConflictError,
  );
});

test("mandate API validates server writes and records create/update audit entries", async () => {
  const invalidResponse = await createMandate(
    request(
      "http://localhost/api/mandates",
      "POST",
      { ...validTerms, budget: -1 },
      "phase3-invalid-key",
    ),
  );
  assert.equal(invalidResponse.status, 400);
  const invalidPayload = (await invalidResponse.json()) as { errors?: { budget?: string } };
  assert.ok(invalidPayload.errors?.budget);

  const createKey = "phase3-route-create-key";
  const response = await createMandate(
    request("http://localhost/api/mandates", "POST", validTerms, createKey),
  );
  assert.equal(response.status, 201);
  const payload = (await response.json()) as {
    mandate: ProcurementMandate;
    auditEvents: AuditEvent[];
  };
  assert.equal(payload.mandate.status, "draft");
  assert.equal(payload.auditEvents[0]?.eventType, "mandate_created");

  const replay = await createMandate(
    request("http://localhost/api/mandates", "POST", validTerms, createKey),
  );
  const replayPayload = (await replay.json()) as { mandate: ProcurementMandate };
  assert.equal(replayPayload.mandate.id, payload.mandate.id);

  const editedTerms = { ...validTerms, purpose: "Updated API test purpose", budget: 4_500 };
  const updateResponse = await updateMandate(
    request(
      `http://localhost/api/mandates/${payload.mandate.id}`,
      "PUT",
      editedTerms,
      "phase3-route-update-key",
    ),
    { params: Promise.resolve({ id: payload.mandate.id }) },
  );
  assert.equal(updateResponse.status, 200);

  const getResponse = await getMandate(
    new Request(`http://localhost/api/mandates/${payload.mandate.id}`),
    { params: Promise.resolve({ id: payload.mandate.id }) },
  );
  assert.equal(getResponse.status, 200);
  const stored = (await getResponse.json()) as {
    mandate: ProcurementMandate;
    auditEvents: AuditEvent[];
  };
  assert.equal(stored.mandate.budget, 4_500);
  assert.deepEqual(
    stored.auditEvents.map((event) => event.eventType),
    ["mandate_created", "mandate_updated"],
  );
  assert.equal(stored.auditEvents[1]?.summary.includes(editedTerms.purpose), false);
});
