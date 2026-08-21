import {
  HARNESS_TASK_SCHEMA_VERSION,
  type HarnessRepositoryRef,
  type HarnessTaskSource,
  type NormalizedHarnessTask,
} from "./contracts.js";

export type RawHarnessTaskInput = Readonly<{
  id: string;
  source: string;
  repository: Readonly<{
    id: string;
    revision?: string;
  }>;
  request: string;
  constraints?: readonly string[];
  acceptanceCriteria?: readonly string[];
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type HarnessTaskNormalizationIssueCode =
  | "blank_id"
  | "unsupported_source"
  | "blank_repository_id"
  | "absolute_repository_id"
  | "blank_repository_revision"
  | "blank_request"
  | "blank_constraint"
  | "blank_acceptance_criterion";

export type HarnessTaskNormalizationIssue = Readonly<{
  code: HarnessTaskNormalizationIssueCode;
  detail: string;
}>;

export class HarnessTaskNormalizationError extends Error {
  readonly issues: readonly HarnessTaskNormalizationIssue[];

  constructor(issues: readonly HarnessTaskNormalizationIssue[]) {
    super(
      [
        "Invalid Harness task input:",
        ...issues.map((issue) => `- ${issue.code}: ${issue.detail}`),
      ].join("\n"),
    );
    this.name = "HarnessTaskNormalizationError";
    this.issues = issues;
  }
}

const HARNESS_TASK_SOURCES = new Set<HarnessTaskSource>([
  "manual",
  "cli",
  "benchmark",
  "self-improvement",
]);

function isHarnessTaskSource(value: string): value is HarnessTaskSource {
  return HARNESS_TASK_SOURCES.has(value as HarnessTaskSource);
}

function hasAbsoluteRepositoryShape(repositoryId: string): boolean {
  return (
    repositoryId.startsWith("/") ||
    repositoryId.startsWith("\\\\") ||
    /^[A-Za-z]:[\\/]/.test(repositoryId)
  );
}

function trimStringList(
  values: readonly string[] | undefined,
  blankCode: "blank_constraint" | "blank_acceptance_criterion",
  label: string,
  issues: HarnessTaskNormalizationIssue[],
): readonly string[] {
  if (!values) {
    return [];
  }

  const normalized: string[] = [];

  for (const value of values) {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      issues.push({
        code: blankCode,
        detail: `${label} entries must not be blank.`,
      });
      continue;
    }

    normalized.push(trimmed);
  }

  return normalized;
}

function normalizeRepository(
  repository: RawHarnessTaskInput["repository"],
  issues: HarnessTaskNormalizationIssue[],
): HarnessRepositoryRef {
  const id = repository.id.trim();
  const revision = repository.revision?.trim();

  if (id.length === 0) {
    issues.push({
      code: "blank_repository_id",
      detail: "Repository ID must not be blank.",
    });
  } else if (hasAbsoluteRepositoryShape(id)) {
    issues.push({
      code: "absolute_repository_id",
      detail: "Repository ID must be machine-independent, not an absolute path.",
    });
  }

  if (repository.revision !== undefined && revision?.length === 0) {
    issues.push({
      code: "blank_repository_revision",
      detail: "Repository revision must not be blank when provided.",
    });
  }

  return {
    id,
    ...(revision ? { revision } : {}),
  };
}

export function normalizeHarnessTask(
  input: RawHarnessTaskInput,
): NormalizedHarnessTask {
  const issues: HarnessTaskNormalizationIssue[] = [];
  const id = input.id.trim();
  const request = input.request.trim();
  const source = input.source.trim();

  if (id.length === 0) {
    issues.push({
      code: "blank_id",
      detail: "Task ID must not be blank.",
    });
  }

  if (!isHarnessTaskSource(source)) {
    issues.push({
      code: "unsupported_source",
      detail: `Unsupported task source: ${source || "<blank>"}.`,
    });
  }

  if (request.length === 0) {
    issues.push({
      code: "blank_request",
      detail: "Task request must not be blank.",
    });
  }

  const repository = normalizeRepository(input.repository, issues);
  const constraints = trimStringList(
    input.constraints,
    "blank_constraint",
    "Constraint",
    issues,
  );
  const acceptanceCriteria = trimStringList(
    input.acceptanceCriteria,
    "blank_acceptance_criterion",
    "Acceptance criterion",
    issues,
  );

  if (issues.length > 0) {
    throw new HarnessTaskNormalizationError(issues);
  }

  if (!isHarnessTaskSource(source)) {
    throw new Error("Harness task source normalization invariant violated.");
  }

  return {
    schemaVersion: HARNESS_TASK_SCHEMA_VERSION,
    id,
    source,
    repository,
    request,
    constraints,
    acceptanceCriteria,
    metadata: input.metadata ?? {},
  };
}
