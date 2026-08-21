export const BENCHMARK_TASK_SCHEMA_VERSION = 1 as const;

export type BenchmarkDifficulty =
  | "trivial"
  | "already-satisfied"
  | "localized"
  | "cross-file"
  | "architectural";

export type BenchmarkExpectedOutcome =
  | "changes_required"
  | "already_satisfied"
  | "blocked";

export type BenchmarkRepositoryRef = Readonly<{
  id: string;
  revision: string;
}>;

export type BenchmarkTask = Readonly<{
  schemaVersion: typeof BENCHMARK_TASK_SCHEMA_VERSION;
  id: string;
  title: string;
  difficulty: BenchmarkDifficulty;
  task: string;
  repository: BenchmarkRepositoryRef;
  constraints: readonly string[];
  successCriteria: readonly string[];
  validationCommands: readonly string[];
  expectedOutcome: BenchmarkExpectedOutcome;
}>;

export function defineBenchmarkTask<const T extends BenchmarkTask>(
  task: T,
): T {
  return task;
}
