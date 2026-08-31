import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function source(path: string): Promise<string> {
  return readFile(new URL(path, import.meta.url), "utf8");
}

const [state, routers, nodes, runHarness, observation, execution] =
  await Promise.all([
    source("./state.ts"),
    source("./graph/routers.ts"),
    source("./graph/nodes.ts"),
    source("./app/run-harness.ts"),
    source("./benchmarks/observation.ts"),
    source("./providers/execution.ts"),
  ]);

/**
 * H0-004A / Step 1
 *
 * Characterize the exact current terminal-state evidence before introducing a
 * terminal-classification contract. This test intentionally performs no graph
 * invocation and therefore consumes zero provider calls.
 */

// DevState already exposes the deterministic planning/terminal evidence that
// H0-004A may later classify.
for (const marker of [
  "refinedPlan: RefinedPlanSchema.optional()",
  "planningAttempts: z.number().int().nonnegative().default(0)",
  "reviewAttempts: z.number().int().nonnegative().default(0)",
  "maxPlanningAttempts: z.number().int().positive().default(4)",
  "failureReason: z.string().optional()",
] as const) {
  assert.match(
    state,
    new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    `DevState terminal evidence marker changed: ${marker}`,
  );
}

for (const status of ["completed", "failed"] as const) {
  assert.match(state, new RegExp(`["']${status}["']`));
}

// Planning exhaustion is an exact >= boundary in reviewRouter. It routes to
// failed only after review/plan existence checks and enough_context handling.
assert.match(
  routers,
  /if\s*\(state\.planningAttempts\s*>=\s*state\.maxPlanningAttempts\)\s*\{[\s\S]*?return\s+["']failed["'];?[\s\S]*?\}/,
  "planning exhaustion must remain planningAttempts >= maxPlanningAttempts → failed",
);
assert.match(
  routers,
  /if\s*\(review\.decision\s*===\s*["']enough_context["']\)\s*\{[\s\S]*?return\s+["']refine["'];?[\s\S]*?\}[\s\S]*?planningAttempts\s*>=\s*state\.maxPlanningAttempts/,
  "enough_context must continue to reach refine before the exhaustion guard",
);

// The plan node increments planningAttempts exactly once per planner execution.
assert.match(nodes, /const\s+attempt\s*=\s*state\.planningAttempts\s*\+\s*1/);
assert.match(nodes, /planningAttempts:\s*attempt/);

// The current exhausted route does not synthesize a refined plan or a failure
// reason. failedNode only preserves/prints the state and returns status=failed.
const failedNodeSource = nodes.match(
  /export\s+const\s+failedNode[\s\S]*?^\};/m,
)?.[0];
assert.ok(failedNodeSource, "failedNode source must remain characterizable");
assert.match(failedNodeSource, /status:\s*["']failed["']/);
assert.doesNotMatch(failedNodeSource, /refinedPlan\s*:/);
assert.doesNotMatch(failedNodeSource, /failureReason\s*:/);

// Blocked-with-plan is already a valid domain outcome even though planGate
// provides a failureReason and the graph routes that state to failed.
assert.match(
  nodes,
  /if\s*\(plan\.outcome\s*===\s*["']blocked["']\)[\s\S]*?failureReason:\s*plan\.blockingUnknowns\.join\(["']; ["']\)/,
);
assert.match(
  routers,
  /if\s*\(state\.failureReason\)\s*\{[\s\S]*?return\s+["']failed["']/,
);

// Existing observation semantics remain frozen during characterization.
assert.match(
  observation,
  /if\s*\(!refinedPlan\)\s*\{[\s\S]*?Cannot derive benchmark outcome without refinedPlan\./,
);
assert.match(
  observation,
  /refinedPlan\.outcome\s*===\s*["']blocked["'][\s\S]*?state\.status\s*!==\s*["']failed["'][\s\S]*?!state\.failureReason/,
);
assert.match(
  observation,
  /state\.status\s*!==\s*["']completed["']\s*\|\|\s*state\.failureReason\s*!==\s*undefined/,
);
assert.doesNotMatch(
  observation,
  /telemetry\.finalStatus|benchmarkId|expectedOutcome/,
  "observation must not infer outcome from telemetry status or benchmark expectations",
);

// Provider/runtime errors currently propagate rather than becoming a returned
// Harness state: runHarness awaits invokeGraph directly, then completes and
// persists telemetry only after a state has been returned.
assert.match(runHarness, /const\s+state\s*=\s*await\s+invokeGraph\(/);
assert.match(
  runHarness,
  /const\s+state\s*=\s*await\s+invokeGraph\([\s\S]*?const\s+telemetry\s*=\s*activeRun\.complete/,
);
const runHarnessFunction = runHarness.match(
  /export\s+async\s+function\s+runHarness[\s\S]*?^\}/m,
)?.[0];
assert.ok(runHarnessFunction, "runHarness source must remain characterizable");
assert.doesNotMatch(
  runHarnessFunction,
  /\bcatch\s*\(/,
  "provider/graph exceptions currently propagate without terminal-state normalization",
);

// The provider-neutral execution boundary also forwards provider rejection
// directly; there is no Harness-level retry/error classification here today.
assert.match(
  execution,
  /return\s+runtime\.provider\.generateStructured\(\{/,
);
assert.doesNotMatch(execution, /\bcatch\s*\(/);

console.log(
  "✅ H0-004A Step 1 terminal-state characterization passed.",
);
