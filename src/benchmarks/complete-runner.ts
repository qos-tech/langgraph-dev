import {
  evaluateBenchmarkAcceptance,
  type BenchmarkAcceptanceResult,
  type BenchmarkRunObservation,
} from "./acceptance.js";
import { collectBenchmarkChangedFiles } from "./changed-files.js";
import type { BenchmarkTask } from "./contracts.js";
import {
  deriveBenchmarkRunObservation,
  type BenchmarkObservationEvidence,
} from "./observation.js";
import {
  runHarness as defaultRunHarness,
  type HarnessRunResult,
} from "../app/run-harness.js";
import type { BenchmarkHarnessExecutor } from "./run-benchmark.js";
import { adaptBenchmarkTaskToHarnessTask } from "./task-adapter.js";
import {
  executeBenchmarkValidation,
  type BenchmarkValidationRequest,
  type BenchmarkValidationResult,
} from "./validation.js";
import type { BenchmarkWorkspaceResolver } from "./workspace.js";

export type CompleteBenchmarkRunnerResult = Readonly<{
  harness: HarnessRunResult;
  validation: BenchmarkValidationResult;
  observation: BenchmarkRunObservation;
  acceptance: BenchmarkAcceptanceResult;
}>;

export type BenchmarkValidationExecutor = (
  request: BenchmarkValidationRequest,
) => Promise<BenchmarkValidationResult>;

export type BenchmarkChangedFilesCollector = (
  repositoryPath: string,
) => Promise<readonly string[]>;

export type BenchmarkObservationDeriver = (
  evidence: BenchmarkObservationEvidence,
) => BenchmarkRunObservation;

export type BenchmarkAcceptanceEvaluator = (
  benchmark: BenchmarkTask,
  observation: BenchmarkRunObservation,
) => BenchmarkAcceptanceResult;

export type CompleteBenchmarkRunnerDependencies = Readonly<{
  workspaceResolver: BenchmarkWorkspaceResolver;
  runHarness?: BenchmarkHarnessExecutor;
  executeValidation?: BenchmarkValidationExecutor;
  collectChangedFiles?: BenchmarkChangedFilesCollector;
  deriveObservation?: BenchmarkObservationDeriver;
  evaluateAcceptance?: BenchmarkAcceptanceEvaluator;
}>;

export async function runCompleteBenchmark(
  benchmark: BenchmarkTask,
  dependencies: CompleteBenchmarkRunnerDependencies,
): Promise<CompleteBenchmarkRunnerResult> {
  const task = adaptBenchmarkTaskToHarnessTask(benchmark);
  const resolvedWorkspace = await dependencies.workspaceResolver.resolve({
    repository: benchmark.repository,
  });

  const executeHarness = dependencies.runHarness ?? defaultRunHarness;
  const validate =
    dependencies.executeValidation ?? executeBenchmarkValidation;
  const collectChangedFiles =
    dependencies.collectChangedFiles ?? collectBenchmarkChangedFiles;
  const deriveObservation =
    dependencies.deriveObservation ?? deriveBenchmarkRunObservation;
  const evaluateAcceptance =
    dependencies.evaluateAcceptance ?? evaluateBenchmarkAcceptance;

  let primaryError: unknown;

  try {
    const harness = await executeHarness({
      task,
      workspace: resolvedWorkspace.workspace,
    });

    const validation = await validate({
      repositoryPath: resolvedWorkspace.workspace.repositoryPath,
      commands: benchmark.validationCommands,
    });

    const filesChanged = await collectChangedFiles(
      resolvedWorkspace.workspace.repositoryPath,
    );

    const observation = deriveObservation({
      harnessResult: harness,
      filesChanged,
      validation,
      humanInterventionRequired: false,
    });

    const acceptance = evaluateAcceptance(benchmark, observation);

    return {
      harness,
      validation,
      observation,
      acceptance,
    };
  } catch (error) {
    primaryError = error;
    throw error;
  } finally {
    try {
      await resolvedWorkspace.cleanup();
    } catch (cleanupError) {
      if (primaryError === undefined) {
        throw cleanupError;
      }

      // Preserve the primary runner failure when cleanup also fails.
    }
  }
}
