import assert from "node:assert/strict";
import {
  aggregateBenchmarkSuite,
  type BenchmarkSuiteAggregation,
} from "./benchmarks/aggregation.js";
import type { BenchmarkComparisonRecord } from "./benchmarks/comparison.js";
import type {
  BenchmarkSuiteRunResult,
  BenchmarkSuiteTaskResult,
} from "./benchmarks/suite-runner.js";

function comparison(
  overrides: Partial<BenchmarkComparisonRecord> = {},
): BenchmarkComparisonRecord {
  return {
    benchmarkId: "B01",
    difficulty: "trivial",
    expectedOutcome: "changes_required",
    observedOutcome: "changes_required",
    accepted: true,
    acceptanceFailures: [],
    validationPassed: true,
    humanInterventionRequired: false,
    filesChanged: ["src/example.ts"],
    filesChangedCount: 1,
    harnessDurationMs: 100,
    llmCallCount: 2,
    llmCalls: [],
    promptTokens: 10,
    completionTokens: 20,
    totalTokens: 30,
    cost: null,
    terminalFailureReason: null,
    ...overrides,
  };
}

function completed(
  record: BenchmarkComparisonRecord,
): BenchmarkSuiteTaskResult {
  return {
    benchmarkId: record.benchmarkId,
    status: "completed",
    comparison: record,
  };
}

function infrastructureFailure(
  benchmarkId: string,
  name: string,
  message: string,
): BenchmarkSuiteTaskResult {
  return {
    benchmarkId,
    status: "infrastructure_failed",
    error: {
      name,
      message,
    },
  };
}

function suite(
  ...tasks: readonly BenchmarkSuiteTaskResult[]
): BenchmarkSuiteRunResult {
  return { tasks };
}

function assertAggregation(
  actual: BenchmarkSuiteAggregation,
  expected: Partial<BenchmarkSuiteAggregation>,
): void {
  for (const [key, value] of Object.entries(expected)) {
    assert.deepEqual(
      actual[key as keyof BenchmarkSuiteAggregation],
      value,
      `unexpected aggregate value for ${key}`,
    );
  }
}

const allAccepted = aggregateBenchmarkSuite(
  suite(
    completed(comparison({ benchmarkId: "B01", harnessDurationMs: 100 })),
    completed(
      comparison({
        benchmarkId: "B02",
        harnessDurationMs: 300,
        llmCallCount: 4,
        promptTokens: 15,
        completionTokens: 25,
        totalTokens: 40,
      }),
    ),
  ),
);

assertAggregation(allAccepted, {
  selectedTaskCount: 2,
  completedTaskCount: 2,
  infrastructureFailureCount: 0,
  acceptedTaskCount: 2,
  sfcr: 1,
  outcomeMatchCount: 2,
  outcomeCorrectnessRate: 1,
  validationPassedCount: 2,
  validationSuccessRate: 1,
  humanInterventionRequiredCount: 0,
  humanInterventionRate: 0,
  totalHarnessDurationMs: 400,
  averageHarnessDurationMs: 200,
  totalLlmCallCount: 6,
  averageLlmCallsPerCompletedTask: 3,
  promptTokens: 25,
  completionTokens: 45,
  totalTokens: 70,
  cost: null,
});

const mixedCompleted = aggregateBenchmarkSuite(
  suite(
    completed(comparison({ benchmarkId: "B01" })),
    completed(
      comparison({
        benchmarkId: "B02",
        accepted: false,
        observedOutcome: "blocked",
        validationPassed: false,
        humanInterventionRequired: true,
        harnessDurationMs: 200,
        llmCallCount: 5,
        terminalFailureReason: "validation failed",
      }),
    ),
  ),
);

assertAggregation(mixedCompleted, {
  selectedTaskCount: 2,
  completedTaskCount: 2,
  acceptedTaskCount: 1,
  sfcr: 0.5,
  outcomeMatchCount: 1,
  outcomeCorrectnessRate: 0.5,
  validationPassedCount: 1,
  validationSuccessRate: 0.5,
  humanInterventionRequiredCount: 1,
  humanInterventionRate: 0.5,
  totalHarnessDurationMs: 300,
  totalLlmCallCount: 7,
  terminalFailureReasonCounts: {
    "validation failed": 1,
  },
});

const withInfrastructureFailure = aggregateBenchmarkSuite(
  suite(
    completed(comparison({ benchmarkId: "B01" })),
    infrastructureFailure("B02", "WorkspaceError", "checkout failed"),
  ),
);

assertAggregation(withInfrastructureFailure, {
  selectedTaskCount: 2,
  completedTaskCount: 1,
  infrastructureFailureCount: 1,
  acceptedTaskCount: 1,
  sfcr: 0.5,
  outcomeMatchCount: 1,
  outcomeCorrectnessRate: 0.5,
  validationPassedCount: 1,
  validationSuccessRate: 0.5,
  humanInterventionRequiredCount: 0,
  humanInterventionRate: 0,
  infrastructureFailureReasonCounts: {
    WorkspaceError: 1,
  },
});

const incompleteTokens = aggregateBenchmarkSuite(
  suite(
    completed(
      comparison({
        benchmarkId: "B01",
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      }),
    ),
    completed(
      comparison({
        benchmarkId: "B02",
        promptTokens: null,
        completionTokens: 5,
        totalTokens: 5,
      }),
    ),
  ),
);

assertAggregation(incompleteTokens, {
  promptTokens: null,
  completionTokens: 25,
  totalTokens: 35,
});

const zeroCalls = aggregateBenchmarkSuite(
  suite(
    completed(
      comparison({
        benchmarkId: "B01",
        llmCallCount: 0,
        llmCalls: [],
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      }),
    ),
  ),
);

assertAggregation(zeroCalls, {
  totalLlmCallCount: 0,
  averageLlmCallsPerCompletedTask: 0,
  promptTokens: 0,
  completionTokens: 0,
  totalTokens: 0,
});

const empty = aggregateBenchmarkSuite(suite());

assertAggregation(empty, {
  selectedTaskCount: 0,
  completedTaskCount: 0,
  infrastructureFailureCount: 0,
  acceptedTaskCount: 0,
  sfcr: null,
  outcomeMatchCount: 0,
  outcomeCorrectnessRate: null,
  validationPassedCount: 0,
  validationSuccessRate: null,
  humanInterventionRequiredCount: 0,
  humanInterventionRate: null,
  totalHarnessDurationMs: 0,
  averageHarnessDurationMs: null,
  totalLlmCallCount: 0,
  averageLlmCallsPerCompletedTask: null,
  promptTokens: 0,
  completionTokens: 0,
  totalTokens: 0,
  cost: null,
  terminalFailureReasonCounts: {},
  infrastructureFailureReasonCounts: {},
});

const groupedFailures = aggregateBenchmarkSuite(
  suite(
    completed(
      comparison({
        benchmarkId: "B01",
        accepted: false,
        terminalFailureReason: "provider failure",
      }),
    ),
    completed(
      comparison({
        benchmarkId: "B02",
        accepted: false,
        terminalFailureReason: "provider failure",
      }),
    ),
    infrastructureFailure("B03", "WorkspaceError", "first"),
    infrastructureFailure("B04", "WorkspaceError", "second"),
    infrastructureFailure("B05", "StoreError", "save failed"),
  ),
);

assert.deepEqual(groupedFailures.terminalFailureReasonCounts, {
  "provider failure": 2,
});
assert.deepEqual(groupedFailures.infrastructureFailureReasonCounts, {
  WorkspaceError: 2,
  StoreError: 1,
});

const immutableInput = suite(
  completed(
    comparison({
      benchmarkId: "B01",
      filesChanged: ["src/one.ts"],
      terminalFailureReason: "known failure",
    }),
  ),
  infrastructureFailure("B02", "WorkspaceError", "checkout failed"),
);
const immutableSnapshot = JSON.stringify(immutableInput);

aggregateBenchmarkSuite(immutableInput);

assert.equal(
  JSON.stringify(immutableInput),
  immutableSnapshot,
  "aggregation must not mutate the suite result",
);

console.log("H0-004 benchmark aggregation tests passed");
