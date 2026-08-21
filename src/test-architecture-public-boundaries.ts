import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function source(path: string): Promise<string> {
  return readFile(new URL(path, import.meta.url), "utf8");
}

const [
  entrypoint,
  runHarness,
  graphBoundary,
  builder,
  nodes,
  defaultComposition,
  runtimeComposition,
  execution,
  contracts,
  roleComposition,
] = await Promise.all([
  source("./index.ts"),
  source("./app/run-harness.ts"),
  source("./graph.ts"),
  source("./graph/build-dev-graph.ts"),
  source("./graph/nodes.ts"),
  source("./providers/default-composition.ts"),
  source("./providers/runtime-composition.ts"),
  source("./providers/execution.ts"),
  source("./providers/contracts.ts"),
  source("./providers/role-composition.ts"),
]);

/**
 * H-ARCH-004 / Step 3 + H0-002A / Step 5
 *
 * Protect the public/composition boundaries after the application-boundary
 * migration without weakening the original architecture constraints.
 */

// The executable entry point now delegates through the application boundary
// and manual intake adapter instead of reaching graph composition directly.
assert.match(
  entrypoint,
  /from\s+["']\.\/app\/run-harness\.js["']/,
);
assert.match(
  entrypoint,
  /from\s+["']\.\/intake\/manual\.js["']/,
);
assert.doesNotMatch(
  entrypoint,
  /from\s+["']\.\/graph\.js["']/,
);
assert.doesNotMatch(
  entrypoint,
  /providers\/(?:default-composition|nvidia|claude-cli)/,
);
assert.doesNotMatch(entrypoint, /graph\/build-dev-graph/);
assert.doesNotMatch(entrypoint, /createGraphNodes/);

// The application boundary owns the handoff to the public graph boundary.
// It must not depend on graph internals or concrete provider implementations.
assert.match(
  runHarness,
  /await\s+import\(["']\.\.\/graph\.js["']\)/,
);
assert.doesNotMatch(
  runHarness,
  /graph\/build-dev-graph|graph\/nodes/,
);
assert.doesNotMatch(
  runHarness,
  /providers\/(?:default-composition|nvidia|claude-cli)/,
);

// graph.ts remains the outer compatibility/default-composition boundary.
assert.match(
  graphBoundary,
  /from\s+["']\.\/providers\/default-composition\.js["']/,
);
assert.match(
  graphBoundary,
  /from\s+["']\.\/graph\/build-dev-graph\.js["']/,
);
assert.match(
  graphBoundary,
  /from\s+["']\.\/graph\/nodes\.js["']/,
);
assert.doesNotMatch(
  graphBoundary,
  /from\s+["']\.\/providers\/(?:nvidia|claude-cli)\.js["']/,
);

// Keep the compatibility surface used by existing callers/tests.
for (const exportedName of [
  "knownFileContext",
  "listFiles",
  "normalizeRequests",
  "packageContext",
  "reviewFeedback",
  "buildPlannerPrompt",
  "buildRefinePrompt",
  "buildReviewerPrompt",
  "afterPlanRouter",
  "afterReadRouter",
  "planGateRouter",
  "reviewRouter",
  "createGraphNodes",
  "buildInjectedDevGraph",
  "analyzeNode",
  "failedNode",
  "planGateNode",
  "planNode",
  "readContextNode",
  "refineNode",
  "reportNode",
  "reviewPlanNode",
  "buildDevGraph",
  "devGraph",
] as const) {
  assert.match(
    graphBoundary,
    new RegExp(`\\b${exportedName}\\b`),
    `graph.ts compatibility boundary must keep ${exportedName}.`,
  );
}

// Concrete provider selection belongs in default composition.
assert.match(
  defaultComposition,
  /from\s+["']\.\/nvidia\.js["']/,
);
assert.match(defaultComposition, /defaultLlmRuntimeConfig/);
assert.match(defaultComposition, /defaultLlmRoleBindings/);
assert.doesNotMatch(defaultComposition, /graph\//);

// The injectable graph core stays independent from default composition.
assert.doesNotMatch(
  builder,
  /providers\/default-composition/,
);
assert.doesNotMatch(
  nodes,
  /providers\/default-composition/,
);

// The runtime/execution/contracts core must not reach outward to the public
// graph boundary or concrete default composition.
for (const [name, content] of [
  ["runtime-composition", runtimeComposition],
  ["execution", execution],
  ["contracts", contracts],
  ["role-composition", roleComposition],
] as const) {
  assert.doesNotMatch(
    content,
    /(?:\.\.\/)?graph(?:\.js|\/)/,
    `${name} must not depend on graph/public composition.`,
  );
  assert.doesNotMatch(
    content,
    /default-composition/,
    `${name} must not depend on default concrete composition.`,
  );
}

// The compatibility alias remains only a neutral forwarding layer.
assert.match(roleComposition, /defineLlmRuntimeConfig/);
assert.match(roleComposition, /resolveLlmRoleRuntime/);
assert.doesNotMatch(
  roleComposition,
  /providers\/(?:nvidia|claude-cli)/,
);

console.log(
  "✅ H-ARCH-004 Step 3 public/composition boundary guards passed after H0-002A application-boundary migration.",
);
