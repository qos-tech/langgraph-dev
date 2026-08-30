import assert from "node:assert/strict";
import {
  aggregateBenchmarkSuite,
  type BenchmarkSuiteAggregation,
} from "./benchmarks/aggregation.js";
import type { BenchmarkComparisonRecord } from "./benchmarks/comparison.js";
import {
  BENCHMARK_COMPARISON_REPORT_SCHEMA_VERSION,
  createBenchmarkComparisonReport,
  renderBenchmarkComparisonReportJson,
  renderBenchmarkComparisonReportMarkdown,
} from "./benchmarks/report.js";
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
    error: { name, message },
  };
}

function suite(
  ...tasks: readonly BenchmarkSuiteTaskResult[]
): BenchmarkSuiteRunResult {
  return { tasks };
}

const suiteRun = suite(
  completed(comparison({ benchmarkId: "B01" })),
  completed(
    comparison({
      benchmarkId: "B02",
      accepted: false,
      observedOutcome: "blocked",
      validationPassed: false,
      humanInterventionRequired: true,
      harnessDurationMs: 300,
      llmCallCount: 0,
      llmCalls: [],
      promptTokens: null,
      completionTokens: 0,
      totalTokens: null,
      terminalFailureReason: "validation failed",
    }),
  ),
  infrastructureFailure("B03", "WorkspaceError", "checkout | failed"),
);
const aggregation = aggregateBenchmarkSuite(suiteRun);
const report = createBenchmarkComparisonReport({
  suiteRun,
  aggregation,
});

assert.equal(
  report.schemaVersion,
  BENCHMARK_COMPARISON_REPORT_SCHEMA_VERSION,
);
assert.strictEqual(
  report.suite,
  aggregation,
  "report factory must preserve the supplied aggregate instead of recomputing it",
);
assert.strictEqual(
  report.tasks,
  suiteRun.tasks,
  "report factory must preserve ordered suite task evidence",
);

const inputSnapshot = JSON.stringify({ suiteRun, aggregation });
createBenchmarkComparisonReport({ suiteRun, aggregation });
assert.equal(
  JSON.stringify({ suiteRun, aggregation }),
  inputSnapshot,
  "report factory must not mutate input evidence",
);

const jsonOne = renderBenchmarkComparisonReportJson(report);
const jsonTwo = renderBenchmarkComparisonReportJson(report);

assert.equal(jsonOne, jsonTwo, "JSON rendering must be byte deterministic");
assert.ok(jsonOne.endsWith("\n"), "JSON rendering must end with newline");
assert.match(jsonOne, /\n  "schemaVersion": 1,/);

const parsed = JSON.parse(jsonOne) as {
  schemaVersion: number;
  tasks: Array<{
    benchmarkId: string;
    status: string;
    comparison?: BenchmarkComparisonRecord;
    error?: { name: string; message: string };
  }>;
};

assert.equal(parsed.schemaVersion, 1);
assert.deepEqual(
  parsed.tasks.map((task) => task.benchmarkId),
  ["B01", "B02", "B03"],
  "JSON must preserve task order",
);
assert.equal(parsed.tasks[1]?.comparison?.accepted, false);
assert.equal(parsed.tasks[2]?.status, "infrastructure_failed");
assert.equal(parsed.tasks[2]?.error?.name, "WorkspaceError");
assert.equal(parsed.tasks[2]?.error?.message, "checkout | failed");

const markdown = renderBenchmarkComparisonReportMarkdown(report);

assert.match(markdown, /# H0-004 Benchmark Comparison Report/);
assert.match(markdown, /Schema version: 1/);
assert.match(markdown, /- SFCR: 33\.33%/);
assert.match(markdown, /- Outcome correctness: 33\.33%/);
assert.match(markdown, /- Validation success: 33\.33%/);
assert.match(markdown, /- Human intervention: 33\.33%/);
assert.match(markdown, /- Prompt tokens: n\/a/);
assert.match(markdown, /- Completion tokens: 20/);
assert.match(markdown, /- Total tokens: n\/a/);
assert.match(markdown, /- Cost: n\/a/);
assert.match(
  markdown,
  /B02 \| completed \| changes_required \| blocked \| false \| false \| true \| 300 \| 0 \| validation failed/,
);
assert.match(
  markdown,
  /B03 \| infrastructure_failed \| n\/a \| n\/a \| n\/a \| n\/a \| n\/a \| n\/a \| n\/a \| WorkspaceError: checkout \\?\| failed/,
);
assert.ok(
  markdown.indexOf("B01 | completed") <
    markdown.indexOf("B02 | completed") &&
    markdown.indexOf("B02 | completed") <
      markdown.indexOf("B03 | infrastructure_failed"),
  "Markdown must preserve suite task order",
);
assert.match(markdown, /## Terminal Failure Reasons[\s\S]*- validation failed: 1/);
assert.match(
  markdown,
  /## Infrastructure Failure Reasons[\s\S]*- WorkspaceError: 1/,
);

const knownZeroAggregation: BenchmarkSuiteAggregation = {
  ...aggregation,
  promptTokens: 0,
  completionTokens: 0,
  totalTokens: 0,
  averageLlmCallsPerCompletedTask: 0,
};
const knownZeroMarkdown = renderBenchmarkComparisonReportMarkdown(
  createBenchmarkComparisonReport({
    suiteRun,
    aggregation: knownZeroAggregation,
  }),
);
assert.match(knownZeroMarkdown, /- Prompt tokens: 0/);
assert.match(
  knownZeroMarkdown,
  /- Average LLM calls per completed task: 0/,
);

const emptySuite = suite();
const emptyAggregation = aggregateBenchmarkSuite(emptySuite);
const emptyReport = createBenchmarkComparisonReport({
  suiteRun: emptySuite,
  aggregation: emptyAggregation,
});
const emptyJson = renderBenchmarkComparisonReportJson(emptyReport);
const emptyMarkdown = renderBenchmarkComparisonReportMarkdown(emptyReport);

assert.deepEqual(JSON.parse(emptyJson).tasks, []);
assert.match(emptyMarkdown, /- Selected tasks: 0/);
assert.match(emptyMarkdown, /- SFCR: n\/a/);
assert.match(emptyMarkdown, /- Average Harness duration \(ms\): n\/a/);
assert.match(emptyMarkdown, /- Prompt tokens: 0/);
assert.match(emptyMarkdown, /## Terminal Failure Reasons[\s\S]*None/);
assert.match(emptyMarkdown, /## Infrastructure Failure Reasons[\s\S]*None/);

console.log("H0-004 comparison report tests passed");
