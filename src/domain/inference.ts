export type InferenceCheckStatus =
  | "verified"
  | "unverified"
  | "unavailable"
  | "not_performed";

export interface InferenceStatus {
  mode: "simulated" | "provider";
  displayLabel: "SIMULATED_PRIVATE_AI" | "PRIVATE_AI";
  adapter: string;
  providerContacted: boolean;
  verification: InferenceCheckStatus;
  attestation: InferenceCheckStatus;
  detail: string;
}

export interface PrivateInferenceResult<Output> {
  output: Output;
  status: InferenceStatus;
}
