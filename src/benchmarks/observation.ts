import type { HarnessRunResult } from "../app/run-harness.js";
import type { BenchmarkRunObservation } from "./acceptance.js";
import type { BenchmarkExpectedOutcome } from "./contracts.js";
import {
  deriveHarnessTerminalEvidence,
  HarnessTerminalEvidenceDerivationError,
  type HarnessTerminalEvidence,
} from "./terminal-evidence.js";
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
  terminal: HarnessTerminalEvidence,
): BenchmarkExpectedOutcome | null {
  if (terminal.kind === "planning_exhausted") {
    return null;
  }

  return terminal.refinedPlanOutcome;
}

export function deriveBenchmarkRunObservation(
  evidence: BenchmarkObservationEvidence,
): BenchmarkRunObservation {
  let terminal: HarnessTerminalEvidence;

  try {
    terminal = deriveHarnessTerminalEvidence(evidence.harnessResult);
  } catch (error) {
    if (error instanceof HarnessTerminalEvidenceDerivationError) {
      throw new BenchmarkObservationDerivationError(error.message);
    }

    throw error;
  }

  return {
    finalOutcome: deriveFinalOutcome(terminal),
    terminal,
    filesChanged: [...evidence.filesChanged],
    validationPassed: evidence.validation.passed,
    humanInterventionRequired: evidence.humanInterventionRequired,
  };
}
