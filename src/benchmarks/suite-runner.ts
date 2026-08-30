import { benchmarkCases } from "./cases.js";
import {
  createBenchmarkComparisonRecord,
  type BenchmarkComparisonRecord,
} from "./comparison.js";
import type { CompleteBenchmarkRunnerResult } from "./complete-runner.js";
import type { BenchmarkTask } from "./contracts.js";

export type BenchmarkSuiteTaskError = Readonly<{
  name: string;
  message: string;
}>;

export type BenchmarkSuiteCompletedTaskResult = Readonly<{
  benchmarkId: string;
  status: "completed";
  comparison: BenchmarkComparisonRecord;
}>;

export type BenchmarkSuiteInfrastructureFailure = Readonly<{
  benchmarkId: string;
  status: "infrastructure_failed";
  error: BenchmarkSuiteTaskError;
}>;

export type BenchmarkSuiteTaskResult =
  | BenchmarkSuiteCompletedTaskResult
  | BenchmarkSuiteInfrastructureFailure;

export type BenchmarkSuiteRunResult = Readonly<{
  tasks: readonly BenchmarkSuiteTaskResult[];
}>;

export interface BenchmarkComparisonStore {
  saveTaskResult(result: BenchmarkSuiteTaskResult): Promise<void>;
}

export type CompleteBenchmarkExecutor = (
  benchmark: BenchmarkTask,
) => Promise<CompleteBenchmarkRunnerResult>;

export type BenchmarkComparisonRecordFactory = (
  benchmark: BenchmarkTask,
  result: CompleteBenchmarkRunnerResult,
) => BenchmarkComparisonRecord;

export type BenchmarkSuiteRunnerDependencies = Readonly<{
  runBenchmark: CompleteBenchmarkExecutor;
  store: BenchmarkComparisonStore;
  benchmarks?: readonly BenchmarkTask[];
  createComparisonRecord?: BenchmarkComparisonRecordFactory;
}>;

function normalizeInfrastructureError(error: unknown): BenchmarkSuiteTaskError {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
    };
  }

  return {
    name: "Error",
    message: String(error),
  };
}

export async function runBenchmarkSuite(
  dependencies: BenchmarkSuiteRunnerDependencies,
): Promise<BenchmarkSuiteRunResult> {
  const benchmarks = dependencies.benchmarks ?? benchmarkCases;
  const createComparison =
    dependencies.createComparisonRecord ?? createBenchmarkComparisonRecord;
  const taskResults: BenchmarkSuiteTaskResult[] = [];

  for (const benchmark of benchmarks) {
    let taskResult: BenchmarkSuiteTaskResult;

    try {
      const completeResult = await dependencies.runBenchmark(benchmark);
      const comparison = createComparison(benchmark, completeResult);

      taskResult = {
        benchmarkId: benchmark.id,
        status: "completed",
        comparison,
      };
    } catch (error) {
      taskResult = {
        benchmarkId: benchmark.id,
        status: "infrastructure_failed",
        error: normalizeInfrastructureError(error),
      };
    }

    await dependencies.store.saveTaskResult(taskResult);
    taskResults.push(taskResult);
  }

  return {
    tasks: taskResults,
  };
}
