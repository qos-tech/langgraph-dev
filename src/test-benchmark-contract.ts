import assert from "node:assert/strict";
import {
  BENCHMARK_TASK_SCHEMA_VERSION,
  defineBenchmarkTask,
  type BenchmarkTask,
} from "./benchmarks/contracts.js";

const benchmark = defineBenchmarkTask({
  schemaVersion: BENCHMARK_TASK_SCHEMA_VERSION,
  id: "BXX",
  title: "Contract fixture",
  difficulty: "localized",
  task: "Change one known component without unrelated edits.",
  repository: {
    id: "fixture-example",
    revision: "0123456789abcdef",
  },
  constraints: [
    "preserve unrelated behavior",
  ],
  successCriteria: [
    "requested behavior is satisfied",
  ],
  validationCommands: [
    "npm run typecheck",
  ],
  expectedOutcome: "changes_required",
} satisfies BenchmarkTask);

assert.equal(benchmark.schemaVersion, 1);
assert.equal(benchmark.id, "BXX");
assert.equal(benchmark.repository.id, "fixture-example");
assert.equal(benchmark.repository.revision, "0123456789abcdef");
assert.deepEqual(benchmark.validationCommands, [
  "npm run typecheck",
]);
assert.equal(benchmark.expectedOutcome, "changes_required");

// `defineBenchmarkTask` is intentionally an identity boundary. It preserves
// the exact suite data and adds no hidden normalization before H0-003.
const sameReference = defineBenchmarkTask(benchmark);
assert.equal(sameReference, benchmark);

console.log("✅ H0-002 Step 1 benchmark contract passed.");
