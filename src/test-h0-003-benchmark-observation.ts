import assert from "node:assert/strict";
import type { HarnessRunResult } from "./app/run-harness.js";
import {
  BenchmarkObservationDerivationError,
  deriveBenchmarkRunObservation,
} from "./benchmarks/observation.js";
import type { BenchmarkValidationResult } from "./benchmarks/validation.js";

const validationPassed: BenchmarkValidationResult = {
  passed: true,
  commands: [],
};

function harnessResult(
  outcome: "changes_required" | "already_satisfied" | "blocked" | undefined,
  status: "completed" | "failed",
  failureReason?: string,
): HarnessRunResult {
  return {
    state: {
      refinedPlan:
        outcome === undefined
          ? undefined
          : {
              outcome,
              understanding: "fixture",
              changes:
                outcome === "changes_required"
                  ? [
                      {
                        file: "src/example.ts",
                        action: "modify",
                        description: "fixture change",
                      },
                    ]
                  : [],
              validation: [
                {
                  command: "npm test",
                  expected: "tests pass",
                },
              ],
              blockingUnknowns:
                outcome === "blocked" ? ["missing external evidence"] : [],
              nonBlockingNotes: [],
            },
      status,
      failureReason,
    },
  } as unknown as HarnessRunResult;
}

assert.deepEqual(
  deriveBenchmarkRunObservation({
    harnessResult: harnessResult("changes_required", "completed"),
    filesChanged: ["src/example.ts"],
    validation: validationPassed,
    humanInterventionRequired: false,
  }),
  {
    finalOutcome: "changes_required",
    filesChanged: ["src/example.ts"],
    validationPassed: true,
    humanInterventionRequired: false,
  },
);

assert.deepEqual(
  deriveBenchmarkRunObservation({
    harnessResult: harnessResult("already_satisfied", "completed"),
    filesChanged: [],
    validation: validationPassed,
    humanInterventionRequired: false,
  }),
  {
    finalOutcome: "already_satisfied",
    filesChanged: [],
    validationPassed: true,
    humanInterventionRequired: false,
  },
);

assert.deepEqual(
  deriveBenchmarkRunObservation({
    harnessResult: harnessResult(
      "blocked",
      "failed",
      "missing external evidence",
    ),
    filesChanged: [],
    validation: validationPassed,
    humanInterventionRequired: false,
  }),
  {
    finalOutcome: "blocked",
    filesChanged: [],
    validationPassed: true,
    humanInterventionRequired: false,
  },
  "blocked must remain a valid automated benchmark outcome without implying human intervention",
);

const validationFailed: BenchmarkValidationResult = {
  passed: false,
  commands: [
    {
      command: "npm test",
      exitCode: 1,
      stdout: "",
      stderr: "failure",
    },
  ],
};

assert.deepEqual(
  deriveBenchmarkRunObservation({
    harnessResult: harnessResult("changes_required", "completed"),
    filesChanged: ["src/example.ts"],
    validation: validationFailed,
    humanInterventionRequired: true,
  }),
  {
    finalOutcome: "changes_required",
    filesChanged: ["src/example.ts"],
    validationPassed: false,
    humanInterventionRequired: true,
  },
  "validation and intervention evidence must pass through without semantic inference",
);

for (const invalid of [
  harnessResult(undefined, "completed"),
  harnessResult("changes_required", "failed", "unexpected failure"),
  harnessResult("already_satisfied", "failed", "unexpected failure"),
  harnessResult("blocked", "completed"),
  harnessResult("changes_required", "completed", "unexpected failure"),
  harnessResult("already_satisfied", "completed", "unexpected failure"),
]) {
  assert.throws(
    () =>
      deriveBenchmarkRunObservation({
        harnessResult: invalid,
        filesChanged: [],
        validation: validationPassed,
        humanInterventionRequired: false,
      }),
    BenchmarkObservationDerivationError,
  );
}

console.log("✅ H0-003 Step 7 benchmark observation derivation passed.");
