import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import type {
  HarnessRunResult,
  RunHarnessRequest,
} from "./app/run-harness.js";
import {
  BENCHMARK_TASK_SCHEMA_VERSION,
  defineBenchmarkTask,
} from "./benchmarks/contracts.js";
import {
  runBenchmark,
  type BenchmarkHarnessExecutor,
} from "./benchmarks/run-benchmark.js";
import type {
  BenchmarkWorkspaceRequest,
  BenchmarkWorkspaceResolver,
  ResolvedBenchmarkWorkspace,
} from "./benchmarks/workspace.js";

const benchmark = defineBenchmarkTask({
  schemaVersion: BENCHMARK_TASK_SCHEMA_VERSION,
  id: "benchmark-run-test",
  title: "Benchmark orchestration fixture",
  difficulty: "localized",
  task: "Change one localized behavior.",
  repository: {
    id: "fixture-repository",
    revision: "fixture-v1",
  },
  constraints: ["Preserve existing behavior."],
  successCriteria: ["Focused test passes."],
  validationCommands: ["echo VALIDATION_COMMAND_MUST_NOT_RUN"],
  expectedOutcome: "changes_required",
});

const harnessResult = {
  marker: "unchanged-result",
} as unknown as HarnessRunResult;

const lifecycle: string[] = [];
let harnessCalls = 0;
let cleanupCalls = 0;

const workspaceResolver: BenchmarkWorkspaceResolver = {
  async resolve(
    request: BenchmarkWorkspaceRequest,
  ): Promise<ResolvedBenchmarkWorkspace> {
    lifecycle.push("resolve");
    assert.deepEqual(request, {
      repository: benchmark.repository,
    });

    return {
      workspace: {
        repositoryPath: "/isolated/benchmark-run-test",
      },
      cleanup: async () => {
        lifecycle.push("cleanup");
        cleanupCalls += 1;
      },
    };
  },
};

const executeHarness: BenchmarkHarnessExecutor = async (
  request: RunHarnessRequest,
): Promise<HarnessRunResult> => {
  lifecycle.push("runHarness");
  harnessCalls += 1;

  assert.deepEqual(request, {
    task: {
      schemaVersion: 1,
      id: "benchmark-run-test",
      source: "benchmark",
      repository: {
        id: "fixture-repository",
        revision: "fixture-v1",
      },
      request: "Change one localized behavior.",
      constraints: ["Preserve existing behavior."],
      acceptanceCriteria: ["Focused test passes."],
      metadata: {},
    },
    workspace: {
      repositoryPath: "/isolated/benchmark-run-test",
    },
  });

  return harnessResult;
};

const successfulResult = await runBenchmark(
  { benchmark },
  {
    workspaceResolver,
    runHarness: executeHarness,
  },
);

assert.equal(successfulResult, harnessResult);
assert.equal(harnessCalls, 1);
assert.equal(cleanupCalls, 1);
assert.deepEqual(lifecycle, ["resolve", "runHarness", "cleanup"]);

// Harness failure: cleanup still runs and the original Harness error propagates.
const harnessFailure = new Error("simulated Harness failure");
let failedRunCleanupCalls = 0;

await assert.rejects(
  runBenchmark(
    { benchmark },
    {
      workspaceResolver: {
        async resolve(): Promise<ResolvedBenchmarkWorkspace> {
          return {
            workspace: {
              repositoryPath: "/isolated/harness-failure",
            },
            cleanup: async () => {
              failedRunCleanupCalls += 1;
            },
          };
        },
      },
      runHarness: async () => {
        throw harnessFailure;
      },
    },
  ),
  (error: unknown) => error === harnessFailure,
);
assert.equal(failedRunCleanupCalls, 1);

// Resolution failure: Harness must never execute.
const resolutionFailure = new Error("simulated workspace resolution failure");
let resolutionFailureHarnessCalls = 0;

await assert.rejects(
  runBenchmark(
    { benchmark },
    {
      workspaceResolver: {
        async resolve(): Promise<ResolvedBenchmarkWorkspace> {
          throw resolutionFailure;
        },
      },
      runHarness: async () => {
        resolutionFailureHarnessCalls += 1;
        return harnessResult;
      },
    },
  ),
  (error: unknown) => error === resolutionFailure,
);
assert.equal(resolutionFailureHarnessCalls, 0);

// Cleanup failure after a successful Harness run is observable.
const cleanupFailure = new Error("simulated cleanup failure");

await assert.rejects(
  runBenchmark(
    { benchmark },
    {
      workspaceResolver: {
        async resolve(): Promise<ResolvedBenchmarkWorkspace> {
          return {
            workspace: {
              repositoryPath: "/isolated/cleanup-failure",
            },
            cleanup: async () => {
              throw cleanupFailure;
            },
          };
        },
      },
      runHarness: async () => harnessResult,
    },
  ),
  (error: unknown) => error === cleanupFailure,
);

// When both Harness and cleanup fail, preserve the primary Harness error.
const primaryHarnessFailure = new Error("primary Harness failure");

await assert.rejects(
  runBenchmark(
    { benchmark },
    {
      workspaceResolver: {
        async resolve(): Promise<ResolvedBenchmarkWorkspace> {
          return {
            workspace: {
              repositoryPath: "/isolated/dual-failure",
            },
            cleanup: async () => {
              throw new Error("secondary cleanup failure");
            },
          };
        },
      },
      runHarness: async () => {
        throw primaryHarnessFailure;
      },
    },
  ),
  (error: unknown) => error === primaryHarnessFailure,
);

const orchestrationSource = await readFile(
  new URL("./benchmarks/run-benchmark.ts", import.meta.url),
  "utf8",
);

assert.match(
  orchestrationSource,
  /adaptBenchmarkTaskToHarnessTask/,
  "orchestration must use the accepted benchmark task adapter",
);
assert.match(
  orchestrationSource,
  /workspaceResolver\.resolve/,
  "orchestration must use the injected workspace resolver",
);
assert.match(
  orchestrationSource,
  /await\s+resolvedWorkspace\.cleanup\(\)/,
  "cleanup must be explicit and awaitable",
);

for (const forbiddenConcern of [
  "validationCommands",
  "evaluateBenchmarkAcceptance",
  "BenchmarkRunObservation",
  "child_process",
  "node:fs",
  "git-worktree-workspace",
  "../graph",
  "../providers",
]) {
  assert.equal(
    orchestrationSource.includes(forbiddenConcern),
    false,
    `run-benchmark orchestration must not absorb ${forbiddenConcern}`,
  );
}

assert.equal(
  orchestrationSource.includes("VALIDATION_COMMAND_MUST_NOT_RUN"),
  false,
  "benchmark validation commands must remain data and must not execute here",
);

console.log("✅ H0-003 Step 5 benchmark run orchestration passed.");
