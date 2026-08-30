import assert from "node:assert/strict";
import type { RunHarnessRequest } from "./app/run-harness.js";
import {
  runCompleteBenchmark,
  type BenchmarkValidationExecutor,
} from "./benchmarks/complete-runner.js";
import {
  BENCHMARK_TASK_SCHEMA_VERSION,
  defineBenchmarkTask,
} from "./benchmarks/contracts.js";
import type {
  BenchmarkEnvironmentPreparer,
  PreparedBenchmarkEnvironment,
} from "./benchmarks/environment.js";
import type { BenchmarkHarnessExecutor } from "./benchmarks/run-benchmark.js";
import type {
  BenchmarkWorkspaceResolver,
  ResolvedBenchmarkWorkspace,
} from "./benchmarks/workspace.js";

const benchmark = defineBenchmarkTask({
  schemaVersion: BENCHMARK_TASK_SCHEMA_VERSION,
  id: "step2b-environment-fixture",
  title: "Step 2B environment fixture",
  difficulty: "localized",
  task: "Exercise the benchmark environment lifecycle.",
  repository: {
    id: "fixture-repository",
    revision: "fixture-v1",
  },
  constraints: ["Preserve existing behavior."],
  successCriteria: ["Environment lifecycle is deterministic."],
  validationCommands: ["npm test"],
  expectedOutcome: "changes_required",
});

const successfulHarness = {
  state: {
    refinedPlan: {
      outcome: "changes_required",
      understanding: "fixture",
      changes: [
        {
          file: "src/example.ts",
          action: "modify",
          description: "fixture change",
        },
      ],
      validation: [
        {
          command: "npm test",
          expected: "tests pass",
        },
      ],
      blockingUnknowns: [],
      nonBlockingNotes: [],
    },
    status: "completed",
  },
  telemetry: {
    marker: "telemetry-preserved",
  },
  persistedTelemetry: {
    marker: "persisted-telemetry-preserved",
  },
} as unknown as Awaited<ReturnType<BenchmarkHarnessExecutor>>;

const successfulValidation = {
  passed: true,
  commands: [
    {
      command: "npm test",
      exitCode: 0,
      stdout: "ok",
      stderr: "",
    },
  ],
};

function workspaceResolver(
  lifecycle: string[],
  cleanup?: () => Promise<void>,
): BenchmarkWorkspaceResolver {
  return {
    async resolve(): Promise<ResolvedBenchmarkWorkspace> {
      lifecycle.push("workspace:resolve");
      return {
        workspace: {
          repositoryPath: "/isolated/step2b",
        },
        cleanup:
          cleanup ??
          (async () => {
            lifecycle.push("workspace:cleanup");
          }),
      };
    },
  };
}

function environmentPreparer(
  lifecycle: string[],
  prepared?: PreparedBenchmarkEnvironment,
): BenchmarkEnvironmentPreparer {
  return {
    async prepare(request): Promise<PreparedBenchmarkEnvironment> {
      lifecycle.push("environment:prepare");
      assert.equal(request.benchmark, benchmark);
      assert.equal(request.workspace.repositoryPath, "/isolated/step2b");

      return (
        prepared ?? {
          env: {
            DATABASE_URL: "postgresql://isolated/benchmark",
          },
          cleanup: async () => {
            lifecycle.push("environment:cleanup");
          },
        }
      );
    },
  };
}

{
  const lifecycle: string[] = [];
  const expectedEnvironment = {
    DATABASE_URL: "postgresql://isolated/benchmark",
  };

  const runHarness: BenchmarkHarnessExecutor = async (
    request: RunHarnessRequest,
  ) => {
    lifecycle.push("harness");
    assert.deepEqual(request.environment, expectedEnvironment);
    return successfulHarness;
  };

  const executeValidation: BenchmarkValidationExecutor = async (request) => {
    lifecycle.push("validation");
    assert.deepEqual(request.environment, expectedEnvironment);
    return successfulValidation;
  };

  await runCompleteBenchmark(benchmark, {
    workspaceResolver: workspaceResolver(lifecycle),
    environmentPreparer: environmentPreparer(lifecycle),
    runHarness,
    executeValidation,
    collectChangedFiles: async () => {
      lifecycle.push("changed-files");
      return ["src/example.ts"];
    },
  });

  assert.deepEqual(lifecycle, [
    "workspace:resolve",
    "environment:prepare",
    "harness",
    "validation",
    "changed-files",
    "environment:cleanup",
    "workspace:cleanup",
  ]);
}

{
  let harnessCalls = 0;
  let validationCalls = 0;
  let workspaceCleanupCalls = 0;
  const prepareFailure = new Error("environment prepare failed");

  await assert.rejects(
    runCompleteBenchmark(benchmark, {
      workspaceResolver: workspaceResolver([], async () => {
        workspaceCleanupCalls += 1;
      }),
      environmentPreparer: {
        async prepare(): Promise<PreparedBenchmarkEnvironment> {
          throw prepareFailure;
        },
      },
      runHarness: async () => {
        harnessCalls += 1;
        return successfulHarness;
      },
      executeValidation: async () => {
        validationCalls += 1;
        return successfulValidation;
      },
    }),
    (error: unknown) => error === prepareFailure,
  );

  assert.equal(harnessCalls, 0);
  assert.equal(validationCalls, 0);
  assert.equal(workspaceCleanupCalls, 1);
}

for (const stage of ["harness", "validation"] as const) {
  const primaryFailure = new Error(`${stage} failed`);
  const lifecycle: string[] = [];

  await assert.rejects(
    runCompleteBenchmark(benchmark, {
      workspaceResolver: workspaceResolver(lifecycle),
      environmentPreparer: environmentPreparer(lifecycle, {
        env: {},
        cleanup: async () => {
          lifecycle.push("environment:cleanup");
          throw new Error("secondary environment cleanup failure");
        },
      }),
      runHarness: async () => {
        lifecycle.push("harness");
        if (stage === "harness") {
          throw primaryFailure;
        }
        return successfulHarness;
      },
      executeValidation: async () => {
        lifecycle.push("validation");
        if (stage === "validation") {
          throw primaryFailure;
        }
        return successfulValidation;
      },
      collectChangedFiles: async () => ["src/example.ts"],
    }),
    (error: unknown) => error === primaryFailure,
  );

  assert.equal(
    lifecycle.at(-2),
    "environment:cleanup",
    "environment cleanup must precede workspace cleanup",
  );
  assert.equal(lifecycle.at(-1), "workspace:cleanup");
}

{
  const environmentCleanupFailure = new Error("environment cleanup failed");
  let workspaceCleanupCalls = 0;

  await assert.rejects(
    runCompleteBenchmark(benchmark, {
      workspaceResolver: workspaceResolver([], async () => {
        workspaceCleanupCalls += 1;
      }),
      environmentPreparer: {
        async prepare(): Promise<PreparedBenchmarkEnvironment> {
          return {
            env: {},
            cleanup: async () => {
              throw environmentCleanupFailure;
            },
          };
        },
      },
      runHarness: async () => successfulHarness,
      executeValidation: async () => successfulValidation,
      collectChangedFiles: async () => ["src/example.ts"],
    }),
    (error: unknown) => error === environmentCleanupFailure,
  );

  assert.equal(
    workspaceCleanupCalls,
    1,
    "workspace cleanup must still run after environment cleanup failure",
  );
}

{
  const workspaceCleanupFailure = new Error("workspace cleanup failed");
  let environmentCleanupCalls = 0;

  await assert.rejects(
    runCompleteBenchmark(benchmark, {
      workspaceResolver: workspaceResolver([], async () => {
        throw workspaceCleanupFailure;
      }),
      environmentPreparer: {
        async prepare(): Promise<PreparedBenchmarkEnvironment> {
          return {
            env: {},
            cleanup: async () => {
              environmentCleanupCalls += 1;
            },
          };
        },
      },
      runHarness: async () => successfulHarness,
      executeValidation: async () => successfulValidation,
      collectChangedFiles: async () => ["src/example.ts"],
    }),
    (error: unknown) => error === workspaceCleanupFailure,
  );

  assert.equal(environmentCleanupCalls, 1);
}

{
  let noOpHarnessEnvironment: RunHarnessRequest["environment"];

  await runCompleteBenchmark(benchmark, {
    workspaceResolver: workspaceResolver([]),
    runHarness: async (request) => {
      noOpHarnessEnvironment = request.environment;
      return successfulHarness;
    },
    executeValidation: async (request) => {
      assert.deepEqual(request.environment, {});
      return successfulValidation;
    },
    collectChangedFiles: async () => ["src/example.ts"],
  });

  assert.deepEqual(
    noOpHarnessEnvironment,
    {},
    "default environment preparation must be a no-op",
  );
}

console.log("✅ H0-004 Step 2B benchmark environment lifecycle passed.");
