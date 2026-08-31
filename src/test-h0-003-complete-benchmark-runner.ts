import assert from "node:assert/strict";
import type { HarnessRunResult, RunHarnessRequest } from "./app/run-harness.js";
import {
  evaluateBenchmarkAcceptance,
  type BenchmarkRunObservation,
} from "./benchmarks/acceptance.js";
import {
  runCompleteBenchmark,
  type BenchmarkChangedFilesCollector,
  type BenchmarkObservationDeriver,
  type BenchmarkValidationExecutor,
} from "./benchmarks/complete-runner.js";
import {
  BENCHMARK_TASK_SCHEMA_VERSION,
  defineBenchmarkTask,
  type BenchmarkTask,
} from "./benchmarks/contracts.js";
import { deriveBenchmarkRunObservation } from "./benchmarks/observation.js";
import type { BenchmarkHarnessExecutor } from "./benchmarks/run-benchmark.js";
import type {
  BenchmarkValidationRequest,
  BenchmarkValidationResult,
} from "./benchmarks/validation.js";
import type {
  BenchmarkWorkspaceRequest,
  BenchmarkWorkspaceResolver,
  ResolvedBenchmarkWorkspace,
} from "./benchmarks/workspace.js";

function benchmarkFixture(
  expectedOutcome: "changes_required" | "already_satisfied" | "blocked" =
    "changes_required",
): BenchmarkTask {
  return defineBenchmarkTask({
    schemaVersion: BENCHMARK_TASK_SCHEMA_VERSION,
    id: `complete-runner-${expectedOutcome}`,
    title: "Complete runner fixture",
    difficulty: "localized",
    task: "Change one localized behavior.",
    repository: {
      id: "fixture-repository",
      revision: "fixture-v1",
    },
    constraints: ["Preserve existing behavior."],
    successCriteria: ["Focused validation passes."],
    validationCommands: ["npm run typecheck", "npm test"],
    expectedOutcome,
  });
}

function harnessResult(
  outcome: "changes_required" | "already_satisfied" | "blocked",
): HarnessRunResult {
  return {
    state: {
      refinedPlan: {
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
      status: outcome === "blocked" ? "failed" : "completed",
      failureReason:
        outcome === "blocked" ? "missing external evidence" : undefined,
      planningAttempts: 1,
      maxPlanningAttempts: 4,
      reviewAttempts: 1,
    },
    telemetry: {
      marker: "telemetry-preserved",
    },
    persistedTelemetry: {
      marker: "persisted-telemetry-preserved",
    },
  } as unknown as HarnessRunResult;
}

const benchmark = benchmarkFixture();
const successfulHarness = harnessResult("changes_required");
const successfulValidation: BenchmarkValidationResult = {
  passed: true,
  commands: [
    {
      command: "npm run typecheck",
      exitCode: 0,
      stdout: "typecheck ok",
      stderr: "",
    },
    {
      command: "npm test",
      exitCode: 0,
      stdout: "tests ok",
      stderr: "",
    },
  ],
};

const lifecycle: string[] = [];
let cleanupCalls = 0;
const workspacePath = "/isolated/complete-runner";

const workspaceResolver: BenchmarkWorkspaceResolver = {
  async resolve(
    request: BenchmarkWorkspaceRequest,
  ): Promise<ResolvedBenchmarkWorkspace> {
    lifecycle.push("resolve");
    assert.deepEqual(request.repository, benchmark.repository);

    return {
      workspace: {
        repositoryPath: workspacePath,
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
  assert.equal(request.task.source, "benchmark");
  assert.deepEqual(request.task.repository, benchmark.repository);
  assert.equal(request.workspace.repositoryPath, workspacePath);
  return successfulHarness;
};

const executeValidation: BenchmarkValidationExecutor = async (
  request: BenchmarkValidationRequest,
): Promise<BenchmarkValidationResult> => {
  lifecycle.push("validation");
  assert.equal(request.repositoryPath, workspacePath);
  assert.deepEqual(request.commands, benchmark.validationCommands);
  return successfulValidation;
};

const collectChangedFiles: BenchmarkChangedFilesCollector = async (
  repositoryPath: string,
): Promise<readonly string[]> => {
  lifecycle.push("changed-files");
  assert.equal(repositoryPath, workspacePath);
  return ["src/example.ts"];
};

const deriveObservation: BenchmarkObservationDeriver = (evidence) => {
  lifecycle.push("observation");
  assert.equal(evidence.harnessResult, successfulHarness);
  assert.deepEqual(evidence.filesChanged, ["src/example.ts"]);
  assert.equal(evidence.validation, successfulValidation);
  assert.equal(
    evidence.humanInterventionRequired,
    false,
    "automated H0-003 runner baseline must explicitly record no human intervention",
  );
  return deriveBenchmarkRunObservation(evidence);
};

const evaluateAcceptance = (
  selectedBenchmark: BenchmarkTask,
  observation: BenchmarkRunObservation,
) => {
  lifecycle.push("acceptance");
  return evaluateBenchmarkAcceptance(selectedBenchmark, observation);
};

const result = await runCompleteBenchmark(benchmark, {
  workspaceResolver,
  runHarness: executeHarness,
  executeValidation,
  collectChangedFiles,
  deriveObservation,
  evaluateAcceptance,
});

assert.equal(result.harness, successfulHarness);
assert.equal(result.validation, successfulValidation);
assert.deepEqual(result.observation, {
  finalOutcome: "changes_required",
  terminal: {
    kind: "completed_with_plan",
    status: "completed",
    failureReason: null,
    planningAttempts: 1,
    maxPlanningAttempts: 4,
    reviewAttempts: 1,
    refinedPlanOutcome: "changes_required",
  },
  filesChanged: ["src/example.ts"],
  validationPassed: true,
  humanInterventionRequired: false,
});
assert.deepEqual(result.acceptance, {
  accepted: true,
  failures: [],
});
assert.equal(cleanupCalls, 1);
assert.deepEqual(lifecycle, [
  "resolve",
  "runHarness",
  "validation",
  "changed-files",
  "observation",
  "acceptance",
  "cleanup",
]);

// Real H0-002 acceptance semantics remain intact for a mismatched outcome.
const mismatch = await runCompleteBenchmark(benchmarkFixture("already_satisfied"), {
  workspaceResolver: {
    async resolve(): Promise<ResolvedBenchmarkWorkspace> {
      return {
        workspace: { repositoryPath: "/isolated/mismatch" },
        cleanup: async () => {},
      };
    },
  },
  runHarness: async () => harnessResult("changes_required"),
  executeValidation: async () => successfulValidation,
  collectChangedFiles: async () => ["src/example.ts"],
});

assert.equal(mismatch.acceptance.accepted, false);
assert.deepEqual(mismatch.acceptance.failures, [
  "unexpected_outcome",
  "unexpected_changes",
]);

// A validation command failure is evidence and still reaches acceptance.
const validationFailure = await runCompleteBenchmark(benchmark, {
  workspaceResolver: {
    async resolve(): Promise<ResolvedBenchmarkWorkspace> {
      return {
        workspace: { repositoryPath: "/isolated/validation-failure" },
        cleanup: async () => {},
      };
    },
  },
  runHarness: async () => successfulHarness,
  executeValidation: async () => ({
    passed: false,
    commands: [
      {
        command: "npm test",
        exitCode: 1,
        stdout: "",
        stderr: "failure",
      },
    ],
  }),
  collectChangedFiles: async () => ["src/example.ts"],
});

assert.deepEqual(validationFailure.acceptance, {
  accepted: false,
  failures: ["validation_failed"],
});

async function assertFailureCleansUp(
  stage:
    | "harness"
    | "validation"
    | "changed-files"
    | "observation"
    | "acceptance",
): Promise<void> {
  const primaryFailure = new Error(`simulated ${stage} failure`);
  let localCleanupCalls = 0;
  let validationCalls = 0;
  let changedFileCalls = 0;
  let observationCalls = 0;
  let acceptanceCalls = 0;

  await assert.rejects(
    runCompleteBenchmark(benchmark, {
      workspaceResolver: {
        async resolve(): Promise<ResolvedBenchmarkWorkspace> {
          return {
            workspace: { repositoryPath: `/isolated/${stage}` },
            cleanup: async () => {
              localCleanupCalls += 1;
            },
          };
        },
      },
      runHarness: async () => {
        if (stage === "harness") {
          throw primaryFailure;
        }
        return successfulHarness;
      },
      executeValidation: async () => {
        validationCalls += 1;
        if (stage === "validation") {
          throw primaryFailure;
        }
        return successfulValidation;
      },
      collectChangedFiles: async () => {
        changedFileCalls += 1;
        if (stage === "changed-files") {
          throw primaryFailure;
        }
        return ["src/example.ts"];
      },
      deriveObservation: (evidence) => {
        observationCalls += 1;
        if (stage === "observation") {
          throw primaryFailure;
        }
        return deriveBenchmarkRunObservation(evidence);
      },
      evaluateAcceptance: (selectedBenchmark, observation) => {
        acceptanceCalls += 1;
        if (stage === "acceptance") {
          throw primaryFailure;
        }
        return evaluateBenchmarkAcceptance(selectedBenchmark, observation);
      },
    }),
    (error: unknown) => error === primaryFailure,
  );

  assert.equal(localCleanupCalls, 1);

  if (stage === "harness") {
    assert.equal(validationCalls, 0);
    assert.equal(changedFileCalls, 0);
    assert.equal(observationCalls, 0);
    assert.equal(acceptanceCalls, 0);
  }

  if (stage === "validation") {
    assert.equal(changedFileCalls, 0);
    assert.equal(observationCalls, 0);
    assert.equal(acceptanceCalls, 0);
  }

  if (stage === "changed-files") {
    assert.equal(observationCalls, 0);
    assert.equal(acceptanceCalls, 0);
  }

  if (stage === "observation") {
    assert.equal(acceptanceCalls, 0);
  }
}

for (const stage of [
  "harness",
  "validation",
  "changed-files",
  "observation",
  "acceptance",
] as const) {
  await assertFailureCleansUp(stage);
}

// Workspace resolution failure never enters the execution lifecycle.
const resolutionFailure = new Error("simulated resolution failure");
let resolutionHarnessCalls = 0;

await assert.rejects(
  runCompleteBenchmark(benchmark, {
    workspaceResolver: {
      async resolve(): Promise<ResolvedBenchmarkWorkspace> {
        throw resolutionFailure;
      },
    },
    runHarness: async () => {
      resolutionHarnessCalls += 1;
      return successfulHarness;
    },
  }),
  (error: unknown) => error === resolutionFailure,
);
assert.equal(resolutionHarnessCalls, 0);

// Cleanup failure after otherwise successful execution remains observable.
const cleanupFailure = new Error("simulated cleanup failure");

await assert.rejects(
  runCompleteBenchmark(benchmark, {
    workspaceResolver: {
      async resolve(): Promise<ResolvedBenchmarkWorkspace> {
        return {
          workspace: { repositoryPath: "/isolated/cleanup-failure" },
          cleanup: async () => {
            throw cleanupFailure;
          },
        };
      },
    },
    runHarness: async () => successfulHarness,
    executeValidation: async () => successfulValidation,
    collectChangedFiles: async () => ["src/example.ts"],
  }),
  (error: unknown) => error === cleanupFailure,
);

// Primary runner failure wins when cleanup also fails.
const primaryFailure = new Error("primary runner failure");

await assert.rejects(
  runCompleteBenchmark(benchmark, {
    workspaceResolver: {
      async resolve(): Promise<ResolvedBenchmarkWorkspace> {
        return {
          workspace: { repositoryPath: "/isolated/dual-failure" },
          cleanup: async () => {
            throw new Error("secondary cleanup failure");
          },
        };
      },
    },
    runHarness: async () => {
      throw primaryFailure;
    },
  }),
  (error: unknown) => error === primaryFailure,
);

console.log("✅ H0-003 Step 8 complete benchmark runner composition passed.");
