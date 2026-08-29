import type { HarnessRunResult } from "../app/run-harness.js";
import type { BenchmarkRunObservation } from "./acceptance.js";
import type { BenchmarkExpectedOutcome } from "./contracts.js";
import type { BenchmarkValidationResult } from "./validation.js";

export type BenchmarkObservationEvidence = Readonly<{
  harnessResult: HarnessRunResult;
  filesChanged: readonly string[];
  validation: BenchmarkValidationResult;
  humanInterventionRequired: boolean;
}>;

export class BenchmarkObservationDerivationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BenchmarkObservationDerivationError";
  }
}

function deriveFinalOutcome(
  harnessResult: HarnessRunResult,
): BenchmarkExpectedOutcome {
  const state = harnessResult.state;
  const refinedPlan = state.refinedPlan;

  if (!refinedPlan) {
    throw new BenchmarkObservationDerivationError(
      "Cannot derive benchmark outcome without refinedPlan.",
    );
  }

  if (refinedPlan.outcome === "blocked") {
    if (state.status !== "failed" || !state.failureReason) {
      throw new BenchmarkObservationDerivationError(
        "Blocked benchmark outcome requires failed terminal state with failureReason.",
      );
    }

    return "blocked";
  }

  if (
    refinedPlan.outcome === "already_satisfied" ||
    refinedPlan.outcome === "changes_required"
  ) {
    if (state.status !== "completed" || state.failureReason !== undefined) {
      throw new BenchmarkObservationDerivationError(
        `${refinedPlan.outcome} benchmark outcome requires completed terminal state without failureReason.`,
      );
    }

    return refinedPlan.outcome;
  }

  throw new BenchmarkObservationDerivationError(
    "Unsupported refined-plan benchmark outcome.",
  );
}

export function deriveBenchmarkRunObservation(
  evidence: BenchmarkObservationEvidence,
): BenchmarkRunObservation {
  return {
    finalOutcome: deriveFinalOutcome(evidence.harnessResult),
    filesChanged: [...evidence.filesChanged],
    validationPassed: evidence.validation.passed,
    humanInterventionRequired: evidence.humanInterventionRequired,
  };
}
