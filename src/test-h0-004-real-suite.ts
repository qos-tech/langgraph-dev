import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  H0_004_BASELINE_CAPTURE_SCHEMA_VERSION,
  H0_004_BASELINE_JSON,
  H0_004_BASELINE_MARKDOWN,
  createBenchmarkComparisonCapture,
  persistBenchmarkComparisonCapture,
  renderBenchmarkComparisonCaptureJson,
  renderBenchmarkComparisonCaptureMarkdown,
  runH0BaselineCapture,
  type BenchmarkBaselinePreflightEvidence,
} from "./benchmarks/real-suite.js";
import type { BenchmarkComparisonRecord } from "./benchmarks/comparison.js";
import type {
  BenchmarkSuiteRunResult,
  BenchmarkSuiteTaskResult,
} from "./benchmarks/suite-runner.js";

function comparison(
  benchmarkId: string,
  overrides: Partial<BenchmarkComparisonRecord> = {},
): BenchmarkComparisonRecord {
  return {
    benchmarkId,
    difficulty: "trivial",
    expectedOutcome: "changes_required",
    observedOutcome: "changes_required",
    accepted: true,
    acceptanceFailures: [],
    validationPassed: true,
    humanInterventionRequired: false,
    filesChanged: [],
    filesChangedCount: 0,
    harnessDurationMs: 100,
    llmCallCount: 1,
    llmCalls: [],
    promptTokens: 10,
    completionTokens: 5,
    totalTokens: 15,
    cost: null,
    terminalFailureReason: null,
    ...overrides,
  };
}

function completed(
  benchmarkId: string,
  overrides: Partial<BenchmarkComparisonRecord> = {},
): BenchmarkSuiteTaskResult {
  return {
    benchmarkId,
    status: "completed",
    comparison: comparison(benchmarkId, overrides),
  };
}

function infrastructureFailure(
  benchmarkId: string,
): BenchmarkSuiteTaskResult {
  return {
    benchmarkId,
    status: "infrastructure_failed",
    error: {
      name: "WorkspaceError",
      message: "fixture unavailable",
    },
  };
}

function fixedSuite(
  b03: BenchmarkSuiteTaskResult = completed("B03"),
): BenchmarkSuiteRunResult {
  return {
    tasks: [
      completed("B01"),
      completed("B02", {
        expectedOutcome: "already_satisfied",
        observedOutcome: "already_satisfied",
      }),
      b03,
      completed("B04"),
      completed("B05", {
        difficulty: "architectural",
        expectedOutcome: "blocked",
        observedOutcome: "blocked",
      }),
    ],
  };
}

function evidence(
  artifactDirectory: string,
): BenchmarkBaselinePreflightEvidence {
  return {
    harness: {
      repositoryPath: "/repo/harness",
      gitRevision: "abc123",
      packageVersion: "0.1.0-alpha.7",
    },
    runtime: {
      roles: {
        planner: {
          provider: "nvidia",
          model: "planner-model",
        },
        reviewer: {
          provider: "nvidia",
          model: "reviewer-model",
        },
        refiner: {
          provider: "nvidia",
          model: "planner-model",
        },
      },
    },
    fixtures: ["B01", "B02", "B03", "B04", "B05"].map(
      (benchmarkId, index) => ({
        benchmarkId,
        repositoryId: `fixture-${benchmarkId}`,
        revision: `b0${index + 1}-v1`,
        commit: `commit-${benchmarkId}`,
        sourceRevision:
          benchmarkId === "B04" || benchmarkId === "B05"
            ? `source-${benchmarkId}`
            : null,
      }),
    ),
    artifactDirectory,
  };
}

const artifactDirectory = await mkdtemp(
  join(tmpdir(), "h0-004-real-suite-test-"),
);
const events: string[] = [];
let suiteRuns = 0;
let persistedCapture:
  | ReturnType<typeof createBenchmarkComparisonCapture>
  | undefined;

const result = await runH0BaselineCapture({
  preflight: async () => {
    events.push("preflight");
    return evidence(artifactDirectory);
  },
  runSuite: async () => {
    events.push("suite");
    suiteRuns += 1;
    return fixedSuite(infrastructureFailure("B03"));
  },
  now: () => new Date("2026-08-30T19:00:00.000Z"),
  persistCapture: async (request) => {
    events.push("persist");
    persistedCapture = request.capture;
    return {
      jsonPath: join(request.artifactDirectory, H0_004_BASELINE_JSON),
      markdownPath: join(
        request.artifactDirectory,
        H0_004_BASELINE_MARKDOWN,
      ),
    };
  },
});

assert.deepEqual(events, ["preflight", "suite", "persist"]);
assert.equal(suiteRuns, 1, "Step 5 must execute the suite exactly once");
assert.equal(
  result.capture.schemaVersion,
  H0_004_BASELINE_CAPTURE_SCHEMA_VERSION,
);
assert.equal(result.capture.capturedAt, "2026-08-30T19:00:00.000Z");
assert.equal(result.capture.harness.gitRevision, "abc123");
assert.deepEqual(
  result.capture.report.tasks.map((task) => task.benchmarkId),
  ["B01", "B02", "B03", "B04", "B05"],
);
assert.equal(
  result.capture.report.tasks[2]?.status,
  "infrastructure_failed",
);
assert.equal(result.capture.report.suite.selectedTaskCount, 5);
assert.equal(result.capture.report.suite.infrastructureFailureCount, 1);
assert.strictEqual(persistedCapture, result.capture);

let preflightBlockedSuite = false;
await assert.rejects(
  () =>
    runH0BaselineCapture({
      preflight: async () => {
        throw new Error("dirty working tree");
      },
      runSuite: async () => {
        preflightBlockedSuite = true;
        return fixedSuite();
      },
    }),
  /dirty working tree/,
);
assert.equal(
  preflightBlockedSuite,
  false,
  "preflight failure must prevent provider-backed suite execution",
);

await assert.rejects(
  () =>
    runH0BaselineCapture({
      preflight: async () => evidence(artifactDirectory),
      runSuite: async () => ({
        tasks: [
          completed("B01"),
          completed("B02"),
          completed("B04"),
          completed("B03"),
          completed("B05"),
        ],
      }),
    }),
  /fixed B01-B05 order/,
);

const persistenceFailureDirectory = await mkdtemp(
  join(tmpdir(), "h0-004-persist-failure-"),
);
await mkdir(join(persistenceFailureDirectory, H0_004_BASELINE_MARKDOWN));

const capture = createBenchmarkComparisonCapture(
  evidence(persistenceFailureDirectory),
  fixedSuite(),
  "2026-08-30T19:00:00.000Z",
);

await assert.rejects(() =>
  persistBenchmarkComparisonCapture({
    artifactDirectory: persistenceFailureDirectory,
    capture,
  }),
);

await assert.rejects(
  () => readFile(join(persistenceFailureDirectory, H0_004_BASELINE_JSON)),
  /ENOENT/,
);

const successfulPersistenceDirectory = await mkdtemp(
  join(tmpdir(), "h0-004-persist-success-"),
);
const artifacts = await persistBenchmarkComparisonCapture({
  artifactDirectory: successfulPersistenceDirectory,
  capture,
});

const json = await readFile(artifacts.jsonPath, "utf8");
const markdown = await readFile(artifacts.markdownPath, "utf8");

assert.equal(json, renderBenchmarkComparisonCaptureJson(capture));
assert.equal(
  markdown,
  renderBenchmarkComparisonCaptureMarkdown(capture),
);
assert.deepEqual(
  (JSON.parse(json) as typeof capture).report.tasks.map(
    (task) => task.benchmarkId,
  ),
  ["B01", "B02", "B03", "B04", "B05"],
);
assert.match(markdown, /Harness git revision: abc123/);
assert.match(markdown, /planner \| nvidia \| planner-model/);
assert.match(markdown, /# H0-004 Benchmark Comparison Report/);

console.log("H0-004 real suite capture tests passed");
