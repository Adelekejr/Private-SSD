import type { MandateStatus, SettlementStatus } from "./models";

export type TransitionEntity = "mandate" | "settlement";

const mandateTransitions: Record<MandateStatus, readonly MandateStatus[]> = {
  draft: ["open", "blocked"],
  open: ["review", "blocked"],
  review: ["approved", "blocked"],
  approved: ["settling", "blocked"],
  settling: ["settled", "blocked"],
  settled: [],
  blocked: [],
};

const settlementTransitions: Record<SettlementStatus, readonly SettlementStatus[]> = {
  not_started: ["quoted", "simulated"],
  quoted: ["approved", "simulated"],
  approved: ["deposit_pending", "simulated"],
  deposit_pending: ["settling", "refunded"],
  settling: ["settled", "refunded"],
  settled: [],
  refunded: [],
  simulated: [],
};

export class InvalidStatusTransitionError extends Error {
  readonly entity: TransitionEntity;
  readonly from: string;
  readonly to: string;

  constructor(entity: TransitionEntity, from: string, to: string) {
    super(`Invalid ${entity} status transition: ${from} -> ${to}`);
    this.name = "InvalidStatusTransitionError";
    this.entity = entity;
    this.from = from;
    this.to = to;
  }
}

export function canTransitionMandateStatus(
  from: MandateStatus,
  to: MandateStatus,
): boolean {
  return mandateTransitions[from].includes(to);
}

export function assertMandateStatusTransition(
  from: MandateStatus,
  to: MandateStatus,
): void {
  if (!canTransitionMandateStatus(from, to)) {
    throw new InvalidStatusTransitionError("mandate", from, to);
  }
}

export function canTransitionSettlementStatus(
  from: SettlementStatus,
  to: SettlementStatus,
): boolean {
  return settlementTransitions[from].includes(to);
}

export function assertSettlementStatusTransition(
  from: SettlementStatus,
  to: SettlementStatus,
): void {
  if (!canTransitionSettlementStatus(from, to)) {
    throw new InvalidStatusTransitionError("settlement", from, to);
  }
}
