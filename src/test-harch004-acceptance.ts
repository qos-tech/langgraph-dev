import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function source(path: string): Promise<string> {
  return readFile(new URL(path, import.meta.url), "utf8");
}

const [
  dependencyGuard,
  boundaryCharacterization,
  publicBoundaryGuard,
  providerArchitectureGuard,
  graphBoundary,
  builder,
  nodes,
  runtimeComposition,
  execution,
  contracts,
  defaultComposition,
] = await Promise.all([
  source("./test-architecture-dependencies.ts"),
  source("./test-architecture-boundaries-characterization.ts"),
  source("./test-architecture-public-boundaries.ts"),
  source("./test-provider-architecture.ts"),
  source("./graph.ts"),
  source("./graph/build-dev-graph.ts"),
  source("./graph/nodes.ts"),
  source("./providers/runtime-composition.ts"),
  source("./providers/execution.ts"),
  source("./providers/contracts.ts"),
  source("./providers/default-composition.ts"),
]);

/**
 * H-ARCH-004 / Step 4
 *
 * Final architecture acceptance does not add another architecture mechanism.
 * It verifies that the three H-ARCH-004 guards and the existing provider
 * architecture guard cover the boundaries established by H-ARCH-001/002/003.
 */

// Step 1: current dependency shape remains explicitly characterized.
assert.match(
  boundaryCharacterization,
  /dependency-boundary characterization passed/,
);
assert.match(boundaryCharacterization, /graph\/build-dev-graph\.ts/);
assert.match(boundaryCharacterization, /graph\/nodes\.ts/);
assert.match(boundaryCharacterization, /providers\/runtime-composition\.ts/);
assert.match(boundaryCharacterization, /providers\/execution\.ts/);

// Step 2: generalized dependency graph + cycle protection exists.
assert.match(dependencyGuard, /findCycles/);
assert.match(dependencyGuard, /Production-module cycles detected/);
assert.match(dependencyGuard, /Graph internals must not import/);
assert.match(
  dependencyGuard,
  /Neutral provider runtime must not depend on concrete provider composition/,
);

// Step 3: outer public/composition semantics are protected.
assert.match(
  publicBoundaryGuard,
  /executable entry point must continue through the public graph boundary/i,
);
assert.match(
  publicBoundaryGuard,
  /graph\.ts is the current outer compatibility\/default-composition boundary/,
);
assert.match(
  publicBoundaryGuard,
  /Concrete provider selection belongs in default composition/,
);

// Existing provider-specific architecture guard remains complementary.
assert.match(
  providerArchitectureGuard,
  /Application\/graph code must not depend on concrete provider adapters/,
);
assert.match(
  providerArchitectureGuard,
  /The neutral contracts\/composition layer must not import concrete adapters/,
);

// Final runtime dependency direction remains intact.
assert.match(
  graphBoundary,
  /providers\/default-composition/,
);
assert.doesNotMatch(
  graphBoundary,
  /providers\/(?:nvidia|claude-cli)/,
);

assert.match(builder, /buildDevGraph\(llmRuntimeConfig: LlmRuntimeConfig\)/);
assert.match(builder, /createGraphNodes\(llmRuntimeConfig\)/);
assert.doesNotMatch(builder, /default-composition|providers\/(?:nvidia|claude-cli)/);

assert.match(nodes, /resolveLlmRoleRuntime/);
assert.match(nodes, /executeStructuredLlm/);
assert.doesNotMatch(nodes, /default-composition|providers\/(?:nvidia|claude-cli)/);

assert.doesNotMatch(
  runtimeComposition,
  /from\s+["'][^"']*(?:nvidia|claude-cli|default-composition)[^"']*["']/,
);
assert.doesNotMatch(
  execution,
  /from\s+["'][^"']*(?:nvidia|claude-cli|default-composition)[^"']*["']/,
);
assert.doesNotMatch(
  contracts,
  /from\s+["'][^"']*(?:nvidia|claude-cli|default-composition|graph)[^"']*["']/,
);

assert.match(defaultComposition, /from\s+["']\.\/nvidia\.js["']/);
assert.match(defaultComposition, /defaultLlmRuntimeConfig/);

// H-ARCH-004 must close without production-code changes.
assert.doesNotMatch(
  dependencyGuard + boundaryCharacterization + publicBoundaryGuard,
  /dependency-cruiser|from\s+["']madge["']/,
);

console.log("✅ H-ARCH-004 Step 4 final architecture acceptance passed.");
