import type { BenchmarkComparisonRecord } from "./comparison.js";
import type {
  BenchmarkSuiteRunResult,
  BenchmarkSuiteTaskResult,
} from "./suite-runner.js";

export type BenchmarkSuiteAggregation = Readonly<{
  selectedTaskCount: number;
  completedTaskCount: number;
  infrastructureFailureCount: number;

  acceptedTaskCount: number;
  sfcr: number | null;

  outcomeMatchCount: number;
  outcomeCorrectnessRate: number | null;

  validationPassedCount: number;
  validationSuccessRate: number | null;

  humanInterventionRequiredCount: number;
  humanInterventionRate: number | null;

  totalHarnessDurationMs: number;
  averageHarnessDurationMs: number | null;

  totalLlmCallCount: number;
  averageLlmCallsPerCompletedTask: number | null;

  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;

  cost: null;

  terminalFailureReasonCounts: Readonly<Record<string, number>>;
  infrastructureFailureReasonCounts: Readonly<Record<string, number>>;
}>;

type TokenField = "promptTokens" | "completionTokens" | "totalTokens";

function incrementCount(
  counts: Record<string, number>,
  key: string,
): void {
  counts[key] = (counts[key] ?? 0) + 1;
}

function aggregateCompletedTokenField(
  comparisons: readonly BenchmarkComparisonRecord[],
  field: TokenField,
): number | null {
  if (comparisons.length === 0) {
    return 0;
  }

  let total = 0;

  for (const comparison of comparisons) {
    const value = comparison[field];

    if (value === null) {
      return null;
    }

    total += value;
  }

  return total;
}

function completedComparisons(
  tasks: readonly BenchmarkSuiteTaskResult[],
): readonly BenchmarkComparisonRecord[] {
  return tasks
    .filter((task) => task.status === "completed")
    .map((task) => task.comparison);
}

export function aggregateBenchmarkSuite(
  suite: BenchmarkSuiteRunResult,
): BenchmarkSuiteAggregation {
  const selectedTaskCount = suite.tasks.length;
  const comparisons = completedComparisons(suite.tasks);
  const completedTaskCount = comparisons.length;
  const infrastructureFailureCount =
    selectedTaskCount - completedTaskCount;

  let acceptedTaskCount = 0;
  let outcomeMatchCount = 0;
  let validationPassedCount = 0;
  let humanInterventionRequiredCount = 0;
  let totalHarnessDurationMs = 0;
  let totalLlmCallCount = 0;

  const terminalFailureReasonCounts: Record<string, number> = {};
  const infrastructureFailureReasonCounts: Record<string, number> = {};

  for (const comparison of comparisons) {
    if (comparison.accepted) {
      acceptedTaskCount += 1;
    }

    if (comparison.observedOutcome === comparison.expectedOutcome) {
      outcomeMatchCount += 1;
    }

    if (comparison.validationPassed) {
      validationPassedCount += 1;
    }

    if (comparison.humanInterventionRequired) {
      humanInterventionRequiredCount += 1;
    }

    totalHarnessDurationMs += comparison.harnessDurationMs;
    totalLlmCallCount += comparison.llmCallCount;

    if (comparison.terminalFailureReason !== null) {
      incrementCount(
        terminalFailureReasonCounts,
        comparison.terminalFailureReason,
      );
    }
  }

  for (const task of suite.tasks) {
    if (task.status === "infrastructure_failed") {
      incrementCount(infrastructureFailureReasonCounts, task.error.name);
    }
  }

  const selectedRate = (count: number): number | null =>
    selectedTaskCount === 0 ? null : count / selectedTaskCount;

  return {
    selectedTaskCount,
    completedTaskCount,
    infrastructureFailureCount,

    acceptedTaskCount,
    sfcr: selectedRate(acceptedTaskCount),

    outcomeMatchCount,
    outcomeCorrectnessRate: selectedRate(outcomeMatchCount),

    validationPassedCount,
    validationSuccessRate: selectedRate(validationPassedCount),

    humanInterventionRequiredCount,
    humanInterventionRate: selectedRate(
      humanInterventionRequiredCount,
    ),

    totalHarnessDurationMs,
    averageHarnessDurationMs:
      completedTaskCount === 0
        ? null
        : totalHarnessDurationMs / completedTaskCount,

    totalLlmCallCount,
    averageLlmCallsPerCompletedTask:
      completedTaskCount === 0
        ? null
        : totalLlmCallCount / completedTaskCount,

    promptTokens: aggregateCompletedTokenField(
      comparisons,
      "promptTokens",
    ),
    completionTokens: aggregateCompletedTokenField(
      comparisons,
      "completionTokens",
    ),
    totalTokens: aggregateCompletedTokenField(comparisons, "totalTokens"),

    cost: null,

    terminalFailureReasonCounts,
    infrastructureFailureReasonCounts,
  };
}
