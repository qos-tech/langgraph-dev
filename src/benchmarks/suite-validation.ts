import {
  BENCHMARK_TASK_SCHEMA_VERSION,
  type BenchmarkDifficulty,
  type BenchmarkTask,
} from "./contracts.js";

export const EXPECTED_BENCHMARK_IDS = [
  "B01",
  "B02",
  "B03",
  "B04",
  "B05",
] as const;

export const EXPECTED_BENCHMARK_DIFFICULTIES = [
  "trivial",
  "already-satisfied",
  "localized",
  "cross-file",
  "architectural",
] as const satisfies readonly BenchmarkDifficulty[];

export type BenchmarkSuiteValidationIssueCode =
  | "unexpected_case_count"
  | "unexpected_case_order"
  | "duplicate_case_id"
  | "duplicate_repository_revision"
  | "unsupported_schema_version"
  | "unexpected_difficulty_distribution"
  | "empty_title"
  | "empty_task"
  | "empty_repository_id"
  | "absolute_repository_id"
  | "empty_repository_revision"
  | "empty_constraints"
  | "empty_success_criteria"
  | "empty_validation_commands"
  | "blank_constraint"
  | "blank_success_criterion"
  | "blank_validation_command"
  | "duplicate_constraint"
  | "duplicate_success_criterion"
  | "duplicate_validation_command";

export type BenchmarkSuiteValidationIssue = Readonly<{
  code: BenchmarkSuiteValidationIssueCode;
  benchmarkId?: string;
  detail: string;
}>;

export type BenchmarkSuiteValidationResult = Readonly<{
  valid: boolean;
  issues: readonly BenchmarkSuiteValidationIssue[];
}>;

function duplicates(values: readonly string[]): readonly string[] {
  const seen = new Set<string>();
  const repeated = new Set<string>();

  for (const value of values) {
    if (seen.has(value)) {
      repeated.add(value);
    } else {
      seen.add(value);
    }
  }

  return [...repeated];
}

function hasAbsoluteRepositoryShape(repositoryId: string): boolean {
  return (
    repositoryId.startsWith("/") ||
    repositoryId.startsWith("\\\\") ||
    /^[A-Za-z]:[\\/]/.test(repositoryId)
  );
}

export function validateBenchmarkSuite(
  benchmarks: readonly BenchmarkTask[],
): BenchmarkSuiteValidationResult {
  const issues: BenchmarkSuiteValidationIssue[] = [];

  if (benchmarks.length !== EXPECTED_BENCHMARK_IDS.length) {
    issues.push({
      code: "unexpected_case_count",
      detail: `Expected ${EXPECTED_BENCHMARK_IDS.length} benchmark cases, received ${benchmarks.length}.`,
    });
  }

  const ids = benchmarks.map((benchmark) => benchmark.id);

  if (
    ids.length !== EXPECTED_BENCHMARK_IDS.length ||
    ids.some((id, index) => id !== EXPECTED_BENCHMARK_IDS[index])
  ) {
    issues.push({
      code: "unexpected_case_order",
      detail: `Expected ordered IDs ${EXPECTED_BENCHMARK_IDS.join(", ")}, received ${ids.join(", ")}.`,
    });
  }

  for (const duplicateId of duplicates(ids)) {
    issues.push({
      code: "duplicate_case_id",
      benchmarkId: duplicateId,
      detail: `Benchmark ID ${duplicateId} appears more than once.`,
    });
  }

  const repositoryRevisions = benchmarks.map(
    (benchmark) => `${benchmark.repository.id}@${benchmark.repository.revision}`,
  );

  for (const duplicateRepositoryRevision of duplicates(repositoryRevisions)) {
    issues.push({
      code: "duplicate_repository_revision",
      detail: `Repository revision ${duplicateRepositoryRevision} is assigned to more than one benchmark.`,
    });
  }

  const difficulties = benchmarks.map((benchmark) => benchmark.difficulty);
  const expectedDifficultyCounts = new Map(
    EXPECTED_BENCHMARK_DIFFICULTIES.map((difficulty) => [difficulty, 1] as const),
  );
  const actualDifficultyCounts = new Map<BenchmarkDifficulty, number>();

  for (const difficulty of difficulties) {
    actualDifficultyCounts.set(
      difficulty,
      (actualDifficultyCounts.get(difficulty) ?? 0) + 1,
    );
  }

  const difficultyDistributionMatches = EXPECTED_BENCHMARK_DIFFICULTIES.every(
    (difficulty) =>
      actualDifficultyCounts.get(difficulty) ===
      expectedDifficultyCounts.get(difficulty),
  );

  if (!difficultyDistributionMatches) {
    issues.push({
      code: "unexpected_difficulty_distribution",
      detail: "Expected exactly one benchmark for each planned difficulty.",
    });
  }

  for (const benchmark of benchmarks) {
    if (benchmark.schemaVersion !== BENCHMARK_TASK_SCHEMA_VERSION) {
      issues.push({
        code: "unsupported_schema_version",
        benchmarkId: benchmark.id,
        detail: `Unsupported schema version ${benchmark.schemaVersion}.`,
      });
    }

    if (benchmark.title.trim().length === 0) {
      issues.push({
        code: "empty_title",
        benchmarkId: benchmark.id,
        detail: "Benchmark title must not be blank.",
      });
    }

    if (benchmark.task.trim().length === 0) {
      issues.push({
        code: "empty_task",
        benchmarkId: benchmark.id,
        detail: "Benchmark task must not be blank.",
      });
    }

    if (benchmark.repository.id.trim().length === 0) {
      issues.push({
        code: "empty_repository_id",
        benchmarkId: benchmark.id,
        detail: "Repository ID must not be blank.",
      });
    } else if (hasAbsoluteRepositoryShape(benchmark.repository.id)) {
      issues.push({
        code: "absolute_repository_id",
        benchmarkId: benchmark.id,
        detail: "Repository ID must be machine-independent, not an absolute path.",
      });
    }

    if (benchmark.repository.revision.trim().length === 0) {
      issues.push({
        code: "empty_repository_revision",
        benchmarkId: benchmark.id,
        detail: "Repository revision must not be blank.",
      });
    }

    const lists = [
      {
        values: benchmark.constraints,
        emptyCode: "empty_constraints" as const,
        blankCode: "blank_constraint" as const,
        duplicateCode: "duplicate_constraint" as const,
        label: "constraint",
      },
      {
        values: benchmark.successCriteria,
        emptyCode: "empty_success_criteria" as const,
        blankCode: "blank_success_criterion" as const,
        duplicateCode: "duplicate_success_criterion" as const,
        label: "success criterion",
      },
      {
        values: benchmark.validationCommands,
        emptyCode: "empty_validation_commands" as const,
        blankCode: "blank_validation_command" as const,
        duplicateCode: "duplicate_validation_command" as const,
        label: "validation command",
      },
    ];

    for (const list of lists) {
      if (list.values.length === 0) {
        issues.push({
          code: list.emptyCode,
          benchmarkId: benchmark.id,
          detail: `Benchmark must contain at least one ${list.label}.`,
        });
      }

      if (list.values.some((value) => value.trim().length === 0)) {
        issues.push({
          code: list.blankCode,
          benchmarkId: benchmark.id,
          detail: `Benchmark contains a blank ${list.label}.`,
        });
      }

      if (duplicates(list.values).length > 0) {
        issues.push({
          code: list.duplicateCode,
          benchmarkId: benchmark.id,
          detail: `Benchmark contains duplicate ${list.label} entries.`,
        });
      }
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

export function assertValidBenchmarkSuite(
  benchmarks: readonly BenchmarkTask[],
): void {
  const result = validateBenchmarkSuite(benchmarks);

  if (result.valid) {
    return;
  }

  throw new Error(
    [
      "Invalid benchmark suite:",
      ...result.issues.map((issue) => {
        const prefix = issue.benchmarkId ? `[${issue.benchmarkId}] ` : "";
        return `- ${prefix}${issue.code}: ${issue.detail}`;
      }),
    ].join("\n"),
  );
}
