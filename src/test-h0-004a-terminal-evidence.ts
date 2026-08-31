import assert from "node:assert/strict";
import type { HarnessRunResult } from "./app/run-harness.js";
import { evaluateBenchmarkAcceptance } from "./benchmarks/acceptance.js";
import {
  BENCHMARK_TASK_SCHEMA_VERSION,
  defineBenchmarkTask,
} from "./benchmarks/contracts.js";
import { createBenchmarkComparisonRecord } from "./benchmarks/comparison.js";
import type { CompleteBenchmarkRunnerResult } from "./benchmarks/complete-runner.js";
import {
  BenchmarkObservationDerivationError,
  deriveBenchmarkRunObservation,
} from "./benchmarks/observation.js";
import {
  deriveHarnessTerminalEvidence,
  HarnessTerminalEvidenceDerivationError,
} from "./benchmarks/terminal-evidence.js";
import { runBenchmarkSuite } from "./benchmarks/suite-runner.js";
import {
  RUN_TELEMETRY_SCHEMA_VERSION,
  type RunTelemetry,
} from "./telemetry/contracts.js";

const benchmark = defineBenchmarkTask({
  schemaVersion: BENCHMARK_TASK_SCHEMA_VERSION,
  id: "h0-004a-planning-exhausted",
  title: "Planning exhaustion fixture",
  difficulty: "architectural",
  task: "Investigate an architectural condition.",
  repository: { id: "fixture", revision: "v1" },
  constraints: [],
  successCriteria: ["Outcome is observable."],
  validationCommands: ["npm test"],
  expectedOutcome: "blocked",
});

function telemetry(finalStatus: "completed" | "failed"): RunTelemetry {
  return {
    schemaVersion: RUN_TELEMETRY_SCHEMA_VERSION,
    runId: `terminal-${finalStatus}`,
    startedAt: "2026-08-31T17:00:00.000Z",
    finishedAt: "2026-08-31T17:00:01.000Z",
    durationMs: 1000,
    task: benchmark.task,
    repositoryPath: "/isolated/terminal",
    finalStatus,
    attempts: { planning: 4, review: 3, task: 1 },
    files: { read: 8, changed: [] },
    llmCalls: [],
  };
}

function harnessResult(options: {
  outcome?: "changes_required" | "already_satisfied" | "blocked";
  status: "completed" | "failed";
  failureReason?: string;
  planningAttempts?: number;
  maxPlanningAttempts?: number;
}): HarnessRunResult {
  const outcome = options.outcome;

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
                  ? [{ file: "src/a.ts", action: "modify", description: "change" }]
                  : [],
              validation: [{ command: "npm test", expected: "pass" }],
              blockingUnknowns:
                outcome === "blocked" ? ["missing evidence"] : [],
              nonBlockingNotes: [],
            },
      status: options.status,
      failureReason: options.failureReason,
      planningAttempts: options.planningAttempts ?? 1,
      maxPlanningAttempts: options.maxPlanningAttempts ?? 4,
      reviewAttempts: 1,
    },
    telemetry: telemetry(options.status),
    persistedTelemetry: { path: "/tmp/terminal.json" },
  } as unknown as HarnessRunResult;
}

const completed = deriveHarnessTerminalEvidence(
  harnessResult({ outcome: "changes_required", status: "completed" }),
);
assert.equal(completed.kind, "completed_with_plan");
assert.equal(completed.refinedPlanOutcome, "changes_required");

const blocked = deriveHarnessTerminalEvidence(
  harnessResult({
    outcome: "blocked",
    status: "failed",
    failureReason: "missing evidence",
  }),
);
assert.equal(blocked.kind, "blocked_with_plan");
assert.equal(blocked.refinedPlanOutcome, "blocked");

const exhaustedHarness = harnessResult({
  status: "failed",
  planningAttempts: 4,
  maxPlanningAttempts: 4,
});
const exhausted = deriveHarnessTerminalEvidence(exhaustedHarness);
assert.deepEqual(exhausted, {
  kind: "planning_exhausted",
  status: "failed",
  failureReason: null,
  planningAttempts: 4,
  maxPlanningAttempts: 4,
  reviewAttempts: 1,
  refinedPlanOutcome: null,
});

assert.throws(
  () =>
    deriveHarnessTerminalEvidence(
      harnessResult({
        status: "failed",
        planningAttempts: 3,
        maxPlanningAttempts: 4,
      }),
    ),
  HarnessTerminalEvidenceDerivationError,
  "refinedPlan absence alone must not classify planning exhaustion",
);

for (const inconsistent of [
  harnessResult({ outcome: "blocked", status: "completed" }),
  harnessResult({
    outcome: "changes_required",
    status: "failed",
    failureReason: "failed",
  }),
  harnessResult({
    outcome: "already_satisfied",
    status: "completed",
    failureReason: "unexpected",
  }),
]) {
  assert.throws(
    () => deriveHarnessTerminalEvidence(inconsistent),
    HarnessTerminalEvidenceDerivationError,
  );
}

const observation = deriveBenchmarkRunObservation({
  harnessResult: exhaustedHarness,
  filesChanged: [],
  validation: { passed: true, commands: [] },
  humanInterventionRequired: false,
});
assert.equal(observation.finalOutcome, null);
assert.equal(observation.terminal?.kind, "planning_exhausted");
assert.equal(observation.validationPassed, true);
assert.equal(observation.humanInterventionRequired, false);

const acceptance = evaluateBenchmarkAcceptance(benchmark, observation);
assert.deepEqual(acceptance, {
  accepted: false,
  failures: ["terminal_outcome_unavailable"],
});

const completeResult: CompleteBenchmarkRunnerResult = {
  harness: exhaustedHarness,
  validation: { passed: true, commands: [] },
  observation,
  acceptance,
};
const comparison = createBenchmarkComparisonRecord(benchmark, completeResult);
assert.equal(comparison.observedOutcome, null);
assert.equal(comparison.accepted, false);
assert.deepEqual(comparison.acceptanceFailures, [
  "terminal_outcome_unavailable",
]);
assert.equal(comparison.terminalFailureReason, "planning_exhausted");

const persisted: unknown[] = [];
const suite = await runBenchmarkSuite({
  benchmarks: [benchmark],
  runBenchmark: async () => completeResult,
  store: {
    async saveTaskResult(result): Promise<void> {
      persisted.push(result);
    },
  },
});
assert.equal(suite.tasks[0]?.status, "completed");
assert.equal(persisted.length, 1);

assert.throws(
  () =>
    deriveBenchmarkRunObservation({
      harnessResult: harnessResult({
        status: "failed",
        planningAttempts: 2,
        maxPlanningAttempts: 4,
      }),
      filesChanged: [],
      validation: { passed: true, commands: [] },
      humanInterventionRequired: false,
    }),
  BenchmarkObservationDerivationError,
);

console.log("✅ H0-004A Step 3 terminal evidence contract passed.");
