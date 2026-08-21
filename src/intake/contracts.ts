export const HARNESS_TASK_SCHEMA_VERSION = 1 as const;

export type HarnessTaskSource =
  | "manual"
  | "cli"
  | "benchmark"
  | "self-improvement";

export type HarnessRepositoryRef = Readonly<{
  id: string;
  revision?: string;
}>;

export type NormalizedHarnessTask = Readonly<{
  schemaVersion: typeof HARNESS_TASK_SCHEMA_VERSION;
  id: string;
  source: HarnessTaskSource;
  repository: HarnessRepositoryRef;
  request: string;
  constraints: readonly string[];
  acceptanceCriteria: readonly string[];
  metadata: Readonly<Record<string, unknown>>;
}>;

export function defineNormalizedHarnessTask<
  const T extends NormalizedHarnessTask,
>(task: T): T {
  return task;
}
