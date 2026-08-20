import assert from "node:assert/strict";

import {
  buildPlannerPrompt,
  buildRefinePrompt,
  buildReviewerPrompt,
} from "./graph/prompts.js";

import type { DevStateType } from "./state.js";

function makeState(overrides: Partial<DevStateType> = {}): DevStateType {
  return {
    task: "Implementar inserção de nodes entre edges.",
    repositoryPath: "/tmp/qflow",
    status: "idle",
    analysis: "",
    repositoryContext: {
      path: "/tmp/qflow",
      files: ["package.json", "src/a.ts"],
      packageJson: {
        scripts: {
          typecheck: "tsc --noEmit",
        },
      },
      gitStatus: "clean",
    },
    fileContents: {
      "src/a.ts": "export const a = 1;",
    },
    recentlyReadFiles: [],
    planningAttempts: 1,
    reviewAttempts: 1,
    maxPlanningAttempts: 4,
    explorationPlan: {
      understanding: "Entender a mutação atual.",
      needsMoreContext: false,
      filesToRead: [],
      observations: ["src/a.ts foi analisado."],
      unknowns: [],
    },
    planReview: {
      decision: "enough_context",
      missingEvidence: [],
      issues: [],
      summary: "Contexto suficiente.",
    },
    refinedPlan: undefined,
    failureReason: undefined,
    ...overrides,
  } as DevStateType;
}

const state = makeState();

const planner = buildPlannerPrompt(state);
assert.match(planner, /PLANNER EXPLORATÓRIO/);
assert.match(planner, /Implementar inserção de nodes entre edges\./);
assert.match(planner, /src\/a\.ts/);
assert.match(planner, /export const a = 1;/);
assert.match(planner, /Quando needsMoreContext=false, filesToRead deve ser \[\]\./);

const reviewer = buildReviewerPrompt(state);
assert.match(reviewer, /REVIEWER independente/);
assert.match(reviewer, /"approve_read"/);
assert.match(reviewer, /"revise_read"/);
assert.match(reviewer, /"enough_context"/);
assert.match(reviewer, /Entender a mutação atual\./);

const refine = buildRefinePrompt(state);
assert.match(refine, /ARQUITETO FINAL/);
assert.match(refine, /"changes_required"/);
assert.match(refine, /"already_satisfied"/);
assert.match(refine, /"blocked"/);
assert.match(refine, /npm run typecheck/);

assert.throws(
  () =>
    buildReviewerPrompt(
      makeState({
        explorationPlan: undefined,
      }),
    ),
  /Exploration plan required\./,
);

console.log("✅ H-ARCH-001 prompt characterization tests passed.");
