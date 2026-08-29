import assert from "node:assert/strict";
import type { HarnessRunResult } from "./app/run-harness.js";
import type { CompleteBenchmarkRunnerResult } from "./benchmarks/complete-runner.js";
import {
  BENCHMARK_TASK_SCHEMA_VERSION,
  defineBenchmarkTask,
} from "./benchmarks/contracts.js";
import { createBenchmarkComparisonRecord } from "./benchmarks/comparison.js";
import {
  RUN_TELEMETRY_SCHEMA_VERSION,
  type RunTelemetry,
} from "./telemetry/contracts.js";

const benchmark = defineBenchmarkTask({
  schemaVersion: BENCHMARK_TASK_SCHEMA_VERSION,
  id: "comparison-fixture",
  title: "Comparison fixture",
  difficulty: "cross-file",
  task: "Change the workflow.",
  repository: {
    id: "fixture-repository",
    revision: "fixture-v1",
  },
  constraints: [],
  successCriteria: ["Validation passes."],
  validationCommands: ["npm test"],
  expectedOutcome: "changes_required",
});

const telemetry: RunTelemetry = {
  schemaVersion: RUN_TELEMETRY_SCHEMA_VERSION,
  runId: "comparison-run",
  startedAt: "2026-08-29T20:00:00.000Z",
  finishedAt: "2026-08-29T20:00:01.250Z",
  durationMs: 1250,
  task: benchmark.task,
  repositoryPath: "/isolated/comparison-fixture",
  finalStatus: "completed",
  attempts: {
    planning: 1,
    review: 1,
    task: 1,
  },
  files: {
    read: 4,
    changed: [],
  },
  llmCalls: [
    {
      role: "planner",
      model: "planner-model",
      elapsedSeconds: 0.5,
      promptTokens: 100,
      completionTokens: 20,
      totalTokens: 120,
    },
    {
      role: "reviewer",
      model: "reviewer-model",
      elapsedSeconds: 0.25,
      promptTokens: 60,
      completionTokens: 10,
      totalTokens: 70,
    },
  ],
};

const harness = {
  state: {
    status: "completed",
    failureReason: undefined,
  },
  telemetry,
  persistedTelemetry: {
    path: "/tmp/comparison-run.json",
  },
} as unknown as HarnessRunResult;

const result: CompleteBenchmarkRunnerResult = {
  harness,
  validation: {
    passed: true,
    commands: [
      {
        command: "npm test",
        exitCode: 0,
        stdout: "ok",
        stderr: "",
      },
    ],
  },
  observation: {
    finalOutcome: "changes_required",
    filesChanged: ["src/a.ts", "src/b.ts"],
    validationPassed: true,
    humanInterventionRequired: false,
  },
  acceptance: {
    accepted: true,
    failures: [],
  },
};

assert.deepEqual(createBenchmarkComparisonRecord(benchmark, result), {
  benchmarkId: "comparison-fixture",
  difficulty: "cross-file",
  expectedOutcome: "changes_required",
  observedOutcome: "changes_required",
  accepted: true,
  acceptanceFailures: [],
  validationPassed: true,
  humanInterventionRequired: false,
  filesChanged: ["src/a.ts", "src/b.ts"],
  filesChangedCount: 2,
  harnessDurationMs: 1250,
  llmCallCount: 2,
  llmCalls: telemetry.llmCalls,
  promptTokens: 160,
  completionTokens: 30,
  totalTokens: 190,
  cost: null,
  terminalFailureReason: null,
});

const partialUsageResult: CompleteBenchmarkRunnerResult = {
  ...result,
  harness: {
    ...harness,
    telemetry: {
      ...telemetry,
      llmCalls: [
        telemetry.llmCalls[0]!,
        {
          role: "refiner",
          model: "refiner-model",
          elapsedSeconds: 0.1,
        },
      ],
    },
  } as HarnessRunResult,
  acceptance: {
    accepted: false,
    failures: ["validation_failed"],
  },
  observation: {
    ...result.observation,
    validationPassed: false,
  },
};

const partialUsageRecord = createBenchmarkComparisonRecord(
  benchmark,
  partialUsageResult,
);

assert.equal(partialUsageRecord.accepted, false);
assert.deepEqual(partialUsageRecord.acceptanceFailures, [
  "validation_failed",
]);
assert.equal(partialUsageRecord.validationPassed, false);
assert.equal(partialUsageRecord.llmCallCount, 2);
assert.equal(partialUsageRecord.promptTokens, null);
assert.equal(partialUsageRecord.completionTokens, null);
assert.equal(partialUsageRecord.totalTokens, null);
assert.equal(partialUsageRecord.cost, null);

const noCallsResult: CompleteBenchmarkRunnerResult = {
  ...result,
  harness: {
    ...harness,
    telemetry: {
      ...telemetry,
      llmCalls: [],
    },
  } as HarnessRunResult,
};

const noCallsRecord = createBenchmarkComparisonRecord(
  benchmark,
  noCallsResult,
);

assert.equal(noCallsRecord.llmCallCount, 0);
assert.equal(noCallsRecord.promptTokens, 0);
assert.equal(noCallsRecord.completionTokens, 0);
assert.equal(noCallsRecord.totalTokens, 0);

const failedHarnessResult: CompleteBenchmarkRunnerResult = {
  ...result,
  harness: {
    ...harness,
    state: {
      status: "failed",
      failureReason: "missing external evidence",
    },
    telemetry: {
      ...telemetry,
      finalStatus: "failed",
      failureReason: "missing external evidence",
    },
  } as HarnessRunResult,
  observation: {
    finalOutcome: "blocked",
    filesChanged: [],
    validationPassed: true,
    humanInterventionRequired: false,
  },
  acceptance: {
    accepted: false,
    failures: ["unexpected_outcome"],
  },
};

const failedRecord = createBenchmarkComparisonRecord(
  benchmark,
  failedHarnessResult,
);

assert.equal(failedRecord.observedOutcome, "blocked");
assert.equal(
  failedRecord.terminalFailureReason,
  "missing external evidence",
);
assert.deepEqual(failedRecord.acceptanceFailures, ["unexpected_outcome"]);

console.log("✅ H0-004 Step 1 comparison contract passed.");
