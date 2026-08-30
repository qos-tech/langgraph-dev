import type { BenchmarkSuiteAggregation } from "./aggregation.js";
import type {
  BenchmarkSuiteRunResult,
  BenchmarkSuiteTaskResult,
} from "./suite-runner.js";

export const BENCHMARK_COMPARISON_REPORT_SCHEMA_VERSION = 1 as const;

export type BenchmarkComparisonReport = Readonly<{
  schemaVersion: typeof BENCHMARK_COMPARISON_REPORT_SCHEMA_VERSION;
  suite: BenchmarkSuiteAggregation;
  tasks: readonly BenchmarkSuiteTaskResult[];
}>;

export type BenchmarkComparisonReportInput = Readonly<{
  suiteRun: BenchmarkSuiteRunResult;
  aggregation: BenchmarkSuiteAggregation;
}>;

export function createBenchmarkComparisonReport(
  input: BenchmarkComparisonReportInput,
): BenchmarkComparisonReport {
  return {
    schemaVersion: BENCHMARK_COMPARISON_REPORT_SCHEMA_VERSION,
    suite: input.aggregation,
    tasks: input.suiteRun.tasks,
  };
}

export function renderBenchmarkComparisonReportJson(
  report: BenchmarkComparisonReport,
): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}

function formatRate(value: number | null): string {
  return value === null ? "n/a" : `${(value * 100).toFixed(2)}%`;
}

function formatNullableNumber(value: number | null): string {
  return value === null ? "n/a" : String(value);
}

function escapeMarkdownCell(value: string): string {
  return value.replaceAll("|", "\\|").replaceAll("\n", " ");
}

function renderTaskRow(task: BenchmarkSuiteTaskResult): string {
  if (task.status === "infrastructure_failed") {
    const failure = `${task.error.name}: ${task.error.message}`;

    return [
      task.benchmarkId,
      task.status,
      "n/a",
      "n/a",
      "n/a",
      "n/a",
      "n/a",
      "n/a",
      "n/a",
      escapeMarkdownCell(failure),
    ].join(" | ");
  }

  const comparison = task.comparison;

  return [
    task.benchmarkId,
    task.status,
    comparison.expectedOutcome,
    comparison.observedOutcome,
    String(comparison.accepted),
    String(comparison.validationPassed),
    String(comparison.humanInterventionRequired),
    String(comparison.harnessDurationMs),
    String(comparison.llmCallCount),
    escapeMarkdownCell(comparison.terminalFailureReason ?? "n/a"),
  ].join(" | ");
}

function renderReasonSummary(
  title: string,
  counts: Readonly<Record<string, number>>,
): string[] {
  const entries = Object.entries(counts);

  if (entries.length === 0) {
    return [`## ${title}`, "", "None"];
  }

  return [
    `## ${title}`,
    "",
    ...entries.map(
      ([reason, count]) => `- ${escapeMarkdownCell(reason)}: ${count}`,
    ),
  ];
}

export function renderBenchmarkComparisonReportMarkdown(
  report: BenchmarkComparisonReport,
): string {
  const suite = report.suite;
  const lines = [
    "# H0-004 Benchmark Comparison Report",
    "",
    `Schema version: ${report.schemaVersion}`,
    "",
    "## Suite Summary",
    "",
    `- Selected tasks: ${suite.selectedTaskCount}`,
    `- Completed tasks: ${suite.completedTaskCount}`,
    `- Infrastructure failures: ${suite.infrastructureFailureCount}`,
    `- Accepted tasks: ${suite.acceptedTaskCount}`,
    `- SFCR: ${formatRate(suite.sfcr)}`,
    `- Outcome correctness: ${formatRate(suite.outcomeCorrectnessRate)}`,
    `- Validation success: ${formatRate(suite.validationSuccessRate)}`,
    `- Human intervention: ${formatRate(suite.humanInterventionRate)}`,
    `- Total Harness duration (ms): ${suite.totalHarnessDurationMs}`,
    `- Average Harness duration (ms): ${formatNullableNumber(
      suite.averageHarnessDurationMs,
    )}`,
    `- Total LLM calls: ${suite.totalLlmCallCount}`,
    `- Average LLM calls per completed task: ${formatNullableNumber(
      suite.averageLlmCallsPerCompletedTask,
    )}`,
    `- Prompt tokens: ${formatNullableNumber(suite.promptTokens)}`,
    `- Completion tokens: ${formatNullableNumber(suite.completionTokens)}`,
    `- Total tokens: ${formatNullableNumber(suite.totalTokens)}`,
    `- Cost: ${formatNullableNumber(suite.cost)}`,
    "",
    "## Tasks",
    "",
    "Benchmark | Status | Expected | Observed | Accepted | Validation | Human intervention | Duration ms | LLM calls | Failure",
    "--- | --- | --- | --- | --- | --- | --- | ---: | ---: | ---",
    ...report.tasks.map(renderTaskRow),
    "",
    ...renderReasonSummary(
      "Terminal Failure Reasons",
      suite.terminalFailureReasonCounts,
    ),
    "",
    ...renderReasonSummary(
      "Infrastructure Failure Reasons",
      suite.infrastructureFailureReasonCounts,
    ),
  ];

  return `${lines.join("\n")}\n`;
}
