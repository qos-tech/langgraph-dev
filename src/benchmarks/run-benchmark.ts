import {
  runHarness as defaultRunHarness,
  type HarnessRunResult,
  type RunHarnessRequest,
} from "../app/run-harness.js";
import type { BenchmarkTask } from "./contracts.js";
import { adaptBenchmarkTaskToHarnessTask } from "./task-adapter.js";
import type { BenchmarkWorkspaceResolver } from "./workspace.js";

export type RunBenchmarkRequest = Readonly<{
  benchmark: BenchmarkTask;
}>;

export type BenchmarkHarnessExecutor = (
  request: RunHarnessRequest,
) => Promise<HarnessRunResult>;

export type RunBenchmarkDependencies = Readonly<{
  workspaceResolver: BenchmarkWorkspaceResolver;
  runHarness?: BenchmarkHarnessExecutor;
}>;

export async function runBenchmark(
  request: RunBenchmarkRequest,
  dependencies: RunBenchmarkDependencies,
): Promise<HarnessRunResult> {
  const task = adaptBenchmarkTaskToHarnessTask(request.benchmark);

  const resolvedWorkspace = await dependencies.workspaceResolver.resolve({
    repository: request.benchmark.repository,
  });

  const executeHarness = dependencies.runHarness ?? defaultRunHarness;
  let harnessError: unknown;

  try {
    return await executeHarness({
      task,
      workspace: resolvedWorkspace.workspace,
    });
  } catch (error) {
    harnessError = error;
    throw error;
  } finally {
    try {
      await resolvedWorkspace.cleanup();
    } catch (cleanupError) {
      if (harnessError === undefined) {
        throw cleanupError;
      }

      // Preserve the primary Harness failure when cleanup also fails.
    }
  }
}
