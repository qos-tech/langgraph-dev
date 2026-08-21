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
const manualSource = await readSource("./intake/manual.ts");
const recorderSource = await readSource("./telemetry/recorder.ts");
const completionSource = await readSource("./telemetry/completion.ts");
const benchmarkContractSource = await readSource("./benchmarks/contracts.ts");

assert.match(
  indexSource,
  /import \{ runHarness \} from "\.\/app\/run-harness\.js";/,
  "executable entry must delegate one-run execution to runHarness",
);

assert.match(
  indexSource,
  /import \{ createManualHarnessRunRequest \} from "\.\/intake\/manual\.js";/,
  "executable entry must delegate raw environment intake to the manual adapter",
);

assert.match(
  indexSource,
  /const task = `[\s\S]*?`\.trim\(\);/,
  "current executable must preserve the hard-coded task text during Step 5 migration",
);

assertContainsInOrder(
  indexSource,
  [
    "const request = createManualHarnessRunRequest({",
    "env: process.env,",
    'taskId: "qflow-workflow-canvas-analysis",',
    "request: task,",
    "const result = await runHarness(request);",
    "result.persistedTelemetry.path",
    "console.dir(result.state,",
  ],
  "migrated executable adapter flow",
);

for (const forbidden of [
  'from "./graph.js"',
  'from "./telemetry/completion.js"',
  'from "./telemetry/llm-calls.js"',
  'from "./telemetry/recorder.js"',
  'from "./telemetry/store.js"',
  "buildDevGraph(",
  "createLlmCallTelemetryCollector(",
  "createRunLifecycleRecorder(",
  "createJsonRunTelemetryStore(",
  "graph.invoke(",
  "activeRun.complete(",
]) {
  assert.equal(
    indexSource.includes(forbidden),
    false,
    `migrated executable must not retain old one-run orchestration: ${forbidden}`,
  );
}

assert.match(
  manualSource,
  /const repositoryPath = input\.env\.TARGET_REPOSITORY;/,
  "manual adapter must read the concrete workspace path explicitly",
);

assert.match(
  manualSource,
  /const repositoryId = input\.env\.TARGET_REPOSITORY_ID;/,
  "manual adapter must read machine-independent repository identity explicitly",
);

assert.match(
  manualSource,
  /TARGET_REPOSITORY_REVISION/,
  "manual adapter must support optional explicit repository revision",
);

assert.match(
  manualSource,
  /normalizeHarnessTask\(\{/,
  "manual adapter must normalize raw task input before execution",
);

assert.match(
  manualSource,
  /workspace:\s*\{\s*repositoryPath,/s,
  "manual adapter must keep repositoryPath in the resolved workspace boundary",
);

assert.doesNotMatch(
  manualSource,
  /id:\s*repositoryPath/,
  "manual adapter must never derive repository identity from the local path",
);

assert.match(
  recorderSource,
  /export type StartRunTelemetryInput = Readonly<\{\s*task: string;\s*repositoryPath: string;\s*\}>;/s,
  "telemetry lifecycle start contract must remain task + concrete repositoryPath",
);

assert.match(
  completionSource,
  /state\.status !== "completed" && state\.status !== "failed"/,
  "telemetry completion must continue requiring a terminal graph state",
);

assert.match(
  benchmarkContractSource,
  /export type BenchmarkRepositoryRef = Readonly<\{\s*id: string;\s*revision: string;\s*\}>;/s,
  "benchmark identity must remain repository id + revision rather than a local path",
);

console.log("✅ H0-002A migrated task-entry characterization passed.");
