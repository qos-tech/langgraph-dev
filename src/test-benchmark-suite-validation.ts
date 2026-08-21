import assert from "node:assert/strict";
import {
  benchmarkCases,
} from "./benchmarks/cases.js";
import {
  assertValidBenchmarkSuite,
  validateBenchmarkSuite,
} from "./benchmarks/suite-validation.js";

const accepted = validateBenchmarkSuite(benchmarkCases);

assert.deepEqual(accepted, {
  valid: true,
  issues: [],
});

assert.doesNotThrow(() => {
  assertValidBenchmarkSuite(benchmarkCases);
});

const duplicateIdSuite = benchmarkCases.map((benchmark, index) =>
  index === 1
    ? {
        ...benchmark,
        id: "B01",
      }
    : benchmark,
);

assert.equal(
  validateBenchmarkSuite(duplicateIdSuite).issues.some(
    (issue) => issue.code === "duplicate_case_id",
  ),
  true,
);

const duplicateRepositoryRevisionSuite = benchmarkCases.map((benchmark, index) =>
  index === 1
    ? {
        ...benchmark,
        repository: {
          ...benchmarkCases[0].repository,
        },
      }
    : benchmark,
);

assert.equal(
  validateBenchmarkSuite(duplicateRepositoryRevisionSuite).issues.some(
    (issue) => issue.code === "duplicate_repository_revision",
  ),
  true,
);

const absoluteRepositorySuite = benchmarkCases.map((benchmark, index) =>
  index === 0
    ? {
        ...benchmark,
        repository: {
          ...benchmark.repository,
          id: "/Users/example/project",
        },
      }
    : benchmark,
);

assert.equal(
  validateBenchmarkSuite(absoluteRepositorySuite).issues.some(
    (issue) => issue.code === "absolute_repository_id",
  ),
  true,
);

const blankValidationCommandSuite = benchmarkCases.map((benchmark, index) =>
  index === 0
    ? {
        ...benchmark,
        validationCommands: ["npm test", "   "],
      }
    : benchmark,
);

assert.equal(
  validateBenchmarkSuite(blankValidationCommandSuite).issues.some(
    (issue) => issue.code === "blank_validation_command",
  ),
  true,
);

const duplicateValidationCommandSuite = benchmarkCases.map((benchmark, index) =>
  index === 0
    ? {
        ...benchmark,
        validationCommands: ["npm test", "npm test"],
      }
    : benchmark,
);

assert.equal(
  validateBenchmarkSuite(duplicateValidationCommandSuite).issues.some(
    (issue) => issue.code === "duplicate_validation_command",
  ),
  true,
);

const missingCaseSuite = benchmarkCases.slice(0, -1);

const missingCaseResult = validateBenchmarkSuite(missingCaseSuite);

assert.equal(
  missingCaseResult.issues.some(
    (issue) => issue.code === "unexpected_case_count",
  ),
  true,
);

assert.equal(
  missingCaseResult.issues.some(
    (issue) => issue.code === "unexpected_case_order",
  ),
  true,
);

assert.equal(
  missingCaseResult.issues.some(
    (issue) => issue.code === "unexpected_difficulty_distribution",
  ),
  true,
);

assert.throws(
  () => assertValidBenchmarkSuite(missingCaseSuite),
  /Invalid benchmark suite/,
);

console.log("✅ H0-002 Step 4 deterministic benchmark suite validation passed.");
