import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import {
  access,
  mkdir,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";

import { aggregateBenchmarkSuite } from "./aggregation.js";
import { BENCHMARK_CASE_IDS, benchmarkCases } from "./cases.js";
import {
  B04_SOURCE_COMMIT,
  B05_SOURCE_COMMIT,
  materializeBenchmarkFixtures,
  type BenchmarkFixtureRepositoryId,
  type MaterializedBenchmarkFixture,
} from "./fixture-materializer.js";
import { GitWorktreeBenchmarkWorkspaceResolver } from "./git-worktree-workspace.js";
import { LocalBenchmarkFixtureLocator } from "./local-fixture-locator.js";
import {
  DisposablePostgresBenchmarkEnvironmentPreparer,
  PsqlPostgresAdminCommandRunner,
} from "./postgres-environment.js";
import {
  createBenchmarkComparisonReport,
  renderBenchmarkComparisonReportMarkdown,
  type BenchmarkComparisonReport,
} from "./report.js";
import { runCompleteBenchmark } from "./complete-runner.js";
import {
  runBenchmarkSuite,
  type BenchmarkComparisonStore,
  type BenchmarkSuiteRunResult,
  type BenchmarkSuiteTaskResult,
} from "./suite-runner.js";
import type { LlmRole } from "../providers/runtime-composition.js";

const execFileAsync = promisify(execFile);

export const H0_004_BASELINE_CAPTURE_SCHEMA_VERSION = 1 as const;
export const H0_004_BASELINE_DIRECTORY = ".benchmark-results/h0-004";
export const H0_004_BASELINE_JSON = "baseline.json";
export const H0_004_BASELINE_MARKDOWN = "baseline.md";

export type BenchmarkRuntimeRoleCapture = Readonly<{
  provider: string;
  model: string;
}>;

export type BenchmarkRuntimeCapture = Readonly<{
  roles: Readonly<Record<LlmRole, BenchmarkRuntimeRoleCapture>>;
}>;

export type BenchmarkFixtureCapture = Readonly<{
  benchmarkId: string;
  repositoryId: string;
  revision: string;
  commit: string;
  sourceRevision: string | null;
}>;

export type BenchmarkBaselinePreflightEvidence = Readonly<{
  harness: Readonly<{
    repositoryPath: string;
    gitRevision: string;
    packageVersion: string;
  }>;
  runtime: BenchmarkRuntimeCapture;
  fixtures: readonly BenchmarkFixtureCapture[];
  artifactDirectory: string;
}>;

export type BenchmarkComparisonCapture = Readonly<{
  schemaVersion: typeof H0_004_BASELINE_CAPTURE_SCHEMA_VERSION;
  capturedAt: string;
  harness: Readonly<{
    gitRevision: string;
    packageVersion: string;
  }>;
  runtime: BenchmarkRuntimeCapture;
  fixtures: readonly BenchmarkFixtureCapture[];
  report: BenchmarkComparisonReport;
}>;

export type BenchmarkBaselineArtifactPaths = Readonly<{
  jsonPath: string;
  markdownPath: string;
}>;

export type BenchmarkBaselineCaptureResult = Readonly<{
  capture: BenchmarkComparisonCapture;
  artifacts: BenchmarkBaselineArtifactPaths;
}>;

export type BenchmarkBaselinePersistenceRequest = Readonly<{
  artifactDirectory: string;
  capture: BenchmarkComparisonCapture;
}>;

export type BenchmarkBaselineDependencies = Readonly<{
  preflight: () => Promise<BenchmarkBaselinePreflightEvidence>;
  runSuite: () => Promise<BenchmarkSuiteRunResult>;
  now?: () => Date;
  persistCapture?: (
    request: BenchmarkBaselinePersistenceRequest,
  ) => Promise<BenchmarkBaselineArtifactPaths>;
}>;

function fixtureSourceRevision(
  repositoryId: BenchmarkFixtureRepositoryId,
): string | null {
  if (repositoryId === "qflow-workflow-canvas") {
    return B04_SOURCE_COMMIT;
  }

  if (repositoryId === "qos-harness-architecture") {
    return B05_SOURCE_COMMIT;
  }

  return null;
}

function captureFixtures(
  fixtures: readonly MaterializedBenchmarkFixture[],
): readonly BenchmarkFixtureCapture[] {
  const byRepositoryId = new Map(
    fixtures.map((fixture) => [fixture.repositoryId, fixture]),
  );

  return benchmarkCases.map((benchmark) => {
    const fixture = byRepositoryId.get(
      benchmark.repository.id as BenchmarkFixtureRepositoryId,
    );

    if (!fixture) {
      throw new Error(
        `Materialized fixture missing for benchmark ${benchmark.id}: ${benchmark.repository.id}`,
      );
    }

    return {
      benchmarkId: benchmark.id,
      repositoryId: fixture.repositoryId,
      revision: fixture.revision,
      commit: fixture.commit,
      sourceRevision: fixtureSourceRevision(fixture.repositoryId),
    };
  });
}

function assertFixedSuiteResult(suite: BenchmarkSuiteRunResult): void {
  const actualIds = suite.tasks.map((task) => task.benchmarkId);

  if (
    actualIds.length !== BENCHMARK_CASE_IDS.length ||
    actualIds.some((id, index) => id !== BENCHMARK_CASE_IDS[index])
  ) {
    throw new Error(
      [
        "H0-004 baseline suite did not return the fixed B01-B05 order.",
        `Expected: ${BENCHMARK_CASE_IDS.join(",")}`,
        `Actual: ${actualIds.join(",")}`,
      ].join(" "),
    );
  }
}

export function createBenchmarkComparisonCapture(
  evidence: BenchmarkBaselinePreflightEvidence,
  suite: BenchmarkSuiteRunResult,
  capturedAt: string,
): BenchmarkComparisonCapture {
  assertFixedSuiteResult(suite);

  const aggregation = aggregateBenchmarkSuite(suite);
  const report = createBenchmarkComparisonReport({
    suiteRun: suite,
    aggregation,
  });

  return {
    schemaVersion: H0_004_BASELINE_CAPTURE_SCHEMA_VERSION,
    capturedAt,
    harness: {
      gitRevision: evidence.harness.gitRevision,
      packageVersion: evidence.harness.packageVersion,
    },
    runtime: evidence.runtime,
    fixtures: evidence.fixtures,
    report,
  };
}

export function renderBenchmarkComparisonCaptureJson(
  capture: BenchmarkComparisonCapture,
): string {
  return `${JSON.stringify(capture, null, 2)}\n`;
}

export function renderBenchmarkComparisonCaptureMarkdown(
  capture: BenchmarkComparisonCapture,
): string {
  const roles: readonly LlmRole[] = ["planner", "reviewer", "refiner"];

  const lines = [
    "# H0-004 Baseline Capture",
    "",
    `Capture schema version: ${capture.schemaVersion}`,
    `Captured at: ${capture.capturedAt}`,
    `Harness git revision: ${capture.harness.gitRevision}`,
    `Harness package version: ${capture.harness.packageVersion}`,
    "",
    "## Runtime",
    "",
    "Role | Provider | Model",
    "--- | --- | ---",
    ...roles.map((role) => {
      const runtime = capture.runtime.roles[role];
      return `${role} | ${runtime.provider} | ${runtime.model}`;
    }),
    "",
    "## Fixtures",
    "",
    "Benchmark | Repository | Revision | Commit | Historical source revision",
    "--- | --- | --- | --- | ---",
    ...capture.fixtures.map(
      (fixture) =>
        `${fixture.benchmarkId} | ${fixture.repositoryId} | ${fixture.revision} | ${fixture.commit} | ${fixture.sourceRevision ?? "n/a"}`,
    ),
    "",
    "---",
    "",
    renderBenchmarkComparisonReportMarkdown(capture.report).trimEnd(),
  ];

  return `${lines.join("\n")}\n`;
}

export async function persistBenchmarkComparisonCapture(
  request: BenchmarkBaselinePersistenceRequest,
): Promise<BenchmarkBaselineArtifactPaths> {
  await mkdir(request.artifactDirectory, { recursive: true });

  const jsonPath = join(
    request.artifactDirectory,
    H0_004_BASELINE_JSON,
  );
  const markdownPath = join(
    request.artifactDirectory,
    H0_004_BASELINE_MARKDOWN,
  );
  const suffix = `${process.pid}-${randomUUID()}`;
  const temporaryJsonPath = join(
    request.artifactDirectory,
    `.${H0_004_BASELINE_JSON}.${suffix}.tmp`,
  );
  const temporaryMarkdownPath = join(
    request.artifactDirectory,
    `.${H0_004_BASELINE_MARKDOWN}.${suffix}.tmp`,
  );

  let jsonRenamed = false;
  let markdownRenamed = false;

  try {
    await writeFile(
      temporaryJsonPath,
      renderBenchmarkComparisonCaptureJson(request.capture),
      { encoding: "utf8", flag: "wx" },
    );
    await writeFile(
      temporaryMarkdownPath,
      renderBenchmarkComparisonCaptureMarkdown(request.capture),
      { encoding: "utf8", flag: "wx" },
    );

    await rename(temporaryJsonPath, jsonPath);
    jsonRenamed = true;

    await rename(temporaryMarkdownPath, markdownPath);
    markdownRenamed = true;

    return {
      jsonPath,
      markdownPath,
    };
  } catch (error) {
    await Promise.allSettled([
      rm(temporaryJsonPath, { force: true }),
      rm(temporaryMarkdownPath, { force: true }),
      ...(jsonRenamed ? [rm(jsonPath, { force: true })] : []),
      ...(markdownRenamed ? [rm(markdownPath, { force: true })] : []),
    ]);

    throw error;
  }
}

export async function runH0BaselineCapture(
  dependencies: BenchmarkBaselineDependencies,
): Promise<BenchmarkBaselineCaptureResult> {
  const evidence = await dependencies.preflight();
  const suite = await dependencies.runSuite();
  assertFixedSuiteResult(suite);

  const capturedAt = (dependencies.now ?? (() => new Date()))().toISOString();
  const capture = createBenchmarkComparisonCapture(
    evidence,
    suite,
    capturedAt,
  );
  const persist =
    dependencies.persistCapture ?? persistBenchmarkComparisonCapture;
  const artifacts = await persist({
    artifactDirectory: evidence.artifactDirectory,
    capture,
  });

  return {
    capture,
    artifacts,
  };
}

type ProcessEnvironment = Readonly<Record<string, string | undefined>>;

function requiredEnvironmentValue(
  env: ProcessEnvironment,
  name: string,
): string {
  const value = env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required for the H0-004 baseline.`);
  }

  return value;
}

async function runGit(
  repositoryPath: string,
  args: readonly string[],
): Promise<string> {
  const result = await execFileAsync(
    "git",
    ["-C", repositoryPath, ...args],
    { encoding: "utf8" },
  );

  return result.stdout.trim();
}

async function assertCleanRepository(
  repositoryPath: string,
): Promise<string> {
  const status = await runGit(repositoryPath, ["status", "--porcelain"]);

  if (status.length > 0) {
    throw new Error(
      "H0-004 baseline requires a clean Harness working tree.",
    );
  }

  const revision = await runGit(repositoryPath, ["rev-parse", "HEAD"]);

  if (!revision) {
    throw new Error("Harness git revision resolved to an empty value.");
  }

  return revision;
}

async function readPackageVersion(repositoryPath: string): Promise<string> {
  const packageJson = JSON.parse(
    await readFile(join(repositoryPath, "package.json"), "utf8"),
  ) as { version?: unknown };

  if (
    typeof packageJson.version !== "string" ||
    packageJson.version.trim().length === 0
  ) {
    throw new Error("Harness package.json has no valid version.");
  }

  return packageJson.version;
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function assertBaselineArtifactsAbsent(
  artifactDirectory: string,
): Promise<void> {
  const jsonPath = join(artifactDirectory, H0_004_BASELINE_JSON);
  const markdownPath = join(
    artifactDirectory,
    H0_004_BASELINE_MARKDOWN,
  );

  if ((await pathExists(jsonPath)) || (await pathExists(markdownPath))) {
    throw new Error(
      "H0-004 canonical baseline artifacts already exist; refusing an implicit rerun.",
    );
  }
}

async function assertArtifactDirectoryWritable(
  artifactDirectory: string,
): Promise<void> {
  await mkdir(artifactDirectory, { recursive: true });
  const probe = join(
    artifactDirectory,
    `.write-probe-${process.pid}-${randomUUID()}`,
  );

  try {
    await writeFile(probe, "ok\n", { encoding: "utf8", flag: "wx" });
  } finally {
    await rm(probe, { force: true });
  }
}

function assertPostgresAdminUrl(value: string): void {
  const parsed = new URL(value);

  if (
    parsed.protocol !== "postgres:" &&
    parsed.protocol !== "postgresql:"
  ) {
    throw new Error(
      "QOS_BENCHMARK_POSTGRES_ADMIN_URL must use postgres:// or postgresql://",
    );
  }
}

async function assertPostgresAdminConnection(
  adminUrl: string,
): Promise<void> {
  const runner = new PsqlPostgresAdminCommandRunner();

  await runner.run({
    adminUrl,
    sql: "SELECT 1;",
  });
}

async function captureDefaultRuntime(
  env: ProcessEnvironment,
): Promise<BenchmarkRuntimeCapture> {
  requiredEnvironmentValue(env, "NVIDIA_API_KEY");

  const [{ defaultLlmRuntimeConfig }, { nvidiaProvider }, runtimeModule] =
    await Promise.all([
      import("../providers/default-composition.js"),
      import("../providers/nvidia.js"),
      import("../providers/runtime-composition.js"),
    ]);

  const roles: readonly LlmRole[] = ["planner", "reviewer", "refiner"];
  const captured = {} as Record<LlmRole, BenchmarkRuntimeRoleCapture>;

  for (const role of roles) {
    const resolved = runtimeModule.resolveLlmRoleRuntime(
      defaultLlmRuntimeConfig,
      role,
    );

    if (resolved.provider !== nvidiaProvider) {
      throw new Error(
        `No stable Step 5 provider identity projection exists for runtime role ${role}.`,
      );
    }

    captured[role] = {
      provider: "nvidia",
      model: resolved.model,
    };
  }

  return {
    roles: captured,
  };
}

export type DefaultH0BaselineOptions = Readonly<{
  harnessRepositoryPath?: string;
  env?: ProcessEnvironment;
}>;

export async function createDefaultH0BaselineDependencies(
  options: DefaultH0BaselineOptions = {},
): Promise<BenchmarkBaselineDependencies> {
  const env = options.env ?? process.env;
  const harnessRepositoryPath = resolve(
    options.harnessRepositoryPath ?? process.cwd(),
  );
  const fixtureRoot = resolve(
    requiredEnvironmentValue(env, "QOS_BENCHMARK_FIXTURE_ROOT"),
  );
  const qflowRepository = resolve(
    requiredEnvironmentValue(env, "QFLOW_REPOSITORY"),
  );
  const historicalHarnessRepository = resolve(
    env.HARNESS_REPOSITORY?.trim() || harnessRepositoryPath,
  );
  const postgresAdminUrl = requiredEnvironmentValue(
    env,
    "QOS_BENCHMARK_POSTGRES_ADMIN_URL",
  );
  const artifactDirectory = join(
    harnessRepositoryPath,
    H0_004_BASELINE_DIRECTORY,
  );

  let preflightEvidence: BenchmarkBaselinePreflightEvidence | undefined;

  const preflight = async (): Promise<BenchmarkBaselinePreflightEvidence> => {
    const gitRevision = await assertCleanRepository(
      harnessRepositoryPath,
    );
    const packageVersion = await readPackageVersion(
      harnessRepositoryPath,
    );

    await assertBaselineArtifactsAbsent(artifactDirectory);
    assertPostgresAdminUrl(postgresAdminUrl);
    await assertPostgresAdminConnection(postgresAdminUrl);

    const runtime = await captureDefaultRuntime(env);

    const materializedFixtures = await materializeBenchmarkFixtures({
      fixtureRoot,
      qflowSource: {
        repositoryPath: qflowRepository,
        revision: B04_SOURCE_COMMIT,
      },
      harnessSource: {
        repositoryPath: historicalHarnessRepository,
        revision: B05_SOURCE_COMMIT,
      },
    });

    await assertArtifactDirectoryWritable(artifactDirectory);

    preflightEvidence = {
      harness: {
        repositoryPath: harnessRepositoryPath,
        gitRevision,
        packageVersion,
      },
      runtime,
      fixtures: captureFixtures(materializedFixtures),
      artifactDirectory,
    };

    return preflightEvidence;
  };

  const runSuite = async (): Promise<BenchmarkSuiteRunResult> => {
    if (!preflightEvidence) {
      throw new Error(
        "H0-004 baseline suite cannot execute before successful preflight.",
      );
    }

    const workspaceRoot = await import("node:fs/promises").then(
      ({ mkdtemp }) =>
        mkdtemp(join(tmpdir(), "qos-h0-004-workspaces-")),
    );

    const storedResults: BenchmarkSuiteTaskResult[] = [];
    const store: BenchmarkComparisonStore = {
      saveTaskResult: async (result) => {
        storedResults.push(result);
      },
    };

    try {
      const workspaceResolver =
        new GitWorktreeBenchmarkWorkspaceResolver({
          repositoryLocator: new LocalBenchmarkFixtureLocator(
            fixtureRoot,
          ),
          workspaceRoot,
        });
      const environmentPreparer =
        new DisposablePostgresBenchmarkEnvironmentPreparer({
          env: {
            ...process.env,
            QOS_BENCHMARK_POSTGRES_ADMIN_URL: postgresAdminUrl,
          },
        });

      const suite = await runBenchmarkSuite({
        benchmarks: benchmarkCases,
        store,
        runBenchmark: (benchmark) =>
          runCompleteBenchmark(benchmark, {
            workspaceResolver,
            environmentPreparer,
          }),
      });

      if (storedResults.length !== suite.tasks.length) {
        throw new Error(
          "Benchmark suite store did not receive every Step 5 task result.",
        );
      }

      return suite;
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  };

  return {
    preflight,
    runSuite,
  };
}

export async function runDefaultH0BaselineCapture(
  options: DefaultH0BaselineOptions = {},
): Promise<BenchmarkBaselineCaptureResult> {
  const dependencies = await createDefaultH0BaselineDependencies(options);
  return runH0BaselineCapture(dependencies);
}
