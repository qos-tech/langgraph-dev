import assert from "node:assert/strict";
import {
  HARNESS_TASK_SCHEMA_VERSION,
  defineNormalizedHarnessTask,
  type HarnessTaskSource,
  type NormalizedHarnessTask,
} from "./intake/contracts.js";

const allowedSources: readonly HarnessTaskSource[] = [
  "manual",
  "cli",
  "benchmark",
  "self-improvement",
];

assert.deepEqual(allowedSources, [
  "manual",
  "cli",
  "benchmark",
  "self-improvement",
]);

const task = defineNormalizedHarnessTask({
  schemaVersion: HARNESS_TASK_SCHEMA_VERSION,
  id: "task-001",
  source: "benchmark",
  repository: {
    id: "qos-harness",
    revision: "v0.1.0-alpha.6",
  },
  request: "Reduce irrelevant planner context without lowering benchmark quality.",
  constraints: [
    "Do not modify benchmark definitions.",
    "Do not modify benchmark acceptance rules.",
  ],
  acceptanceCriteria: [
    "Planner context is lower on the target benchmark.",
    "Deterministic regression gates remain green.",
  ],
  metadata: {
    benchmarkId: "B04",
  },
});

const assignable: NormalizedHarnessTask = task;

assert.equal(assignable.schemaVersion, 1);
assert.equal(assignable.id, "task-001");
assert.equal(assignable.source, "benchmark");
assert.deepEqual(assignable.repository, {
  id: "qos-harness",
  revision: "v0.1.0-alpha.6",
});
assert.equal(
  assignable.request,
  "Reduce irrelevant planner context without lowering benchmark quality.",
);
assert.deepEqual(assignable.constraints, [
  "Do not modify benchmark definitions.",
  "Do not modify benchmark acceptance rules.",
]);
assert.deepEqual(assignable.acceptanceCriteria, [
  "Planner context is lower on the target benchmark.",
  "Deterministic regression gates remain green.",
]);
assert.deepEqual(assignable.metadata, {
  benchmarkId: "B04",
});

assert.equal(
  "repositoryPath" in assignable,
  false,
  "normalized task identity must not contain a concrete workspace path",
);

assert.equal(
  "provider" in assignable || "model" in assignable,
  false,
  "normalized task must not contain provider/model execution policy",
);

console.log("✅ H0-002A Step 2 normalized task contract passed.");
