import assert from "node:assert/strict";
import {
  HarnessTaskNormalizationError,
  normalizeHarnessTask,
} from "./intake/normalize.js";

assert.deepEqual(
  normalizeHarnessTask({
    id: "  task-001  ",
    source: "  cli  ",
    repository: {
      id: "  qos-harness  ",
      revision: "  v0.1.0-alpha.6  ",
    },
    request: "  Add a normalized task boundary.  ",
    constraints: ["  Preserve runtime behavior.  "],
    acceptanceCriteria: ["  Typecheck remains green.  "],
    metadata: {
      correlationId: "abc-123",
    },
  }),
  {
    schemaVersion: 1,
    id: "task-001",
    source: "cli",
    repository: {
      id: "qos-harness",
      revision: "v0.1.0-alpha.6",
    },
    request: "Add a normalized task boundary.",
    constraints: ["Preserve runtime behavior."],
    acceptanceCriteria: ["Typecheck remains green."],
    metadata: {
      correlationId: "abc-123",
    },
  },
);

assert.deepEqual(
  normalizeHarnessTask({
    id: "task-002",
    source: "manual",
    repository: {
      id: "qflow",
    },
    request: "Inspect the workflow canvas behavior.",
  }),
  {
    schemaVersion: 1,
    id: "task-002",
    source: "manual",
    repository: {
      id: "qflow",
    },
    request: "Inspect the workflow canvas behavior.",
    constraints: [],
    acceptanceCriteria: [],
    metadata: {},
  },
);

function captureIssues(input: Parameters<typeof normalizeHarnessTask>[0]) {
  try {
    normalizeHarnessTask(input);
    assert.fail("Expected normalization to fail.");
  } catch (error) {
    assert.ok(error instanceof HarnessTaskNormalizationError);
    return error.issues;
  }
}

assert.deepEqual(
  captureIssues({
    id: " ",
    source: "github",
    repository: {
      id: "/Users/example/project",
      revision: " ",
    },
    request: " ",
    constraints: ["valid", " "],
    acceptanceCriteria: [" "],
  }).map((issue) => issue.code),
  [
    "blank_id",
    "unsupported_source",
    "blank_request",
    "absolute_repository_id",
    "blank_repository_revision",
    "blank_constraint",
    "blank_acceptance_criterion",
  ],
);

assert.deepEqual(
  captureIssues({
    id: "task-003",
    source: "benchmark",
    repository: {
      id: " ",
    },
    request: "Run the benchmark task.",
  }).map((issue) => issue.code),
  ["blank_repository_id"],
);

for (const repositoryId of [
  "C:\\Users\\example\\project",
  "D:/work/project",
  "\\\\server\\share\\project",
]) {
  assert.deepEqual(
    captureIssues({
      id: "task-absolute",
      source: "manual",
      repository: {
        id: repositoryId,
      },
      request: "Inspect repository identity.",
    }).map((issue) => issue.code),
    ["absolute_repository_id"],
  );
}

const metadata = Object.freeze({
  benchmarkId: "B04",
});

const normalizedWithMetadata = normalizeHarnessTask({
  id: "task-004",
  source: "benchmark",
  repository: {
    id: "qflow-workflow-canvas",
    revision: "b04-v1",
  },
  request: "Exercise the cross-file benchmark.",
  metadata,
});

assert.equal(normalizedWithMetadata.metadata, metadata);

console.log("✅ H0-002A Step 3 deterministic task normalizer passed.");
