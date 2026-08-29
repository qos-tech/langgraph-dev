import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import type { ResolvedWorkspace } from "./app/run-harness.js";
import type { BenchmarkRepositoryRef } from "./benchmarks/contracts.js";
import type {
  BenchmarkWorkspaceRequest,
  BenchmarkWorkspaceResolver,
  ResolvedBenchmarkWorkspace,
} from "./benchmarks/workspace.js";

const repository: BenchmarkRepositoryRef = {
  id: "fixture-repository",
  revision: "fixture-v1",
};

const request: BenchmarkWorkspaceRequest = {
  repository,
};

let cleanupCalls = 0;
const workspace: ResolvedWorkspace = {
  repositoryPath: "/isolated/fixture-repository/fixture-v1/run-001",
};

const fakeResolver: BenchmarkWorkspaceResolver = {
  async resolve(
    received: BenchmarkWorkspaceRequest,
  ): Promise<ResolvedBenchmarkWorkspace> {
    assert.deepEqual(received, request);

    return {
      workspace,
      cleanup: async () => {
        cleanupCalls += 1;
      },
    };
  },
};

const resolved = await fakeResolver.resolve(request);

assert.equal(
  resolved.workspace.repositoryPath,
  "/isolated/fixture-repository/fixture-v1/run-001",
);
assert.equal(
  "repositoryPath" in request.repository,
  false,
  "runtime workspace path must remain outside benchmark repository identity",
);

await resolved.cleanup();
assert.equal(cleanupCalls, 1, "cleanup must be explicit and awaitable");

const [
  workspaceContractSource,
  taskAdapterSource,
  runHarnessSource,
  benchmarkContractSource,
  normalizedTaskContractSource,
] = await Promise.all([
  readFile(new URL("./benchmarks/workspace.ts", import.meta.url), "utf8"),
  readFile(new URL("./benchmarks/task-adapter.ts", import.meta.url), "utf8"),
  readFile(new URL("./app/run-harness.ts", import.meta.url), "utf8"),
  readFile(new URL("./benchmarks/contracts.ts", import.meta.url), "utf8"),
  readFile(new URL("./intake/contracts.ts", import.meta.url), "utf8"),
]);

assert.match(
  workspaceContractSource,
  /repository:\s*BenchmarkRepositoryRef;/,
  "workspace resolver input must consume benchmark repository identity",
);
assert.match(
  workspaceContractSource,
  /workspace:\s*ResolvedWorkspace;/,
  "workspace resolver output must expose the shared application workspace type",
);
assert.match(
  workspaceContractSource,
  /cleanup:\s*\(\)\s*=>\s*Promise<void>;/,
  "workspace cleanup must be explicit and awaitable",
);
assert.match(
  workspaceContractSource,
  /interface\s+BenchmarkWorkspaceResolver/,
);
assert.match(
  workspaceContractSource,
  /Promise<ResolvedBenchmarkWorkspace>/,
);

for (const forbiddenImport of [
  "node:child_process",
  "node:fs",
  "node:fs/promises",
  "node:os",
  "node:path",
]) {
  assert.equal(
    workspaceContractSource.includes(forbiddenImport),
    false,
    `workspace contract must not contain concrete infrastructure import: ${forbiddenImport}`,
  );
}

for (const forbiddenBehavior of [
  "exec(",
  "execFile(",
  "spawn(",
  "mkdtemp(",
  "rm(",
  "git worktree",
  "git clone",
]) {
  assert.equal(
    workspaceContractSource.includes(forbiddenBehavior),
    false,
    `workspace contract must not implement concrete workspace behavior: ${forbiddenBehavior}`,
  );
}

assert.doesNotMatch(
  taskAdapterSource,
  /workspace|repositoryPath|worktree|child_process|spawn|execFile/,
  "benchmark task adaptation must remain independent from workspace resolution",
);
assert.doesNotMatch(
  runHarnessSource,
  /BenchmarkWorkspaceResolver|BenchmarkRepositoryRef|worktree|git clone/,
  "runHarness must remain independent from benchmark repository lookup",
);
assert.doesNotMatch(
  benchmarkContractSource,
  /repositoryPath/,
  "benchmark repository identity must remain machine-independent",
);
assert.doesNotMatch(
  normalizedTaskContractSource,
  /repositoryPath/,
  "normalized task identity must not absorb runtime workspace paths",
);

console.log("✅ H0-003 Step 3 workspace resolver contract passed.");
