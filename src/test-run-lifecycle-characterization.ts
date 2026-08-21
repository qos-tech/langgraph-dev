import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function source(path: string): Promise<string> {
  return readFile(new URL(path, import.meta.url), "utf8");
}

const [
  entrypoint,
  state,
  nodes,
  graphBoundary,
  execution,
] = await Promise.all([
  source("./index.ts"),
  source("./state.ts"),
  source("./graph/nodes.ts"),
  source("./graph.ts"),
  source("./providers/execution.ts"),
]);

/**
 * H0-001 / Step 1
 *
 * Characterize the current run lifecycle and the telemetry inputs that already
 * exist before introducing telemetry production code.
 */

// Current executable lifecycle starts in index.ts and invokes the compiled graph.
assert.match(
  entrypoint,
  /import\s+\{\s*buildDevGraph\s*\}\s+from\s+["']\.\/graph\.js["']/,
);
assert.match(entrypoint, /const graph = buildDevGraph\(llmCallCollector\)/);
assert.match(entrypoint, /await\s+graph\.invoke\(\{/);

// Task/repository identity already exists at run start.
assert.match(entrypoint, /\btask,\s*\n\s*repositoryPath,/);

// Existing run-control counters and state defaults are explicitly initialized.
for (const marker of [
  "planningAttempts: 0",
  "reviewAttempts: 0",
  "attempts: 0",
  "maxAttempts: 3",
  'status: "pending"',
] as const) {
  assert.match(
    entrypoint,
    new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    `index.ts must keep current run initialization marker: ${marker}`,
  );
}

// DevState already contains the fields that will seed run-level telemetry.
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

// Current lifecycle status vocabulary is characterized before telemetry starts
// depending on it.
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

// Nodes already expose deterministic points where attempts and terminal status
// can be observed.
assert.match(nodes, /planningAttempts:\s*attempt/);
assert.match(nodes, /reviewAttempts:\s*state\.reviewAttempts\s*\+\s*1/);
assert.match(nodes, /status:\s*["']completed["']/);
assert.match(nodes, /status:\s*["']failed["']/);
assert.match(nodes, /failureReason/);
assert.match(nodes, /Object\.keys\(state\.fileContents\)\.length/);

// The public graph boundary remains the runtime entry used by index.ts.
assert.match(graphBoundary, /export const devGraph = buildDevGraph\(\)/);

// H0-001 Step 6 turns the characterized lifecycle into explicit application
// composition without moving lifecycle state into graph nodes.
for (const marker of [
  "createLlmCallTelemetryCollector",
  "createRunLifecycleRecorder",
  "buildRunTelemetryCompletion",
  "createJsonRunTelemetryStore",
  "activeRun.complete",
  "telemetryStore.save",
] as const) {
  assert.match(
    entrypoint,
    new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
  );
}

assert.doesNotMatch(
  nodes,
  /\.runs|RunTelemetry|runId|startedAt|finishedAt|durationMs/,
);
assert.doesNotMatch(
  execution,
  /\.runs|RunTelemetry|runId|startedAt|finishedAt|durationMs/,
);

console.log(
  "✅ H0-001 lifecycle/telemetry characterization and Step 6 wiring passed.",
);
