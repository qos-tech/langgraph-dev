import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const srcRoot = fileURLToPath(new URL(".", import.meta.url));

async function listProductionModules(directory: string): Promise<string[]> {
  const entries = await readdir(directory, {
    withFileTypes: true,
  });

  const modules: string[] = [];

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      modules.push(...(await listProductionModules(absolutePath)));
      continue;
    }

    if (!entry.name.endsWith(".ts")) {
      continue;
    }

    if (entry.name.startsWith("test-")) {
      continue;
    }

    modules.push(path.relative(srcRoot, absolutePath).split(path.sep).join("/"));
  }

  return modules.sort();
}

function extractModuleSpecifiers(source: string): string[] {
  const specifiers: string[] = [];

  const staticPattern =
    /\b(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/g;

  for (const match of source.matchAll(staticPattern)) {
    const specifier = match[1];

    if (specifier) {
      specifiers.push(specifier);
    }
  }

  const dynamicPattern = /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g;

  for (const match of source.matchAll(dynamicPattern)) {
    const specifier = match[1];

    if (specifier) {
      specifiers.push(specifier);
    }
  }

  return specifiers;
}

function normalizeRelativeTarget(
  importer: string,
  specifier: string,
): string | undefined {
  if (!specifier.startsWith(".")) {
    return undefined;
  }

  const importerDirectory = path.posix.dirname(importer);
  const resolved = path.posix.normalize(
    path.posix.join(importerDirectory, specifier),
  );

  if (resolved.endsWith(".js")) {
    return `${resolved.slice(0, -3)}.ts`;
  }

  if (resolved.endsWith(".ts")) {
    return resolved;
  }

  return `${resolved}.ts`;
}

type DependencyGraph = ReadonlyMap<string, readonly string[]>;

async function buildDependencyGraph(
  modules: readonly string[],
): Promise<DependencyGraph> {
  const moduleSet = new Set(modules);
  const graph = new Map<string, readonly string[]>();

  for (const module of modules) {
    const source = await readFile(path.join(srcRoot, module), "utf8");
    const localTargets = extractModuleSpecifiers(source)
      .map((specifier) => normalizeRelativeTarget(module, specifier))
      .filter((target): target is string => target !== undefined);

    for (const target of localTargets) {
      assert.ok(
        moduleSet.has(target),
        `Unresolved local production dependency: ${module} -> ${target}`,
      );
    }

    graph.set(module, [...new Set(localTargets)].sort());
  }

  return graph;
}

function findCycles(graph: DependencyGraph): string[][] {
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const stack: string[] = [];
  const cycles: string[][] = [];

  function visit(module: string): void {
    if (visited.has(module)) {
      return;
    }

    if (visiting.has(module)) {
      const start = stack.indexOf(module);

      if (start >= 0) {
        cycles.push([...stack.slice(start), module]);
      }

      return;
    }

    visiting.add(module);
    stack.push(module);

    for (const dependency of graph.get(module) ?? []) {
      visit(dependency);
    }

    stack.pop();
    visiting.delete(module);
    visited.add(module);
  }

  for (const module of graph.keys()) {
    visit(module);
  }

  return cycles;
}

function assertNoDependency(
  graph: DependencyGraph,
  importer: string,
  forbidden: (dependency: string) => boolean,
  message: string,
): void {
  const dependency = (graph.get(importer) ?? []).find(forbidden);

  assert.equal(
    dependency,
    undefined,
    dependency ? `${message}: ${importer} -> ${dependency}` : message,
  );
}

const modules = await listProductionModules(srcRoot);
const graph = await buildDependencyGraph(modules);

const cycles = findCycles(graph);

assert.deepEqual(
  cycles,
  [],
  `Production-module cycles detected:\n${cycles
    .map((cycle) => `- ${cycle.join(" -> ")}`)
    .join("\n")}`,
);

// No graph-internal module may depend back on the outer compatibility boundary.
for (const module of modules.filter((value) => value.startsWith("graph/"))) {
  assertNoDependency(
    graph,
    module,
    (dependency) => dependency === "graph.ts",
    "Graph internals must not import the outer graph.ts compatibility boundary",
  );
}

// Graph internals must remain free of concrete provider adapters and concrete
// default composition. Those choices belong outside the graph core.
for (const module of modules.filter((value) => value.startsWith("graph/"))) {
  assertNoDependency(
    graph,
    module,
    (dependency) =>
      dependency === "providers/nvidia.ts" ||
      dependency === "providers/claude-cli.ts" ||
      dependency === "providers/default-composition.ts",
    "Graph internals must remain provider-neutral",
  );
}

// These modules form the provider-neutral execution/runtime core.
const neutralProviderModules = [
  "providers/contracts.ts",
  "providers/execution.ts",
  "providers/role-composition.ts",
  "providers/runtime-composition.ts",
] as const;

for (const module of neutralProviderModules) {
  assert.ok(modules.includes(module), `Missing production module: ${module}`);

  assertNoDependency(
    graph,
    module,
    (dependency) =>
      dependency === "providers/nvidia.ts" ||
      dependency === "providers/claude-cli.ts" ||
      dependency === "providers/default-composition.ts",
    "Neutral provider runtime must not depend on concrete provider composition",
  );
}

// The graph builder must stay injectable rather than reaching outward to the
// default runtime composition.
assertNoDependency(
  graph,
  "graph/build-dev-graph.ts",
  (dependency) => dependency === "providers/default-composition.ts",
  "Graph builder must not select the default concrete runtime",
);

console.log(
  `✅ H-ARCH-004 Step 2 module dependency/cycle guards passed (${modules.length} production modules).`,
);
