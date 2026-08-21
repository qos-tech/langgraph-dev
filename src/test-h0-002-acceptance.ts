import assert from "node:assert/strict";
import {
  benchmarkCases,
} from "./benchmarks/cases.js";
import {
  evaluateBenchmarkAcceptance,
} from "./benchmarks/acceptance.js";
import {
  assertValidBenchmarkSuite,
  validateBenchmarkSuite,
} from "./benchmarks/suite-validation.js";

assert.deepEqual(
  validateBenchmarkSuite(benchmarkCases),
  {
    valid: true,
    issues: [],
  },
);

assert.doesNotThrow(() => {
  assertValidBenchmarkSuite(benchmarkCases);
});

const expectedOutcomes = new Map(
  benchmarkCases.map((benchmark) => [benchmark.id, benchmark.expectedOutcome]),
);

assert.deepEqual(
  Object.fromEntries(expectedOutcomes),
  {
    B01: "changes_required",
    B02: "already_satisfied",
    B03: "changes_required",
    B04: "changes_required",
    B05: "blocked",
  },
);

for (const benchmark of benchmarkCases) {
  const observation = {
    finalOutcome: benchmark.expectedOutcome,
    filesChanged:
      benchmark.expectedOutcome === "changes_required"
        ? ["src/representative-change.ts"]
        : [],
    validationPassed: true,
    humanInterventionRequired: false,
  } as const;

  assert.deepEqual(
    evaluateBenchmarkAcceptance(benchmark, observation),
    {
      accepted: true,
      failures: [],
    },
    `${benchmark.id} should accept a matching deterministic observation`,
  );
}

const b02 = benchmarkCases.find((benchmark) => benchmark.id === "B02");
assert.ok(b02);

assert.deepEqual(
  evaluateBenchmarkAcceptance(b02, {
    finalOutcome: "already_satisfied",
    filesChanged: ["src/unnecessary-change.ts"],
    validationPassed: true,
    humanInterventionRequired: false,
  }),
  {
    accepted: false,
    failures: ["unexpected_changes"],
  },
);

const b05 = benchmarkCases.find((benchmark) => benchmark.id === "B05");
assert.ok(b05);

assert.deepEqual(
  evaluateBenchmarkAcceptance(b05, {
    finalOutcome: "blocked",
    filesChanged: [],
    validationPassed: true,
    humanInterventionRequired: false,
  }),
  {
    accepted: true,
    failures: [],
  },
);

console.log("✅ H0-002 fixed benchmark suite acceptance passed.");
