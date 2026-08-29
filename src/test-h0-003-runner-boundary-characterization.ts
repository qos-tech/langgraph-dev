import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function source(path: string): Promise<string> {
  return readFile(new URL(path, import.meta.url), "utf8");
}

const [
  benchmarkContracts,
  benchmarkCases,
  benchmarkAcceptance,
  benchmarkSuiteValidation,
  taskContracts,
  taskNormalizer,
  runHarness,
  telemetryContracts,
  telemetryStore,
] = await Promise.all([
  source("./benchmarks/contracts.ts"),
  source("./benchmarks/cases.ts"),
  source("./benchmarks/acceptance.ts"),
  source("./benchmarks/suite-validation.ts"),
  source("./intake/contracts.ts"),
  source("./intake/normalize.ts"),
  source("./app/run-harness.ts"),
  source("./telemetry/contracts.ts"),
  source("./telemetry/store.ts"),
]);

/**
 * H0-003 / Step 1
 *
 * Characterize the exact alpha.7 contracts that the future Benchmark Runner
 * must connect. This test intentionally performs no provider call, Git
 * mutation, worktree creation, validation command, or Harness execution.
 */

// Benchmark identity and execution metadata are explicit and machine-independent.
for (const field of [
  "schemaVersion",
  "id",
  "title",
  "difficulty",
  "task",
  "repository",
  "constraints",
  "successCriteria",
  "validationCommands",
  "expectedOutcome",
]) {
  assert.match(
    benchmarkContracts,
    new RegExp(`\\b${field}\\b`),
    `BenchmarkTask must expose ${field}.`,
  );
}

assert.match(
  benchmarkContracts,
  /BenchmarkRepositoryRef[\s\S]*?\bid:\s*string;[\s\S]*?\brevision:\s*string;/,
);
assert.doesNotMatch(
  benchmarkContracts,
  /repositoryPath/,
  "benchmark identity must not contain a machine-local repository path",
);

// The fixed suite carries repository identity/revision and benchmark-owned
// validation commands for every case.
assert.match(benchmarkCases, /id:\s*"B01"/);
assert.match(benchmarkCases, /id:\s*"B05"/);
assert.match(benchmarkCases, /revision:\s*"b01-v1"/);
assert.match(benchmarkCases, /revision:\s*"b05-v1"/);
assert.match(benchmarkCases, /validationCommands:\s*\[/);
assert.match(benchmarkCases, /expectedOutcome:\s*"already_satisfied"/);
assert.match(benchmarkCases, /expectedOutcome:\s*"blocked"/);

assert.match(
  benchmarkSuiteValidation,
  /absolute_repository_id/,
  "benchmark suite must keep repository IDs machine-independent",
);
assert.match(
  benchmarkSuiteValidation,
  /empty_validation_commands/,
  "validation commands are required benchmark data",
);

// The normalized Harness task contains only integration-neutral task data.
for (const field of [
  "schemaVersion",
  "id",
  "source",
  "repository",
  "request",
  "constraints",
  "acceptanceCriteria",
  "metadata",
]) {
  assert.match(
    taskContracts,
    new RegExp(`\\b${field}\\b`),
    `NormalizedHarnessTask must expose ${field}.`,
  );
}

assert.match(
  taskContracts,
  /["']benchmark["']/,
  "benchmark must remain an explicit Harness task source",
);
assert.doesNotMatch(taskContracts, /validationCommands/);
assert.doesNotMatch(taskContracts, /expectedOutcome/);
assert.doesNotMatch(taskContracts, /repositoryPath/);

assert.match(taskNormalizer, /RawHarnessTaskInput[\s\S]*?source:\s*string;/);
assert.match(taskNormalizer, /HARNESS_TASK_SOURCES[\s\S]*?["']benchmark["']/);
assert.match(taskNormalizer, /normalizeHarnessTask[\s\S]*?:\s*NormalizedHarnessTask/);
assert.match(taskNormalizer, /absolute_repository_id/);
assert.doesNotMatch(
  taskNormalizer,
  /validationCommands|expectedOutcome|runHarness|buildDevGraph/,
  "task normalization must not absorb benchmark execution or acceptance policy",
);

// Source-evidenced future adapter mapping:
// BenchmarkTask.id              -> NormalizedHarnessTask.id
// source                        -> "benchmark"
// BenchmarkTask.repository      -> NormalizedHarnessTask.repository
// BenchmarkTask.task            -> NormalizedHarnessTask.request
// BenchmarkTask.constraints     -> NormalizedHarnessTask.constraints
// BenchmarkTask.successCriteria -> NormalizedHarnessTask.acceptanceCriteria
//
// validationCommands and expectedOutcome remain benchmark-runner data.
assert.match(benchmarkContracts, /\bid:\s*string;/);
assert.match(benchmarkContracts, /\btask:\s*string;/);
assert.match(benchmarkContracts, /\bconstraints:\s*readonly string\[\];/);
assert.match(benchmarkContracts, /\bsuccessCriteria:\s*readonly string\[\];/);
assert.match(taskContracts, /\bid:\s*string;/);
assert.match(taskContracts, /\brequest:\s*string;/);
assert.match(taskContracts, /\bconstraints:\s*readonly string\[\];/);
assert.match(taskContracts, /\bacceptanceCriteria:\s*readonly string\[\];/);

// Application execution already separates normalized identity from workspace.
assert.match(
  runHarness,
  /RunHarnessRequest[\s\S]*?task:\s*NormalizedHarnessTask;[\s\S]*?workspace:\s*ResolvedWorkspace;/,
);
assert.match(
  runHarness,
  /ResolvedWorkspace[\s\S]*?repositoryPath:\s*string;/,
);
assert.match(
  runHarness,
  /HarnessRunResult[\s\S]*?state:\s*DevStateType;[\s\S]*?telemetry:\s*RunTelemetry;[\s\S]*?persistedTelemetry:\s*PersistedRunTelemetry;/,
);
assert.doesNotMatch(
  runHarness,
  /benchmarks\//,
  "runHarness must remain unaware of benchmark origin and scoring",
);
assert.match(
  runHarness,
  /await\s+import\(["']\.\.\/graph\.js["']\)/,
  "runHarness remains the single application handoff to the public graph boundary",
);

// Runner infrastructure can inject persistence instead of changing runHarness
// or allowing benchmark concerns into the graph.
assert.match(runHarness, /createTelemetryStore\?:\s*\(\)\s*=>\s*RunTelemetryStore/);
assert.match(runHarness, /dependencies\.createTelemetryStore/);

// Current benchmark acceptance consumes exactly four observation concepts.
for (const field of [
  "finalOutcome",
  "filesChanged",
  "validationPassed",
  "humanInterventionRequired",
]) {
  assert.match(
    benchmarkAcceptance,
    new RegExp(`\\b${field}\\b`),
    `BenchmarkRunObservation must expose ${field}.`,
  );
}

for (const failure of [
  "unexpected_outcome",
  "unexpected_changes",
  "validation_failed",
  "human_intervention_required",
]) {
  assert.match(benchmarkAcceptance, new RegExp(`["']${failure}["']`));
}

// Run telemetry already supplies changed-file evidence, but its terminal status
// is execution status, not the benchmark planning outcome. H0-003 must not
// conflate these two concepts.
assert.match(
  telemetryContracts,
  /RunFileTelemetry[\s\S]*?changed:\s*readonly string\[\];/,
);
assert.match(
  telemetryContracts,
  /RunTelemetryFinalStatus\s*=\s*["']completed["']\s*\|\s*["']failed["']/,
);
assert.doesNotMatch(
  telemetryContracts,
  /changes_required|already_satisfied|blocked/,
  "benchmark outcome must not be fabricated from telemetry finalStatus",
);

// validationPassed and humanInterventionRequired are not application-run
// outputs today; they therefore remain future Benchmark Runner observations.
assert.doesNotMatch(runHarness, /validationPassed/);
assert.doesNotMatch(runHarness, /humanInterventionRequired/);

// Default telemetry persistence is process-root based. The future isolated
// benchmark runner may inject a store, but workspace resolution itself remains
// outside telemetry and outside runHarness.
assert.match(
  telemetryStore,
  /options\.rootDirectory\s*\?\?\s*process\.cwd\(\)/,
);
assert.doesNotMatch(telemetryStore, /repository\.id|revision|worktree/);

console.log(
  "✅ H0-003 Step 1 benchmark runner boundary characterization passed.",
);
