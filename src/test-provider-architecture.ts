import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function source(path: string): Promise<string> {
  return readFile(new URL(path, import.meta.url), "utf8");
}

const [
  nodes,
  builder,
  compatibilityBoundary,
  contracts,
  roleComposition,
  runtimeComposition,
  defaultComposition,
] = await Promise.all([
  source("./graph/nodes.ts"),
  source("./graph/build-dev-graph.ts"),
  source("./graph.ts"),
  source("./providers/contracts.ts"),
  source("./providers/role-composition.ts"),
  source("./providers/runtime-composition.ts"),
  source("./providers/default-composition.ts"),
]);

// Application/graph code must not depend on concrete provider adapters.
for (const [name, content] of [
  ["graph/nodes.ts", nodes],
  ["graph/build-dev-graph.ts", builder],
] as const) {
  assert.doesNotMatch(
    content,
    /providers\/(?:nvidia|claude-cli)/,
    `${name} must not import a concrete provider adapter.`,
  );

  assert.doesNotMatch(
    content,
    /callNvidiaJson|ClaudeCliProvider|NvidiaProvider/,
    `${name} must not reference provider-specific APIs.`,
  );
}

// The graph builder must require injected role bindings.
assert.match(builder, /buildDevGraph\(llmRuntimeConfig: LlmRuntimeConfig\)/);
assert.match(builder, /createGraphNodes\(llmRuntimeConfig\)/);

// Nodes may depend only on the neutral role-composition boundary.
assert.match(nodes, /providers\/runtime-composition/);
assert.match(nodes, /binding\.provider\.generateStructured/);

// Concrete default selection belongs at the outer compatibility/composition root.
assert.match(
  compatibilityBoundary,
  /providers\/default-composition/,
);
assert.doesNotMatch(
  compatibilityBoundary,
  /providers\/(?:nvidia|claude-cli)/,
);

// The neutral contracts/composition layer must not import concrete adapters.
assert.doesNotMatch(
  contracts,
  /from\s+["'][^"']*(?:nvidia|claude-cli)[^"']*["']/,
);
assert.doesNotMatch(
  roleComposition,
  /from\s+["'][^"']*(?:nvidia|claude-cli)[^"']*["']/,
);
assert.doesNotMatch(
  runtimeComposition,
  /from\s+["'][^"']*(?:nvidia|claude-cli)[^"']*["']/,
);

// Concrete provider selection is allowed in the default composition root.
assert.match(defaultComposition, /from\s+["']\.\/nvidia\.js["']/);

console.log("✅ H-ARCH-002 Step 9 provider architecture review passed.");
