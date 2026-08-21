import assert from "node:assert/strict";
import {
  BENCHMARK_CASE_IDS,
  benchmarkCases,
} from "./benchmarks/cases.js";

assert.deepEqual(
  benchmarkCases.map((benchmark) => benchmark.id),
  [...BENCHMARK_CASE_IDS],
);

assert.deepEqual(
  benchmarkCases.map((benchmark) => benchmark.difficulty),
  [
    "trivial",
    "already-satisfied",
    "localized",
    "cross-file",
    "architectural",
  ],
);

assert.deepEqual(
  benchmarkCases.map((benchmark) => benchmark.expectedOutcome),
  [
    "changes_required",
    "already_satisfied",
    "changes_required",
    "changes_required",
    "blocked",
  ],
);

for (const benchmark of benchmarkCases) {
  assert.ok(benchmark.title.trim().length > 0);
  assert.ok(benchmark.task.trim().length > 0);
  assert.ok(benchmark.repository.id.trim().length > 0);
  assert.ok(benchmark.repository.revision.trim().length > 0);
  assert.ok(benchmark.constraints.length > 0);
  assert.ok(benchmark.successCriteria.length > 0);
  assert.ok(benchmark.validationCommands.length > 0);
  assert.equal(
    benchmark.repository.id.startsWith("/"),
    false,
    `${benchmark.id} repository ID must not be an absolute path`,
  );
}

assert.equal(
  benchmarkCases.find((benchmark) => benchmark.id === "B02")?.expectedOutcome,
  "already_satisfied",
);

assert.equal(
  benchmarkCases.find((benchmark) => benchmark.id === "B04")?.repository.id,
  "qflow-workflow-canvas",
);

assert.equal(
  benchmarkCases.find((benchmark) => benchmark.id === "B05")?.expectedOutcome,
  "blocked",
);

console.log("✅ H0-002 Step 2 benchmark cases B01–B05 passed.");
