import assert from "node:assert/strict";
import { test } from "node:test";
import { createDemoSeedData } from "../server/persistence/demo-seed";
import { SimulatedPrivateInferenceAdapter } from "../server/privacy/simulated-private-adapter";

test("simulated private adapter is deterministic and reports that no provider, verification, or attestation occurred", async () => {
  const adapter = new SimulatedPrivateInferenceAdapter();
  const mandate = createDemoSeedData().mandates[0]!;
  const input = {
    requestText: "Budget: 5,000 USDC; maximum unit price: 0.15 USDC.",
    mandate,
  };

  const first = await adapter.infer(input);
  const second = await adapter.infer(input);

  assert.deepEqual(first.output, second.output);
  assert.deepEqual(first.status, {
    mode: "simulated",
    displayLabel: "SIMULATED_PRIVATE_AI",
    adapter: "deterministic-local-parser",
    providerContacted: false,
    verification: "not_performed",
    attestation: "not_performed",
    detail:
      "Deterministic local rules processed this request; no AI model or external provider was contacted.",
  });
});
