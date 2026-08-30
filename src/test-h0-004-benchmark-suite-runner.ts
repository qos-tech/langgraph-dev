import assert from "node:assert/strict";
import type { HarnessRunResult } from "./app/run-harness.js";
import { benchmarkCases } from "./benchmarks/cases.js";
import type { CompleteBenchmarkRunnerResult } from "./benchmarks/complete-runner.js";
import type { BenchmarkTask } from "./benchmarks/contracts.js";
import {
  runBenchmarkSuite,
  type BenchmarkComparisonStore,
  type BenchmarkSuiteTaskResult,
  type CompleteBenchmarkExecutor,
} from "./benchmarks/suite-runner.js";
import {
  RUN_TELEMETRY_SCHEMA_VERSION,
  type RunTelemetry,
} from "./telemetry/contracts.js";

const expectedIds = ["B01", "B02", "B03", "B04", "B05"];
assert.deepEqual(
  benchmarkCases.map((benchmark) => benchmark.id),
  expectedIds,
);

const suiteSnapshot = JSON.stringify(benchmarkCases);
const events: string[] = [];
const executionCounts = new Map<string, number>();
const persisted: BenchmarkSuiteTaskResult[] = [];

function makeCompleteResult(
  benchmark: BenchmarkTask,
  accepted = true,
): CompleteBenchmarkRunnerResult {
  const telemetry: RunTelemetry = {
    schemaVersion: RUN_TELEMETRY_SCHEMA_VERSION,
    runId: `run-${benchmark.id}`,
    startedAt: "2026-08-29T20:00:00.000Z",
    finishedAt: "2026-08-29T20:00:00.100Z",
    durationMs: 100,
    task: benchmark.task,
    repositoryPath: `/isolated/${benchmark.id}`,
    finalStatus: benchmark.expectedOutcome === "blocked" ? "failed" : "completed",
    attempts: {
      planning: 1,
      review: 1,
      task: 1,
    },
    files: {
      read: 1,
      changed: [],
    },
    llmCalls: [],
  };

  const harness = {
    state: {
      status: benchmark.expectedOutcome === "blocked" ? "failed" : "completed",
      failureReason:
        benchmark.expectedOutcome === "blocked"
          ? "missing external evidence"
          : undefined,
    },
    telemetry,
    persistedTelemetry: {
      path: `/tmp/${benchmark.id}.json`,
    },
  } as unknown as HarnessRunResult;

  return {
    harness,
    validation: {
      passed: accepted,
      commands: [],
    },
    observation: {
      finalOutcome: benchmark.expectedOutcome,
      filesChanged:
        benchmark.expectedOutcome === "already_satisfied"
          ? []
          : [`src/${benchmark.id.toLowerCase()}.ts`],
      validationPassed: accepted,
      humanInterventionRequired: false,
    },
    acceptance: {
      accepted,
      failures: accepted ? [] : ["validation_failed"],
    },
  };
}

const runBenchmark: CompleteBenchmarkExecutor = async (benchmark) => {
  events.push(`execute:${benchmark.id}`);
  executionCounts.set(
    benchmark.id,
    (executionCounts.get(benchmark.id) ?? 0) + 1,
  );

  if (benchmark.id === "B04") {
    throw new TypeError("simulated workspace infrastructure failure");
  }

  return makeCompleteResult(benchmark, benchmark.id !== "B03");
};

const store: BenchmarkComparisonStore = {
  async saveTaskResult(result): Promise<void> {
    events.push(`persist:${result.benchmarkId}`);
    persisted.push(result);
  },
};

const suiteResult = await runBenchmarkSuite({
  runBenchmark,
  store,
});

assert.deepEqual(
  suiteResult.tasks.map((result) => result.benchmarkId),
  expectedIds,
);
assert.equal(suiteResult.tasks.length, 5);
assert.equal(persisted.length, 5);

for (const id of expectedIds) {
  assert.equal(
    executionCounts.get(id),
    1,
    `${id} must execute exactly once without retry`,
  );
}

assert.deepEqual(events, [
  "execute:B01",
  "persist:B01",
  "execute:B02",
  "persist:B02",
  "execute:B03",
  "persist:B03",
  "execute:B04",
  "persist:B04",
  "execute:B05",
  "persist:B05",
]);

const b03 = suiteResult.tasks.find((result) => result.benchmarkId === "B03");
assert.ok(b03);
assert.equal(b03.status, "completed");
if (b03.status === "completed") {
  assert.equal(b03.comparison.accepted, false);
  assert.deepEqual(b03.comparison.acceptanceFailures, [
    "validation_failed",
  ]);
}

const b04 = suiteResult.tasks.find((result) => result.benchmarkId === "B04");
assert.deepEqual(b04, {
  benchmarkId: "B04",
  status: "infrastructure_failed",
  error: {
    name: "TypeError",
    message: "simulated workspace infrastructure failure",
  },
});

const b05 = suiteResult.tasks.find((result) => result.benchmarkId === "B05");
assert.ok(b05);
assert.equal(
  b05.status,
  "completed",
  "suite must continue after a prior infrastructure failure",
);

assert.equal(
  JSON.stringify(benchmarkCases),
  suiteSnapshot,
  "suite runner must not mutate fixed benchmark definitions",
);

// Non-Error failures are normalized into deterministic serializable evidence.
const nonErrorPersisted: BenchmarkSuiteTaskResult[] = [];
const nonErrorResult = await runBenchmarkSuite({
  benchmarks: [benchmarkCases[0]],
  runBenchmark: async () => {
    throw "string infrastructure failure";
  },
  store: {
    async saveTaskResult(result): Promise<void> {
      nonErrorPersisted.push(result);
    },
  },
});

assert.deepEqual(nonErrorResult.tasks, [
  {
    benchmarkId: "B01",
    status: "infrastructure_failed",
    error: {
      name: "Error",
      message: "string infrastructure failure",
    },
  },
]);
assert.deepEqual(nonErrorPersisted, nonErrorResult.tasks);

// Persistence is part of the evidence boundary: if saving fails, the suite
// stops rather than executing later tasks whose evidence could not be retained.
const persistenceFailure = new Error("comparison store unavailable");
const executedBeforeStoreFailure: string[] = [];

await assert.rejects(
  runBenchmarkSuite({
    benchmarks: [benchmarkCases[0], benchmarkCases[1]],
    runBenchmark: async (benchmark) => {
      executedBeforeStoreFailure.push(benchmark.id);
      return makeCompleteResult(benchmark);
    },
    store: {
      async saveTaskResult(): Promise<void> {
        throw persistenceFailure;
      },
    },
  }),
  (error: unknown) => error === persistenceFailure,
);

assert.deepEqual(executedBeforeStoreFailure, ["B01"]);

console.log("✅ H0-004 Step 2 benchmark suite runner passed.");
