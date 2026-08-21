import assert from "node:assert/strict";
import { createManualHarnessRunRequest } from "./intake/manual.js";

const request = createManualHarnessRunRequest({
  env: {
    TARGET_REPOSITORY: "/tmp/qflow-worktree",
    TARGET_REPOSITORY_ID: "  qflow  ",
    TARGET_REPOSITORY_REVISION: "  main  ",
    MAX_PLANNING_ATTEMPTS: "7",
  },
  taskId: "  qflow-workflow-canvas-analysis  ",
  request: "  Analyze the workflow canvas.  ",
});

assert.deepEqual(request, {
  task: {
    schemaVersion: 1,
    id: "qflow-workflow-canvas-analysis",
    source: "manual",
    repository: {
      id: "qflow",
      revision: "main",
    },
    request: "Analyze the workflow canvas.",
    constraints: [],
    acceptanceCriteria: [],
    metadata: {},
  },
  workspace: {
    repositoryPath: "/tmp/qflow-worktree",
  },
  execution: {
    maxPlanningAttempts: 7,
  },
});

assert.equal(
  request.task.repository.id,
  "qflow",
  "manual adapter must use explicit repository identity rather than repositoryPath",
);

assert.equal(
  "repositoryPath" in request.task.repository,
  false,
  "normalized repository identity must not contain the local workspace path",
);

assert.deepEqual(
  createManualHarnessRunRequest({
    env: {
      TARGET_REPOSITORY: "/tmp/qflow-worktree",
      TARGET_REPOSITORY_ID: "qflow",
    },
    taskId: "task-with-default-budget",
    request: "Analyze the repository.",
  }),
  {
    task: {
      schemaVersion: 1,
      id: "task-with-default-budget",
      source: "manual",
      repository: {
        id: "qflow",
      },
      request: "Analyze the repository.",
      constraints: [],
      acceptanceCriteria: [],
      metadata: {},
    },
    workspace: {
      repositoryPath: "/tmp/qflow-worktree",
    },
  },
  "missing MAX_PLANNING_ATTEMPTS must defer to runHarness default execution policy",
);

assert.throws(
  () =>
    createManualHarnessRunRequest({
      env: {
        TARGET_REPOSITORY_ID: "qflow",
      },
      taskId: "missing-workspace",
      request: "Analyze the repository.",
    }),
  /TARGET_REPOSITORY não definido\./,
);

assert.throws(
  () =>
    createManualHarnessRunRequest({
      env: {
        TARGET_REPOSITORY: "/tmp/qflow-worktree",
      },
      taskId: "missing-repository-id",
      request: "Analyze the repository.",
    }),
  /TARGET_REPOSITORY_ID não definido\./,
);

assert.throws(
  () =>
    createManualHarnessRunRequest({
      env: {
        TARGET_REPOSITORY: "/tmp/qflow-worktree",
        TARGET_REPOSITORY_ID: "/tmp/qflow-worktree",
      },
      taskId: "path-as-identity",
      request: "Analyze the repository.",
    }),
  /absolute_repository_id/,
);

assert.throws(
  () =>
    createManualHarnessRunRequest({
      env: {
        TARGET_REPOSITORY: "/tmp/qflow-worktree",
        TARGET_REPOSITORY_ID: "qflow",
        TARGET_REPOSITORY_REVISION: "   ",
      },
      taskId: "blank-revision",
      request: "Analyze the repository.",
    }),
  /blank_repository_revision/,
);

console.log("✅ H0-002A Step 5 manual intake adapter passed.");
