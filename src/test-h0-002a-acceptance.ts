import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  HARNESS_TASK_SCHEMA_VERSION,
  type NormalizedHarnessTask,
} from "./intake/contracts.js";
import { normalizeHarnessTask } from "./intake/normalize.js";
import { createManualHarnessRunRequest } from "./intake/manual.js";
import type {
  ResolvedWorkspace,
  RunHarnessRequest,
} from "./app/run-harness.js";

async function source(path: string): Promise<string> {
  return readFile(new URL(path, import.meta.url), "utf8");
}

const [
  entrypoint,
  manualAdapter,
  normalizer,
  runHarness,
  publicBoundaryGuard,
  dependencyGuard,
] = await Promise.all([
  source("./index.ts"),
  source("./intake/manual.ts"),
  source("./intake/normalize.ts"),
  source("./app/run-harness.ts"),
  source("./test-architecture-public-boundaries.ts"),
  source("./test-architecture-dependencies.ts"),
]);

const normalized = normalizeHarnessTask({
  id: "  acceptance-task  ",
  source: "  manual  ",
  repository: {
    id: "  qos-harness  ",
    revision: "  main  ",
  },
  request: "  Verify task intake architecture.  ",
  constraints: ["  Preserve architecture boundaries.  "],
  acceptanceCriteria: ["  Deterministic gates stay green.  "],
  metadata: {
    acceptance: "h0-002a",
  },
});

const taskContract: NormalizedHarnessTask = normalized;

assert.equal(taskContract.schemaVersion, HARNESS_TASK_SCHEMA_VERSION);
assert.equal(taskContract.id, "acceptance-task");
assert.equal(taskContract.source, "manual");
assert.deepEqual(taskContract.repository, {
  id: "qos-harness",
  revision: "main",
});
assert.equal(
  "repositoryPath" in taskContract.repository,
  false,
  "normalized task must not contain concrete workspace identity",
);

const manualRequest = createManualHarnessRunRequest({
  env: {
    TARGET_REPOSITORY: "/tmp/qos-harness-worktree",
    TARGET_REPOSITORY_ID: "qos-harness",
    TARGET_REPOSITORY_REVISION: "main",
    MAX_PLANNING_ATTEMPTS: "5",
  },
  taskId: "acceptance-task",
  request: "Verify task intake architecture.",
});

const requestContract: RunHarnessRequest = manualRequest;
const workspaceContract: ResolvedWorkspace = requestContract.workspace;

assert.equal(workspaceContract.repositoryPath, "/tmp/qos-harness-worktree");
assert.equal(requestContract.task.repository.id, "qos-harness");
assert.equal(requestContract.task.repository.revision, "main");
assert.equal(requestContract.execution?.maxPlanningAttempts, 5);

assert.match(
  entrypoint,
  /createManualHarnessRunRequest\(/,
  "entrypoint must delegate raw manual intake",
);
assert.match(
  entrypoint,
  /runHarness\(request\)/,
  "entrypoint must delegate one-run execution",
);

for (const forbidden of [
  "buildDevGraph(",
  "createLlmCallTelemetryCollector(",
  "createRunLifecycleRecorder(",
  "createJsonRunTelemetryStore(",
  "graph.invoke(",
]) {
  assert.equal(
    entrypoint.includes(forbidden),
    false,
    `entrypoint must not retain core execution ownership: ${forbidden}`,
  );
}

assert.match(
  manualAdapter,
  /TARGET_REPOSITORY_ID/,
  "manual adapter must require explicit repository identity",
);
assert.match(
  manualAdapter,
  /TARGET_REPOSITORY/,
  "manual adapter must keep resolved workspace path explicit",
);
assert.doesNotMatch(
  manualAdapter,
  /id:\s*repositoryPath/,
  "manual adapter must not derive task identity from local path",
);

assert.match(
  normalizer,
  /function hasAbsoluteRepositoryShape/,
  "normalizer must protect machine-independent repository identity",
);
assert.doesNotMatch(
  normalizer,
  /provider|model|buildDevGraph|invokeGraph/,
  "task normalization must remain independent from execution/provider policy",
);

assert.match(
  runHarness,
  /task:\s*NormalizedHarnessTask/,
  "application execution must consume normalized tasks",
);
assert.match(
  runHarness,
  /workspace:\s*ResolvedWorkspace/,
  "application execution must consume explicit resolved workspaces",
);
assert.match(
  runHarness,
  /await\s+import\(["']\.\.\/graph\.js["']\)/,
  "application boundary must reach the Harness core through the public graph boundary",
);
assert.doesNotMatch(
  runHarness,
  /graph\/build-dev-graph|graph\/nodes|providers\/(?:nvidia|claude-cli)/,
  "application boundary must not cross graph/provider internals",
);

assert.match(
  publicBoundaryGuard,
  /application boundary owns the handoff to the public graph boundary/i,
  "H-ARCH public boundary guard must cover the new application layer",
);
assert.match(
  dependencyGuard,
  /findCycles/,
  "generalized architecture dependency/cycle protection must remain active",
);

console.log("✅ H0-002A Step 6 task intake architecture acceptance passed.");
