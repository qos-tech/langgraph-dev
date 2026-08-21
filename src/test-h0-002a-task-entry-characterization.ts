import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function readSource(relativePath: string): Promise<string> {
  return readFile(new URL(relativePath, import.meta.url), "utf8");
}

function assertContainsInOrder(
  source: string,
  fragments: readonly string[],
  label: string,
): void {
  let cursor = 0;

  for (const fragment of fragments) {
    const index = source.indexOf(fragment, cursor);

    assert.notEqual(
      index,
      -1,
      `${label} must contain "${fragment}" after the previous characterized boundary`,
    );

    cursor = index + fragment.length;
  }
}

const indexSource = await readSource("./index.ts");
const recorderSource = await readSource("./telemetry/recorder.ts");
const completionSource = await readSource("./telemetry/completion.ts");
const benchmarkContractSource = await readSource("./benchmarks/contracts.ts");

assert.match(
  indexSource,
  /const repositoryPath = process\.env\.TARGET_REPOSITORY;/,
  "current executable entry must source the concrete repository path from TARGET_REPOSITORY",
);

assert.match(
  indexSource,
  /if \(!repositoryPath\) \{\s*throw new Error\("TARGET_REPOSITORY não definido\."\);\s*\}/s,
  "current executable entry must fail before graph execution when TARGET_REPOSITORY is missing",
);

assert.match(
  indexSource,
  /const task = `[\s\S]*?`\.trim\(\);/,
  "current executable entry must own the hard-coded task text",
);

assertContainsInOrder(
  indexSource,
  [
    "const llmCallCollector = createLlmCallTelemetryCollector();",
    "const runRecorder = createRunLifecycleRecorder();",
    "const activeRun = runRecorder.start({",
    "task,",
    "repositoryPath,",
    "const graph = buildDevGraph(llmCallCollector);",
    "const telemetryStore = createJsonRunTelemetryStore();",
    "const result = await graph.invoke({",
  ],
  "current one-run composition order",
);

assertContainsInOrder(
  indexSource,
  [
    "task,",
    "repositoryPath,",
    "fileContents: {},",
    "fileSummaries: {},",
    "recentlyReadFiles: [],",
    "filesChanged: [],",
    "attempts: 0,",
    "maxAttempts: 3,",
    "planningAttempts: 0,",
    "reviewAttempts: 0,",
    "maxPlanningAttempts: Number(process.env.MAX_PLANNING_ATTEMPTS ?? 4),",
    "failureReason: undefined,",
    'status: "pending",',
  ],
  "current graph initial state",
);

assertContainsInOrder(
  indexSource,
  [
    "const telemetry = activeRun.complete(",
    "buildRunTelemetryCompletion(",
    "result,",
    "llmCallCollector.snapshot(),",
    "const persistedTelemetry = await telemetryStore.save(telemetry);",
  ],
  "current terminal telemetry flow",
);

assert.match(
  recorderSource,
  /export type StartRunTelemetryInput = Readonly<\{\s*task: string;\s*repositoryPath: string;\s*\}>;/s,
  "current telemetry lifecycle start contract must remain task + concrete repositoryPath",
);

assert.match(
  completionSource,
  /state\.status !== "completed" && state\.status !== "failed"/,
  "current telemetry completion must require a terminal graph state",
);

assert.match(
  benchmarkContractSource,
  /export type BenchmarkRepositoryRef = Readonly<\{\s*id: string;\s*revision: string;\s*\}>;/s,
  "benchmark identity must remain repository id + revision rather than a local path",
);

assert.doesNotMatch(
  indexSource,
  /runHarness\s*\(/,
  "Step 1 characterizes the current entry before introducing runHarness",
);

assert.doesNotMatch(
  indexSource,
  /NormalizedHarnessTask/,
  "Step 1 must not introduce the normalized task contract early",
);

console.log("✅ H0-002A Step 1 current task-entry characterization passed.");
