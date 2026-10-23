import assert from "node:assert/strict";
import { test } from "node:test";
import type { MandateStatus, SettlementStatus } from "../src/domain/models";
import {
  DEMO_MANDATE_ID,
  DEMO_SEED_TIMESTAMP,
  createDemoSeedData,
} from "../server/persistence/demo-seed";
import {
  InMemoryProcurementRepository,
} from "../server/persistence/in-memory-repository";
import { RepositoryEntityNotFoundError } from "../server/persistence/repository";
import { InvalidStatusTransitionError } from "../src/domain/transitions";

const FIXED_TRANSITION_TIME = "2026-10-23T12:34:56.000Z";

test("demo seed is deterministic and contains three fixture offers", () => {
  const first = createDemoSeedData();
  const second = createDemoSeedData();

  assert.deepEqual(first, second);
  assert.equal(first.mandates[0]?.id, DEMO_MANDATE_ID);
  assert.equal(first.offers.length, 3);
  assert.deepEqual(
    first.offers.map((offer) => offer.policyResult),
    ["blocked", "blocked", "pass"],
  );
  assert.equal(first.auditEvents[0]?.occurredAt, DEMO_SEED_TIMESTAMP);
  assert.equal(first.settlements[0]?.mode, "simulated");
});

test("repository reads seed records and protects stored values with copies", async () => {
  const repository = new InMemoryProcurementRepository();
  const mandates = await repository.listMandates();
  const offers = await repository.listOffers(DEMO_MANDATE_ID);
  const settlement = await repository.getSettlement(DEMO_MANDATE_ID);

  assert.equal(mandates.length, 1);
  assert.equal(mandates[0]?.status, "review");
  assert.equal(offers.length, 3);
  assert.equal(settlement?.status, "not_started");

  if (mandates[0]) {
    mandates[0].status = "settled";
  }
  offers[0]!.riskReasons.push("caller mutation");
  const storedMandate = await repository.getMandate(DEMO_MANDATE_ID);
  const storedOffers = await repository.listOffers(DEMO_MANDATE_ID);
  assert.equal(storedMandate?.status, "review");
  assert.equal(storedOffers[0]?.riskReasons.includes("caller mutation"), false);
});

test("valid mandate transition updates state and appends a redacted audit event", async () => {
  const repository = new InMemoryProcurementRepository();
  const mandate = await repository.transitionMandateStatus(
    DEMO_MANDATE_ID,
    "approved",
    FIXED_TRANSITION_TIME,
  );
  const events = await repository.listAuditEvents(DEMO_MANDATE_ID);

  assert.equal(mandate.status, "approved");
  assert.equal(events.length, 2);
  assert.equal(events[1]?.eventType, "mandate_status_changed");
  assert.equal(events[1]?.occurredAt, FIXED_TRANSITION_TIME);
  assert.equal(events[1]?.redacted, true);
});

test("invalid mandate transition is rejected without changing state or audit", async () => {
  const repository = new InMemoryProcurementRepository();

  await assert.rejects(
    repository.transitionMandateStatus(
      DEMO_MANDATE_ID,
      "settled" as MandateStatus,
      FIXED_TRANSITION_TIME,
    ),
    InvalidStatusTransitionError,
  );

  assert.equal((await repository.getMandate(DEMO_MANDATE_ID))?.status, "review");
  assert.equal((await repository.listAuditEvents(DEMO_MANDATE_ID)).length, 1);
});

test("valid settlement transitions work and invalid transitions do not mutate", async () => {
  const repository = new InMemoryProcurementRepository();
  const quoted = await repository.transitionSettlementStatus(
    DEMO_MANDATE_ID,
    "quoted",
    FIXED_TRANSITION_TIME,
  );
  assert.equal(quoted.status, "quoted");

  await assert.rejects(
    repository.transitionSettlementStatus(
      DEMO_MANDATE_ID,
      "settled" as SettlementStatus,
      FIXED_TRANSITION_TIME,
    ),
    InvalidStatusTransitionError,
  );

  assert.equal((await repository.getSettlement(DEMO_MANDATE_ID))?.status, "quoted");
  const events = await repository.listAuditEvents(DEMO_MANDATE_ID);
  assert.equal(events.length, 2);
  assert.equal(events[1]?.eventType, "settlement_status_changed");
});

test("repository reports missing mandate and settlement records", async () => {
  const seed = createDemoSeedData();
  seed.mandates = [];
  seed.offers = [];
  seed.settlements = [];
  seed.auditEvents = [];
  const repository = new InMemoryProcurementRepository(seed);

  await assert.rejects(
    repository.transitionMandateStatus("missing", "open"),
    RepositoryEntityNotFoundError,
  );
  await assert.rejects(
    repository.transitionSettlementStatus("missing", "quoted"),
    RepositoryEntityNotFoundError,
  );
});
