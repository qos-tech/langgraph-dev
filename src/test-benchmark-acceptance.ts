import assert from "node:assert/strict";
import {
  BENCHMARK_TASK_SCHEMA_VERSION,
  defineBenchmarkTask,
} from "./benchmarks/contracts.js";
import {
  evaluateBenchmarkAcceptance,
  type BenchmarkRunObservation,
} from "./benchmarks/acceptance.js";

const changesRequired = defineBenchmarkTask({
  schemaVersion: BENCHMARK_TASK_SCHEMA_VERSION,
  id: "T01",
  title: "Changes required fixture",
  difficulty: "localized",
  task: "Change one component.",
  repository: {
    id: "fixture",
    revision: "v1",
  },
  constraints: ["preserve unrelated behavior"],
  successCriteria: ["requested behavior exists"],
  validationCommands: ["npm test"],
  expectedOutcome: "changes_required",
});

const alreadySatisfied = defineBenchmarkTask({
  schemaVersion: BENCHMARK_TASK_SCHEMA_VERSION,
  id: "T02",
  title: "Already satisfied fixture",
  difficulty: "already-satisfied",
  task: "Confirm behavior already exists.",
  repository: {
    id: "fixture-existing",
    revision: "v1",
  },
  constraints: ["do not modify files"],
  successCriteria: ["existing behavior is recognized"],
  validationCommands: ["npm test"],
  expectedOutcome: "already_satisfied",
});

const blocked = defineBenchmarkTask({
  schemaVersion: BENCHMARK_TASK_SCHEMA_VERSION,
  id: "T03",
  title: "Blocked fixture",
  difficulty: "architectural",
  task: "Stop when required evidence is unavailable.",
  repository: {
    id: "fixture-blocked",
    revision: "v1",
  },
  constraints: ["do not guess"],
  successCriteria: ["blocking evidence is explicit"],
  validationCommands: ["npm run typecheck"],
  expectedOutcome: "blocked",
});

function observe(
  overrides: Partial<BenchmarkRunObservation> = {},
): BenchmarkRunObservation {
  return {
    finalOutcome: "changes_required",
    filesChanged: ["src/example.ts"],
    validationPassed: true,
    humanInterventionRequired: false,
    ...overrides,
  };
}

assert.deepEqual(
  evaluateBenchmarkAcceptance(changesRequired, observe()),
  {
    accepted: true,
    failures: [],
  },
);

assert.deepEqual(
  evaluateBenchmarkAcceptance(
    alreadySatisfied,
    observe({
      finalOutcome: "already_satisfied",
      filesChanged: [],
    }),
  ),
  {
    accepted: true,
    failures: [],
  },
);

assert.deepEqual(
  evaluateBenchmarkAcceptance(
    blocked,
    observe({
      finalOutcome: "blocked",
      filesChanged: [],
    }),
  ),
  {
    accepted: true,
    failures: [],
  },
);

assert.deepEqual(
  evaluateBenchmarkAcceptance(
    alreadySatisfied,
    observe({
      finalOutcome: "already_satisfied",
      filesChanged: ["src/unnecessary.ts"],
    }),
  ),
  {
    accepted: false,
    failures: ["unexpected_changes"],
  },
);

assert.deepEqual(
  evaluateBenchmarkAcceptance(
    changesRequired,
    observe({
      finalOutcome: "blocked",
    }),
  ),
  {
    accepted: false,
    failures: ["unexpected_outcome"],
  },
);

assert.deepEqual(
  evaluateBenchmarkAcceptance(
    changesRequired,
    observe({
      validationPassed: false,
    }),
  ),
  {
    accepted: false,
    failures: ["validation_failed"],
  },
);

assert.deepEqual(
  evaluateBenchmarkAcceptance(
    changesRequired,
    observe({
      humanInterventionRequired: true,
    }),
  ),
  {
    accepted: false,
    failures: ["human_intervention_required"],
  },
);

assert.deepEqual(
  evaluateBenchmarkAcceptance(
    alreadySatisfied,
    observe({
      finalOutcome: "changes_required",
      filesChanged: ["src/unnecessary.ts"],
      validationPassed: false,
      humanInterventionRequired: true,
    }),
  ),
  {
    accepted: false,
    failures: [
      "unexpected_outcome",
      "unexpected_changes",
      "validation_failed",
      "human_intervention_required",
    ],
  },
);

console.log("✅ H0-002 Step 3 benchmark acceptance rules passed.");
