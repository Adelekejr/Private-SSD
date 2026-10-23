import type { PrivateInferenceResult } from "../../src/domain/inference";

/**
 * Provider-neutral boundary for processing sensitive procurement input.
 * Implementations must return provenance explicitly and must not log input data.
 */
export interface PrivateInferenceAdapter<Input, Output> {
  readonly id: string;
  infer(input: Input): Promise<PrivateInferenceResult<Output>>;
}
