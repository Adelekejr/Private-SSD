import { parseBuyerRequest, type BuyerRequestProposal } from "../../src/domain/buyer-request-parser";
import type { ProcurementMandate } from "../../src/domain/models";
import type { PrivateInferenceResult } from "../../src/domain/inference";
import type { PrivateInferenceAdapter } from "./inference-adapter";

export interface BuyerRequestInferenceInput {
  requestText: string;
  mandate: ProcurementMandate;
}

/**
 * Deterministic fallback for local demos. This is not an AI model or a private
 * inference provider; the label is retained only to distinguish it from a live
 * provider path while its provenance says exactly what occurred.
 */
export class SimulatedPrivateInferenceAdapter
  implements PrivateInferenceAdapter<BuyerRequestInferenceInput, BuyerRequestProposal>
{
  readonly id = "deterministic-local-parser";

  async infer({ requestText, mandate }: BuyerRequestInferenceInput): Promise<PrivateInferenceResult<BuyerRequestProposal>> {
    return {
      output: parseBuyerRequest(requestText, mandate),
      status: {
        mode: "simulated",
        displayLabel: "SIMULATED_PRIVATE_AI",
        adapter: this.id,
        providerContacted: false,
        verification: "not_performed",
        attestation: "not_performed",
        detail: "Deterministic local rules processed this request; no AI model or external provider was contacted.",
      },
    };
  }
}
