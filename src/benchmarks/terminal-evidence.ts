import type { HarnessRunResult } from "../app/run-harness.js";
import type { DevStateType } from "../state.js";
import type { BenchmarkExpectedOutcome } from "./contracts.js";

export type HarnessTerminalKind =
  | "completed_with_plan"
  | "blocked_with_plan"
  | "planning_exhausted";

type HarnessTerminalEvidenceBase = Readonly<{
  status: DevStateType["status"];
  failureReason: string | null;
  planningAttempts: number;
  maxPlanningAttempts: number;
  reviewAttempts: number;
}>;

export type HarnessCompletedWithPlanEvidence =
  HarnessTerminalEvidenceBase &
    Readonly<{
      kind: "completed_with_plan";
      refinedPlanOutcome: Exclude<BenchmarkExpectedOutcome, "blocked">;
    }>;

export type HarnessBlockedWithPlanEvidence =
  HarnessTerminalEvidenceBase &
    Readonly<{
      kind: "blocked_with_plan";
      refinedPlanOutcome: "blocked";
    }>;

export type HarnessPlanningExhaustedEvidence =
  HarnessTerminalEvidenceBase &
    Readonly<{
      kind: "planning_exhausted";
      refinedPlanOutcome: null;
    }>;

export type HarnessTerminalEvidence =
  | HarnessCompletedWithPlanEvidence
  | HarnessBlockedWithPlanEvidence
  | HarnessPlanningExhaustedEvidence;

export class HarnessTerminalEvidenceDerivationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HarnessTerminalEvidenceDerivationError";
  }
}

function baseEvidence(
  state: HarnessRunResult["state"],
): HarnessTerminalEvidenceBase {
  return {
    status: state.status,
    failureReason: state.failureReason ?? null,
    planningAttempts: state.planningAttempts,
    maxPlanningAttempts: state.maxPlanningAttempts,
    reviewAttempts: state.reviewAttempts,
  };
}

export function deriveHarnessTerminalEvidence(
  harnessResult: HarnessRunResult,
): HarnessTerminalEvidence {
  const state = harnessResult.state;
  const refinedPlan = state.refinedPlan;
  const base = baseEvidence(state);

  if (!refinedPlan) {
    if (
      state.status === "failed" &&
      state.planningAttempts >= state.maxPlanningAttempts
    ) {
      return {
        ...base,
        kind: "planning_exhausted",
        refinedPlanOutcome: null,
      };
    }

    throw new HarnessTerminalEvidenceDerivationError(
      "Cannot derive supported Harness terminal evidence without refinedPlan before planning exhaustion.",
    );
  }

  if (refinedPlan.outcome === "blocked") {
    if (state.status !== "failed" || !state.failureReason) {
      throw new HarnessTerminalEvidenceDerivationError(
        "Blocked terminal evidence requires failed state with failureReason.",
      );
    }

    return {
      ...base,
      kind: "blocked_with_plan",
      refinedPlanOutcome: "blocked",
    };
  }

  if (
    refinedPlan.outcome === "changes_required" ||
    refinedPlan.outcome === "already_satisfied"
  ) {
    if (state.status !== "completed" || state.failureReason !== undefined) {
      throw new HarnessTerminalEvidenceDerivationError(
        `${refinedPlan.outcome} terminal evidence requires completed state without failureReason.`,
      );
    }

    return {
      ...base,
      kind: "completed_with_plan",
      refinedPlanOutcome: refinedPlan.outcome,
    };
  }

  throw new HarnessTerminalEvidenceDerivationError(
    "Unsupported refined-plan terminal outcome.",
  );
}
