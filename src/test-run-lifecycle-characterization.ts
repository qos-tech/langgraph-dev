import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function source(path: string): Promise<string> {
  return readFile(new URL(path, import.meta.url), "utf8");
}

function assertContainsInOrder(
  sourceText: string,
  fragments: readonly string[],
  label: string,
): void {
  let cursor = 0;

  for (const fragment of fragments) {
    const index = sourceText.indexOf(fragment, cursor);

    assert.notEqual(
      index,
      -1,
      `${label} must contain "${fragment}" after the previous lifecycle boundary`,
    );

    cursor = index + fragment.length;
  }
}

const [
  entrypoint,
  runHarness,
  state,
  nodes,
  graphBoundary,
  execution,
] = await Promise.all([
  source("./index.ts"),
  source("./app/run-harness.ts"),
  source("./state.ts"),
  source("./graph/nodes.ts"),
  source("./graph.ts"),
  source("./providers/execution.ts"),
]);

/**
 * H0-001 / Step 1 + H0-002A / Step 5
 *
 * Characterize the run lifecycle after application-boundary migration.
 *
 * The executable no longer owns graph/telemetry composition directly.
 * It delegates one-run execution to runHarness(...), while the application
 * boundary preserves the lifecycle characterized by H0-001.
 */

// Executable now delegates execution instead of building the graph directly.
assert.match(
  entrypoint,
  /import\s+\{\s*runHarness\s*\}\s+from\s+["']\.\/app\/run-harness\.js["']/,
);
assert.match(
  entrypoint,
  /import\s+\{\s*createManualHarnessRunRequest\s*\}\s+from\s+["']\.\/intake\/manual\.js["']/,
);
assert.match(entrypoint, /const result = await runHarness\(request\)/);

for (const marker of [
  "buildDevGraph",
  "createLlmCallTelemetryCollector",
  "createRunLifecycleRecorder",
  "buildRunTelemetryCompletion",
  "createJsonRunTelemetryStore",
  "activeRun.complete",
  "telemetryStore.save",
] as const) {
  assert.doesNotMatch(
    entrypoint,
    new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    `index.ts must not retain migrated lifecycle ownership: ${marker}`,
  );
}

// Application boundary now owns the one-run lifecycle.
for (const marker of [
  "createLlmCallTelemetryCollector",
  "createRunLifecycleRecorder",
  "buildRunTelemetryCompletion",
  "createJsonRunTelemetryStore",
  "activeRun.complete",
  "telemetryStore.save",
] as const) {
  assert.match(
    runHarness,
    new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    `run-harness.ts must own lifecycle marker: ${marker}`,
  );
}

assertContainsInOrder(
  runHarness,
  [
    "const llmCallCollector = createLlmCallCollector();",
    "const runRecorder = createRunRecorder();",
    "const activeRun = runRecorder.start({",
    "const telemetryStore = createTelemetryStore();",
    "const state = await invokeGraph(",
    "const telemetry = activeRun.complete(",
    "const persistedTelemetry = await telemetryStore.save(telemetry);",
  ],
  "application run lifecycle",
);

// Task and resolved repository path remain the run-start telemetry inputs.
assert.match(
  runHarness,
  /task:\s*request\.task\.request,\s*\n\s*repositoryPath:\s*request\.workspace\.repositoryPath,/,
);

// Existing run-control counters and state defaults remain explicitly initialized.
for (const marker of [
  "planningAttempts: 0",
  "reviewAttempts: 0",
  "attempts: 0",
  "maxAttempts: 3",
  'status: "pending"',
] as const) {
  assert.match(
    runHarness,
    new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    `run-harness.ts must preserve current run initialization marker: ${marker}`,
  );
}

// Default production graph remains available, but is loaded lazily so injected
// deterministic tests do not initialize real providers.
assert.match(
  runHarness,
  /const\s+\{\s*buildDevGraph\s*\}\s*=\s*await\s+import\(["']\.\.\/graph\.js["']\)/,
);

// DevState continues exposing the telemetry inputs characterized by H0-001.
for (const field of [
  "task",
  "repositoryPath",
  "repositoryContext",
  "fileContents",
  "recentlyReadFiles",
  "planningAttempts",
  "reviewAttempts",
  "filesChanged",
  "validationOutput",
  "attempts",
  "maxAttempts",
  "failureReason",
  "status",
] as const) {
  assert.match(
    state,
    new RegExp(`\\b${field}\\b`),
    `DevState must expose current telemetry input: ${field}`,
  );
}

// Lifecycle status vocabulary remains unchanged.
for (const status of [
  "pending",
  "analyzing",
  "planning",
  "reviewing_plan",
  "reading_context",
  "refining_plan",
  "checking_plan",
  "implementing",
  "validating",
  "fixing",
  "completed",
  "failed",
] as const) {
  assert.match(state, new RegExp(`["']${status}["']`));
}

// Nodes still expose deterministic attempt and terminal-state observations.
assert.match(nodes, /planningAttempts:\s*attempt/);
assert.match(nodes, /reviewAttempts:\s*state\.reviewAttempts\s*\+\s*1/);
assert.match(nodes, /status:\s*["']completed["']/);
assert.match(nodes, /status:\s*["']failed["']/);
assert.match(nodes, /failureReason/);
assert.match(nodes, /Object\.keys\(state\.fileContents\)\.length/);

// Public graph boundary remains available for production composition.
assert.match(graphBoundary, /export const devGraph = buildDevGraph\(\)/);

// Telemetry remains outside graph nodes and provider execution.
assert.doesNotMatch(
  nodes,
  /\.runs|RunTelemetry|runId|startedAt|finishedAt|durationMs/,
);
assert.doesNotMatch(
  execution,
  /\.runs|RunTelemetry|runId|startedAt|finishedAt|durationMs/,
);

console.log(
  "✅ H0-001 lifecycle/telemetry characterization passed after H0-002A application-boundary migration.",
);
