import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

type ModuleSpec = Readonly<{
  name: string;
  url: URL;
}>;

const modules = [
  {
    name: "index.ts",
    url: new URL("./index.ts", import.meta.url),
  },
  {
    name: "graph.ts",
    url: new URL("./graph.ts", import.meta.url),
  },
  {
    name: "state.ts",
    url: new URL("./state.ts", import.meta.url),
  },
  {
    name: "graph/build-dev-graph.ts",
    url: new URL("./graph/build-dev-graph.ts", import.meta.url),
  },
  {
    name: "graph/context.ts",
    url: new URL("./graph/context.ts", import.meta.url),
  },
  {
    name: "graph/nodes.ts",
    url: new URL("./graph/nodes.ts", import.meta.url),
  },
  {
    name: "graph/prompts.ts",
    url: new URL("./graph/prompts.ts", import.meta.url),
  },
  {
    name: "graph/routers.ts",
    url: new URL("./graph/routers.ts", import.meta.url),
  },
  {
    name: "graph/schemas.ts",
    url: new URL("./graph/schemas.ts", import.meta.url),
  },
  {
    name: "providers/contracts.ts",
    url: new URL("./providers/contracts.ts", import.meta.url),
  },
  {
    name: "providers/default-composition.ts",
    url: new URL("./providers/default-composition.ts", import.meta.url),
  },
  {
    name: "providers/execution.ts",
    url: new URL("./providers/execution.ts", import.meta.url),
  },
  {
    name: "providers/role-composition.ts",
    url: new URL("./providers/role-composition.ts", import.meta.url),
  },
  {
    name: "providers/runtime-composition.ts",
    url: new URL("./providers/runtime-composition.ts", import.meta.url),
  },
  {
    name: "providers/structured-output.ts",
    url: new URL("./providers/structured-output.ts", import.meta.url),
  },
  {
    name: "repository/inspect.ts",
    url: new URL("./repository/inspect.ts", import.meta.url),
  },
  {
    name: "repository/tools.ts",
    url: new URL("./repository/tools.ts", import.meta.url),
  },
] as const satisfies readonly ModuleSpec[];

function extractImports(source: string): string[] {
  const imports: string[] = [];

  const pattern =
    /\b(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/g;

  for (const match of source.matchAll(pattern)) {
    const specifier = match[1];

    if (specifier) {
      imports.push(specifier);
    }
  }

  return imports;
}

const observed = new Map<string, string[]>();

for (const module of modules) {
  const content = await readFile(module.url, "utf8");
  observed.set(module.name, extractImports(content));
}

function importsOf(module: string): string[] {
  const imports = observed.get(module);

  assert.ok(imports, `Missing characterized module: ${module}`);

  return imports;
}

/**
 * H-ARCH-004 / Step 1
 *
 * These assertions intentionally freeze the CURRENT dependency shape.
 * They are characterization, not the final architecture rule engine.
 *
 * Later steps may replace these point assertions with generalized dependency
 * and cycle guards, but only after the existing boundaries are explicit.
 */

assert.deepEqual(importsOf("index.ts"), [
  "./graph.js",
]);

assert.deepEqual(importsOf("graph.ts"), [
  "./providers/default-composition.js",
  "./graph/build-dev-graph.js",
  "./graph/nodes.js",
  "./telemetry/llm-calls.js",
  "./graph/context.js",
  "./graph/prompts.js",
  "./graph/routers.js",
  "./graph/nodes.js",
  "./graph/build-dev-graph.js",
]);

assert.deepEqual(importsOf("graph/build-dev-graph.ts"), [
  "@langchain/langgraph",
  "../state.js",
  "../providers/runtime-composition.js",
  "../telemetry/llm-calls.js",
  "./nodes.js",
  "./routers.js",
]);

assert.deepEqual(importsOf("graph/nodes.ts"), [
  "../state.js",
  "../providers/runtime-composition.js",
  "../providers/runtime-composition.js",
  "../providers/execution.js",
  "../telemetry/llm-calls.js",
  "../repository/inspect.js",
  "../repository/tools.js",
  "./schemas.js",
  "./context.js",
  "./prompts.js",
]);

assert.deepEqual(importsOf("graph/context.ts"), [
  "../state.js",
  "./schemas.js",
]);

assert.deepEqual(importsOf("graph/prompts.ts"), [
  "../state.js",
  "./context.js",
]);

assert.deepEqual(importsOf("graph/routers.ts"), [
  "../state.js",
]);

assert.deepEqual(importsOf("graph/schemas.ts"), [
  "zod",
]);

assert.deepEqual(importsOf("providers/runtime-composition.ts"), [
  "./contracts.js",
]);

assert.deepEqual(importsOf("providers/execution.ts"), [
  "./contracts.js",
  "./runtime-composition.js",
]);

assert.deepEqual(importsOf("providers/role-composition.ts"), [
  "./runtime-composition.js",
  "./runtime-composition.js",
]);

assert.deepEqual(importsOf("providers/default-composition.ts"), [
  "./nvidia.js",
  "./runtime-composition.js",
]);

assert.deepEqual(importsOf("providers/contracts.ts"), []);

assert.deepEqual(importsOf("providers/structured-output.ts"), []);

assert.deepEqual(importsOf("repository/inspect.ts"), [
  "node:fs/promises",
  "node:path",
  "node:child_process",
  "node:util",
]);

assert.deepEqual(importsOf("repository/tools.ts"), [
  "node:fs/promises",
  "node:path",
  "node:child_process",
  "node:util",
]);

// Current high-value boundaries already implied by the observed graph.
assert.equal(
  importsOf("graph/build-dev-graph.ts").includes("../graph.js"),
  false,
  "graph builder must not depend on the compatibility boundary.",
);

assert.equal(
  importsOf("providers/runtime-composition.ts").some((specifier) =>
    specifier.includes("nvidia") || specifier.includes("claude-cli"),
  ),
  false,
  "runtime composition is currently provider-neutral.",
);

assert.equal(
  importsOf("providers/execution.ts").some((specifier) =>
    specifier.includes("nvidia") || specifier.includes("claude-cli"),
  ),
  false,
  "execution boundary is currently provider-neutral.",
);

assert.equal(
  importsOf("graph/nodes.ts").some((specifier) =>
    specifier.includes("nvidia") || specifier.includes("claude-cli"),
  ),
  false,
  "graph nodes are currently provider-neutral.",
);

console.log("✅ H-ARCH-004 Step 1 dependency-boundary characterization passed.");
