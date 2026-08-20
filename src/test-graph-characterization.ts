import assert from "node:assert/strict";

import type {
  DevStateType,
  ExplorationPlan,
  PlanReview,
  RefinedPlan,
} from "./state.js";

/**
 * H-ARCH-001 / Step 1
 *
 * Characterization tests intentionally describe CURRENT graph behavior.
 * They are not assertions about the ideal future architecture.
 *
 * The dynamic import lets us provide a harmless placeholder API key before
 * graph.ts imports the current NVIDIA provider, whose module initialization
 * validates NVIDIA_API_KEY. No provider method is called in these tests.
 */
process.env.NVIDIA_API_KEY ??= "characterization-test-only";

const {
  afterPlanRouter,
  reviewRouter,
  afterReadRouter,
  planGateRouter,
  normalizeRequests,
  listFiles,
  packageContext,
  knownFileContext,
  reviewFeedback,
} = await import("./graph.js");

function exploration(
  overrides: Partial<ExplorationPlan> = {},
): ExplorationPlan {
  return {
    understanding: "characterization",
    needsMoreContext: false,
    filesToRead: [],
    observations: [],
    unknowns: [],
    ...overrides,
  };
}

function review(
  decision: PlanReview["decision"],
): PlanReview {
  return {
    decision,
    missingEvidence: [],
    issues: [],
    summary: "characterization",
  };
}

function refinedPlan(): RefinedPlan {
  return {
    outcome: "changes_required",
    understanding: "characterization",
    changes: [
      {
        file: "src/example.ts",
        action: "modify",
        description: "characterization",
      },
    ],
    validation: [
      {
        command: "npm run typecheck",
        expected: "pass",
      },
    ],
    blockingUnknowns: [],
    nonBlockingNotes: [],
  };
}

function state(
  overrides: Partial<DevStateType> = {},
): DevStateType {
  return {
    task: "characterization task",
    repositoryPath: "/tmp/repository",
    fileContents: {},
    fileSummaries: {},
    recentlyReadFiles: [],
    planningAttempts: 0,
    reviewAttempts: 0,
    maxPlanningAttempts: 4,
    filesChanged: [],
    attempts: 0,
    maxAttempts: 3,
    status: "pending",
    ...overrides,
  } as DevStateType;
}

function testAfterPlanRouter(): void {
  assert.equal(
    afterPlanRouter(state()),
    "failed",
    "afterPlanRouter fails without an exploration plan",
  );

  assert.equal(
    afterPlanRouter(
      state({
        explorationPlan: exploration(),
      }),
    ),
    "review",
    "a normal plan is reviewed",
  );

  assert.equal(
    afterPlanRouter(
      state({
        explorationPlan: exploration({
          needsMoreContext: true,
          filesToRead: [{ path: "src/a.ts", reason: "needed" }],
        }),
        planReview: review("revise_read"),
      }),
    ),
    "read",
    "a plan produced immediately after revise_read skips a redundant review",
  );
}

function testReviewRouter(): void {
  const readablePlan = exploration({
    needsMoreContext: true,
    filesToRead: [{ path: "src/a.ts", reason: "needed" }],
  });

  assert.equal(
    reviewRouter(state()),
    "failed",
    "reviewRouter fails without plan/review",
  );

  assert.equal(
    reviewRouter(
      state({
        explorationPlan: readablePlan,
        planReview: review("enough_context"),
      }),
    ),
    "refine",
    "enough_context converges to refine",
  );

  assert.equal(
    reviewRouter(
      state({
        explorationPlan: readablePlan,
        planReview: review("revise_read"),
      }),
    ),
    "revise",
    "revise_read loops back to planning while budget remains",
  );

  assert.equal(
    reviewRouter(
      state({
        explorationPlan: readablePlan,
        planReview: review("approve_read"),
      }),
    ),
    "read",
    "approve_read reads a non-empty file request",
  );

  assert.equal(
    reviewRouter(
      state({
        explorationPlan: exploration({
          needsMoreContext: false,
          filesToRead: [],
        }),
        planReview: review("approve_read"),
      }),
    ),
    "refine",
    "approve_read with no actionable files and no more context converges",
  );

  assert.equal(
    reviewRouter(
      state({
        explorationPlan: readablePlan,
        planReview: review("revise_read"),
        planningAttempts: 4,
        maxPlanningAttempts: 4,
      }),
    ),
    "failed",
    "current behavior fails when planning budget is exhausted before handling revise_read",
  );
}

function testAfterReadRouter(): void {
  assert.equal(
    afterReadRouter(state({ status: "reading_context" })),
    "plan",
  );

  assert.equal(
    afterReadRouter(state({ status: "failed" })),
    "failed",
  );
}

function testPlanGateRouter(): void {
  assert.equal(
    planGateRouter(state()),
    "failed",
    "a final plan is required",
  );

  assert.equal(
    planGateRouter(
      state({
        refinedPlan: refinedPlan(),
      }),
    ),
    "report",
    "an existing refined plan reports when no failureReason is present",
  );

  assert.equal(
    planGateRouter(
      state({
        refinedPlan: refinedPlan(),
        failureReason: "gate failed",
      }),
    ),
    "failed",
    "failureReason wins over a refined plan",
  );
}

function testNormalizeRequests(): void {
  const currentState = state({
    repositoryContext: {
      path: "/tmp/repository",
      files: ["src/a.ts", "src/b.ts"],
      packageJson: {},
    },
    fileContents: {
      "src/a.ts": "already read",
    },
  });

  const normalized = normalizeRequests(
    currentState,
    exploration({
      needsMoreContext: true,
      filesToRead: [
        { path: "src/a.ts", reason: "already read" },
        { path: "src/b.ts", reason: "valid" },
        { path: "src/b.ts", reason: "duplicate" },
        { path: "src/*.ts", reason: "wildcard" },
        { path: "src/missing.ts", reason: "missing" },
      ],
    }),
  );

  assert.deepEqual(normalized.filesToRead, [
    { path: "src/b.ts", reason: "valid" },
  ]);
  assert.equal(normalized.needsMoreContext, true);

  const noActionableEvidence = normalizeRequests(
    currentState,
    exploration({
      needsMoreContext: true,
      filesToRead: [{ path: "src/a.ts", reason: "already read" }],
    }),
  );

  assert.deepEqual(noActionableEvidence.filesToRead, []);
  assert.equal(
    noActionableEvidence.needsMoreContext,
    false,
    "current normalizer converges when every requested file is filtered out",
  );
}

function testContextHelpers(): void {
  const currentState = state({
    repositoryContext: {
      path: "/tmp/repository",
      files: ["src/a.ts", "src/b.ts"],
      packageJson: { name: "characterization" },
    },
    fileContents: {
      "src/a.ts": "export const a = 1;",
    },
    planReview: review("enough_context"),
  });

  assert.equal(listFiles(currentState), "- src/a.ts\n- src/b.ts");
  assert.equal(
    packageContext(currentState),
    JSON.stringify({ name: "characterization" }, null, 2),
  );
  assert.match(knownFileContext(currentState), /### FILE: src\/a\.ts/);
  assert.match(knownFileContext(currentState), /export const a = 1;/);
  assert.match(reviewFeedback(currentState), /enough_context/);

  assert.equal(listFiles(state()), "Nenhum arquivo encontrado.");
  assert.equal(packageContext(state()), "package.json não disponível.");
  assert.equal(knownFileContext(state()), "Nenhum arquivo lido ainda.");
  assert.equal(reviewFeedback(state()), "Nenhum review anterior.");
}

testAfterPlanRouter();
testReviewRouter();
testAfterReadRouter();
testPlanGateRouter();
testNormalizeRequests();
testContextHelpers();

console.log("✅ H-ARCH-001 characterization tests passed.");
