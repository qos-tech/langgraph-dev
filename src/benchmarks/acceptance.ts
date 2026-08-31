import type {
  BenchmarkExpectedOutcome,
  BenchmarkTask,
} from "./contracts.js";
import type { HarnessTerminalEvidence } from "./terminal-evidence.js";

export type BenchmarkRunObservation = Readonly<{
  finalOutcome: BenchmarkExpectedOutcome | null;
  terminal?: HarnessTerminalEvidence;
  filesChanged: readonly string[];
  validationPassed: boolean;
  humanInterventionRequired: boolean;
}>;

export type BenchmarkAcceptanceFailure =
  | "terminal_outcome_unavailable"
  | "unexpected_outcome"
  | "unexpected_changes"
  | "validation_failed"
  | "human_intervention_required";

export type BenchmarkAcceptanceResult = Readonly<{
  accepted: boolean;
  failures: readonly BenchmarkAcceptanceFailure[];
}>;

export function evaluateBenchmarkAcceptance(
  benchmark: BenchmarkTask,
  observation: BenchmarkRunObservation,
): BenchmarkAcceptanceResult {
  const failures: BenchmarkAcceptanceFailure[] = [];

  if (observation.finalOutcome === null) {
    failures.push("terminal_outcome_unavailable");
  } else if (observation.finalOutcome !== benchmark.expectedOutcome) {
    failures.push("unexpected_outcome");
  }

  if (
    benchmark.expectedOutcome === "already_satisfied" &&
    observation.filesChanged.length > 0
  ) {
    failures.push("unexpected_changes");
  }

  if (!observation.validationPassed) {
    failures.push("validation_failed");
  }

  if (observation.humanInterventionRequired) {
    failures.push("human_intervention_required");
  }

  return {
    accepted: failures.length === 0,
    failures,
  };
}
