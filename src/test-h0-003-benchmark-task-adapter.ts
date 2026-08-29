import assert from "node:assert/strict";
import { benchmarkCases } from "./benchmarks/cases.js";
import {
  BENCHMARK_TASK_SCHEMA_VERSION,
  defineBenchmarkTask,
} from "./benchmarks/contracts.js";
import { adaptBenchmarkTaskToHarnessTask } from "./benchmarks/task-adapter.js";
import { HARNESS_TASK_SCHEMA_VERSION } from "./intake/contracts.js";
import { HarnessTaskNormalizationError } from "./intake/normalize.js";

const benchmark = defineBenchmarkTask({
  schemaVersion: BENCHMARK_TASK_SCHEMA_VERSION,
  id: "  adapter-test  ",
  title: "Adapter title must stay benchmark-only",
  difficulty: "localized",
  task: "  Change one localized behavior.  ",
  repository: {
    id: "  fixture-repository  ",
    revision: "  fixture-v1  ",
  },
  constraints: ["  Preserve existing behavior.  "],
  successCriteria: ["  Focused test passes.  "],
  validationCommands: ["npm test"],
  expectedOutcome: "changes_required",
});

const normalized = adaptBenchmarkTaskToHarnessTask(benchmark);

assert.deepEqual(normalized, {
  schemaVersion: HARNESS_TASK_SCHEMA_VERSION,
  id: "adapter-test",
  source: "benchmark",
  repository: {
    id: "fixture-repository",
    revision: "fixture-v1",
  },
  request: "Change one localized behavior.",
  constraints: ["Preserve existing behavior."],
  acceptanceCriteria: ["Focused test passes."],
  metadata: {},
});

for (const benchmarkOnlyField of [
  "title",
  "difficulty",
  "validationCommands",
  "expectedOutcome",
]) {
  assert.equal(
    benchmarkOnlyField in normalized,
    false,
    `${benchmarkOnlyField} must remain outside NormalizedHarnessTask.`,
  );
  assert.equal(
    benchmarkOnlyField in normalized.metadata,
    false,
    `${benchmarkOnlyField} must not be copied into metadata without evidence.`,
  );
}

assert.equal(
  JSON.stringify(normalized).includes("npm test"),
  false,
  "benchmark validation commands must not leak into normalized task data",
);
assert.equal(
  JSON.stringify(normalized).includes("changes_required"),
  false,
  "benchmark expected outcome must not leak into normalized task data",
);

for (const fixedBenchmark of benchmarkCases) {
  const adapted = adaptBenchmarkTaskToHarnessTask(fixedBenchmark);

  assert.equal(adapted.id, fixedBenchmark.id);
  assert.equal(adapted.source, "benchmark");
  assert.deepEqual(adapted.repository, fixedBenchmark.repository);
  assert.equal(adapted.request, fixedBenchmark.task);
  assert.deepEqual(adapted.constraints, fixedBenchmark.constraints);
  assert.deepEqual(adapted.acceptanceCriteria, fixedBenchmark.successCriteria);
  assert.deepEqual(adapted.metadata, {});
}

const malformed = defineBenchmarkTask({
  schemaVersion: BENCHMARK_TASK_SCHEMA_VERSION,
  id: "   ",
  title: "Malformed fixture",
  difficulty: "trivial",
  task: "   ",
  repository: {
    id: "/machine/local/repository",
    revision: "   ",
  },
  constraints: ["   "],
  successCriteria: ["   "],
  validationCommands: ["npm test"],
  expectedOutcome: "changes_required",
});

assert.throws(
  () => adaptBenchmarkTaskToHarnessTask(malformed),
  (error: unknown) => {
    assert.ok(error instanceof HarnessTaskNormalizationError);
    assert.deepEqual(
      error.issues.map((issue) => issue.code),
      [
        "blank_id",
        "blank_request",
        "absolute_repository_id",
        "blank_repository_revision",
        "blank_constraint",
        "blank_acceptance_criterion",
      ],
    );
    return true;
  },
);

console.log("✅ H0-003 Step 2 benchmark task adapter passed.");
