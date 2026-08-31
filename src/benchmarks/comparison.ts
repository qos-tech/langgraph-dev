import type {
  BenchmarkAcceptanceFailure,
} from "./acceptance.js";
import type {
  BenchmarkDifficulty,
  BenchmarkExpectedOutcome,
  BenchmarkTask,
} from "./contracts.js";
import type { CompleteBenchmarkRunnerResult } from "./complete-runner.js";
import type { LlmCallTelemetry } from "../telemetry/contracts.js";

export type BenchmarkComparisonRecord = Readonly<{
  benchmarkId: string;
  difficulty: BenchmarkDifficulty;
  expectedOutcome: BenchmarkExpectedOutcome;
  observedOutcome: BenchmarkExpectedOutcome | null;
  accepted: boolean;
  acceptanceFailures: readonly BenchmarkAcceptanceFailure[];
  validationPassed: boolean;
  humanInterventionRequired: boolean;
  filesChanged: readonly string[];
  filesChangedCount: number;
  harnessDurationMs: number;
  llmCallCount: number;
  llmCalls: readonly LlmCallTelemetry[];
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  cost: null;
  terminalFailureReason: string | null;
}>;

function terminalFailureReason(
  result: CompleteBenchmarkRunnerResult,
): string | null {
  if (result.observation.terminal?.kind === "planning_exhausted") {
    return "planning_exhausted";
  }

  return result.harness.state.failureReason ?? null;
}

function sumCompleteUsage(
  calls: readonly LlmCallTelemetry[],
  field: "promptTokens" | "completionTokens" | "totalTokens",
): number | null {
  if (calls.length === 0) {
    return 0;
  }

  let total = 0;

  for (const call of calls) {
    const value = call[field];

    if (value === undefined) {
      return null;
    }

    total += value;
  }

  return total;
}

export function createBenchmarkComparisonRecord(
  benchmark: BenchmarkTask,
  result: CompleteBenchmarkRunnerResult,
): BenchmarkComparisonRecord {
  const llmCalls = result.harness.telemetry.llmCalls.map((call) => ({
    ...call,
  }));

  return {
    benchmarkId: benchmark.id,
    difficulty: benchmark.difficulty,
    expectedOutcome: benchmark.expectedOutcome,
    observedOutcome: result.observation.finalOutcome,
    accepted: result.acceptance.accepted,
    acceptanceFailures: [...result.acceptance.failures],
    validationPassed: result.observation.validationPassed,
    humanInterventionRequired:
      result.observation.humanInterventionRequired,
    filesChanged: [...result.observation.filesChanged],
    filesChangedCount: result.observation.filesChanged.length,
    harnessDurationMs: result.harness.telemetry.durationMs,
    llmCallCount: llmCalls.length,
    llmCalls,
    promptTokens: sumCompleteUsage(llmCalls, "promptTokens"),
    completionTokens: sumCompleteUsage(llmCalls, "completionTokens"),
    totalTokens: sumCompleteUsage(llmCalls, "totalTokens"),
    cost: null,
    terminalFailureReason: terminalFailureReason(result),
  };
}
