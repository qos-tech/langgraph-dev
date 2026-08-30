import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export const B04_SOURCE_COMMIT =
  "986051f70be5ea06323d4dd508a5465b797a5396";
export const B05_SOURCE_COMMIT =
  "4329623bb82bda660c245074739617e662ff3b68";

export const BENCHMARK_FIXTURE_REVISIONS = Object.freeze({
  "fixture-simple-api": "b01-v1",
  "fixture-health-already-present": "b02-v1",
  "fixture-component-app": "b03-v1",
  "qflow-workflow-canvas": "b04-v1",
  "qos-harness-architecture": "b05-v1",
} as const);

export type BenchmarkFixtureRepositoryId =
  keyof typeof BENCHMARK_FIXTURE_REVISIONS;

export type HistoricalFixtureSource = Readonly<{
  repositoryPath: string;
  revision: string;
}>;

export type BenchmarkFixtureMaterializationRequest = Readonly<{
  fixtureRoot: string;
  qflowSource: HistoricalFixtureSource;
  harnessSource: HistoricalFixtureSource;
}>;

export type MaterializedBenchmarkFixture = Readonly<{
  repositoryId: BenchmarkFixtureRepositoryId;
  repositoryPath: string;
  revision: string;
  commit: string;
}>;

type FixtureBlueprint = Readonly<{
  repositoryId: BenchmarkFixtureRepositoryId;
  revision: string;
  files?: Readonly<Record<string, string>>;
  historicalSource?: HistoricalFixtureSource;
}>;

export const B04_HERMETICITY_OVERLAY_PATH =
  "src/tests/e2e/billing-pipeline.spec.ts";

const B04_HERMETICITY_SETUP = `    await syncPluginRegistry(db);

    for (const slug of ["pending", "running", "completed", "failed", "cancelled"]) {
      await db
        .insert(workflowExecutionStatuses)
        .values({ name: slug, slug })
        .onConflictDoNothing({ target: workflowExecutionStatuses.slug });
    }

    for (const slug of ["pending", "running", "succeeded", "failed", "cancelled"]) {
      await db
        .insert(nodeExecutionStatuses)
        .values({ name: slug, slug })
        .onConflictDoNothing({ target: nodeExecutionStatuses.slug });
    }

    await db
      .insert(executionModes)
      .values({ name: "production", slug: "production" })
      .onConflictDoNothing({ target: executionModes.slug });

`;

const B04_DATABASE_READY_ANCHOR = `    db = getDb();`;

const B04_IMPORT_ANCHOR =
  `import { prepareTestDatabase } from "@/lib/db/test-helpers";
`;

const B04_IMPORT_OVERLAY =
  `import { prepareTestDatabase } from "@/lib/db/test-helpers";
import { executionModes, workflowExecutionStatuses, nodeExecutionStatuses } from "@/lib/db/schema";
import { syncPluginRegistry } from "@/lib/domain/plugin-registry-sync.service";
`;

const FIXED_GIT_ENV = {
  ...process.env,
  GIT_AUTHOR_NAME: "QoS Benchmark Fixtures",
  GIT_AUTHOR_EMAIL: "benchmark-fixtures@qos.invalid",
  GIT_AUTHOR_DATE: "2026-08-29T00:00:00Z",
  GIT_COMMITTER_NAME: "QoS Benchmark Fixtures",
  GIT_COMMITTER_EMAIL: "benchmark-fixtures@qos.invalid",
  GIT_COMMITTER_DATE: "2026-08-29T00:00:00Z",
} as const;

const SIMPLE_API_PACKAGE = `{
  "name": "fixture-simple-api",
  "private": true,
  "type": "module",
  "scripts": {
    "typecheck": "node --check src/app.js && node --check test/app.test.js",
    "test": "node --test"
  }
}
`;

const SIMPLE_API_APP = `import http from "node:http";

export function createApp() {
  return http.createServer((request, response) => {
    if (request.method === "GET" && request.url === "/") {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ service: "fixture-simple-api" }));
      return;
    }

    response.writeHead(404, { "content-type": "application/json" });
    response.end(JSON.stringify({ error: "not_found" }));
  });
}
`;

const SIMPLE_API_TEST = `import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../src/app.js";

test("existing root endpoint remains available", async () => {
  const server = createApp();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

  try {
    const address = server.address();
    assert.ok(address && typeof address === "object");
    const response = await fetch(\`http://127.0.0.1:\${address.port}/\`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { service: "fixture-simple-api" });
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
`;

const HEALTH_APP = `import http from "node:http";

export function createApp() {
  return http.createServer((request, response) => {
    if (request.method === "GET" && request.url === "/health") {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ status: "ok" }));
      return;
    }

    if (request.method === "GET" && request.url === "/") {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ service: "fixture-health-already-present" }));
      return;
    }

    response.writeHead(404, { "content-type": "application/json" });
    response.end(JSON.stringify({ error: "not_found" }));
  });
}
`;

const HEALTH_TEST = `import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../src/app.js";

test("GET /health already returns HTTP 200 JSON", async () => {
  const server = createApp();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

  try {
    const address = server.address();
    assert.ok(address && typeof address === "object");
    const response = await fetch(\`http://127.0.0.1:\${address.port}/health\`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "application/json");
    assert.deepEqual(await response.json(), { status: "ok" });
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
`;

const COMPONENT_PACKAGE = `{
  "name": "fixture-component-app",
  "private": true,
  "type": "module",
  "scripts": {
    "typecheck": "node --check src/status-badge.js && node --check test/status-badge.test.js",
    "test": "node --test"
  }
}
`;

const STATUS_BADGE = `const STATUS_COPY = {
  healthy: {
    text: "Healthy",
    description: "All systems are operating normally.",
  },
  degraded: {
    text: "Degraded",
    description: "Some systems are experiencing reduced performance.",
  },
  offline: {
    text: "Offline",
    description: "The service is currently unavailable.",
  },
};

export function StatusBadge({ status }) {
  const copy = STATUS_COPY[status];

  if (!copy) {
    throw new Error(\`Unknown status: \${status}\`);
  }

  return \`<div class="status-badge" data-status="\${status}"><span role="status">\${copy.text}</span><span class="status-description">\${copy.description}</span></div>\`;
}
`;

const STATUS_BADGE_TEST = `import assert from "node:assert/strict";
import test from "node:test";
import { StatusBadge } from "../src/status-badge.js";

test("renders semantic status text and secondary description", () => {
  assert.equal(
    StatusBadge({ status: "healthy" }),
    '<div class="status-badge" data-status="healthy"><span role="status">Healthy</span><span class="status-description">All systems are operating normally.</span></div>',
  );
});

test("preserves other public statuses", () => {
  assert.match(StatusBadge({ status: "degraded" }), /role="status">Degraded/);
  assert.match(StatusBadge({ status: "offline" }), /role="status">Offline/);
});
`;

async function runGit(
  repositoryPath: string,
  args: readonly string[],
): Promise<string> {
  const result = await execFileAsync("git", ["-C", repositoryPath, ...args], {
    encoding: "utf8",
    env: FIXED_GIT_ENV,
  });
  return result.stdout.trim();
}

async function writeFixtureFiles(
  repositoryPath: string,
  files: Readonly<Record<string, string>>,
): Promise<void> {
  for (const [relativePath, content] of Object.entries(files)) {
    const target = join(repositoryPath, relativePath);
    await mkdir(resolve(target, ".."), { recursive: true });
    await writeFile(target, content, "utf8");
  }
}

async function copyHistoricalSnapshot(
  source: HistoricalFixtureSource,
  targetPath: string,
): Promise<void> {
  await runGit(source.repositoryPath, [
    "rev-parse",
    "--verify",
    "--end-of-options",
    `${source.revision}^{commit}`,
  ]);

  const archiveRoot = await mkdtemp(join(tmpdir(), "qos-benchmark-archive-"));
  const archivePath = join(archiveRoot, "snapshot.tar");

  try {
    await execFileAsync(
      "git",
      [
        "-C",
        source.repositoryPath,
        "archive",
        "--format=tar",
        "--output",
        archivePath,
        source.revision,
      ],
      { env: FIXED_GIT_ENV },
    );
    await execFileAsync("tar", ["-xf", archivePath, "-C", targetPath]);
  } finally {
    await rm(archiveRoot, { recursive: true, force: true });
  }
}

async function treeFingerprint(repositoryPath: string, revision: string): Promise<string> {
  return runGit(repositoryPath, ["rev-parse", `${revision}^{tree}`]);
}

async function applyB04HermeticityOverlay(
  repositoryPath: string,
): Promise<void> {
  const targetPath = join(repositoryPath, B04_HERMETICITY_OVERLAY_PATH);
  const original = await readFile(targetPath, "utf8");

  if (!original.includes(B04_IMPORT_ANCHOR)) {
    throw new Error(
      `B04 hermeticity overlay import anchor not found in ${B04_HERMETICITY_OVERLAY_PATH}.`,
    );
  }

  const databaseReadyAnchorCount = original.split(
    B04_DATABASE_READY_ANCHOR,
  ).length - 1;

  if (databaseReadyAnchorCount !== 1) {
    throw new Error(
      `B04 hermeticity overlay expected exactly one database-ready anchor in ${B04_HERMETICITY_OVERLAY_PATH}, found ${databaseReadyAnchorCount}.`,
    );
  }

  const withImports = original.replace(B04_IMPORT_ANCHOR, B04_IMPORT_OVERLAY);
  const overlaid = withImports.replace(
    B04_DATABASE_READY_ANCHOR,
    `${B04_DATABASE_READY_ANCHOR}

${B04_HERMETICITY_SETUP}`,
  );

  await writeFile(targetPath, overlaid, "utf8");
}

async function materializeBlueprint(
  fixtureRoot: string,
  blueprint: FixtureBlueprint,
): Promise<MaterializedBenchmarkFixture> {
  const repositoryPath = join(fixtureRoot, blueprint.repositoryId);
  const metadataPath = join(fixtureRoot, `${blueprint.repositoryId}.fixture.json`);

  try {
    const metadata = JSON.parse(await readFile(metadataPath, "utf8")) as {
      revision?: string;
      commit?: string;
      tree?: string;
      sourceRevision?: string | null;
    };
    const expectedSourceRevision = blueprint.historicalSource?.revision ?? null;

    const commit = await runGit(repositoryPath, [
      "rev-parse",
      "--verify",
      "--end-of-options",
      `${blueprint.revision}^{commit}`,
    ]);
    const tree = await treeFingerprint(repositoryPath, blueprint.revision);
    const status = await runGit(repositoryPath, ["status", "--porcelain"]);

    if (
      metadata.revision !== blueprint.revision ||
      metadata.commit !== commit ||
      metadata.tree !== tree ||
      metadata.sourceRevision !== expectedSourceRevision ||
      status.length > 0
    ) {
      throw new Error(
        `Existing benchmark fixture ${blueprint.repositoryId} does not match its recorded baseline.`,
      );
    }

    return {
      repositoryId: blueprint.repositoryId,
      repositoryPath,
      revision: blueprint.revision,
      commit,
    };
  } catch (error) {
    const exists = await readdir(fixtureRoot).then(
      (entries) =>
        entries.includes(basename(repositoryPath)) ||
        entries.includes(basename(metadataPath)),
      () => false,
    );

    if (exists) {
      throw error;
    }
  }

  await mkdir(repositoryPath, { recursive: false });

  if (blueprint.files) {
    await writeFixtureFiles(repositoryPath, blueprint.files);
  } else if (blueprint.historicalSource) {
    await copyHistoricalSnapshot(blueprint.historicalSource, repositoryPath);

    if (blueprint.repositoryId === "qflow-workflow-canvas") {
      await applyB04HermeticityOverlay(repositoryPath);
    }
  } else {
    throw new Error(`Fixture ${blueprint.repositoryId} has no source blueprint.`);
  }

  await execFileAsync("git", ["init", "-b", "main", repositoryPath], {
    env: FIXED_GIT_ENV,
  });
  await runGit(repositoryPath, ["add", "-A"]);
  await runGit(repositoryPath, [
    "commit",
    "-m",
    `benchmark fixture ${blueprint.repositoryId} ${blueprint.revision}`,
  ]);
  await runGit(repositoryPath, ["tag", blueprint.revision]);

  const commit = await runGit(repositoryPath, [
    "rev-parse",
    `${blueprint.revision}^{commit}`,
  ]);
  const tree = await treeFingerprint(repositoryPath, blueprint.revision);

  await writeFile(
    metadataPath,
    `${JSON.stringify(
      {
        repositoryId: blueprint.repositoryId,
        revision: blueprint.revision,
        commit,
        tree,
        sourceRevision: blueprint.historicalSource?.revision ?? null,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  return {
    repositoryId: blueprint.repositoryId,
    repositoryPath,
    revision: blueprint.revision,
    commit,
  };
}

export async function materializeBenchmarkFixtures(
  request: BenchmarkFixtureMaterializationRequest,
): Promise<readonly MaterializedBenchmarkFixture[]> {
  const fixtureRoot = resolve(request.fixtureRoot);
  await mkdir(fixtureRoot, { recursive: true });

  const blueprints: readonly FixtureBlueprint[] = [
    {
      repositoryId: "fixture-simple-api",
      revision: "b01-v1",
      files: {
        "package.json": SIMPLE_API_PACKAGE,
        "src/app.js": SIMPLE_API_APP,
        "test/app.test.js": SIMPLE_API_TEST,
      },
    },
    {
      repositoryId: "fixture-health-already-present",
      revision: "b02-v1",
      files: {
        "package.json": SIMPLE_API_PACKAGE.replace(
          "fixture-simple-api",
          "fixture-health-already-present",
        ),
        "src/app.js": HEALTH_APP,
        "test/app.test.js": HEALTH_TEST,
      },
    },
    {
      repositoryId: "fixture-component-app",
      revision: "b03-v1",
      files: {
        "package.json": COMPONENT_PACKAGE,
        "src/status-badge.js": STATUS_BADGE,
        "test/status-badge.test.js": STATUS_BADGE_TEST,
      },
    },
    {
      repositoryId: "qflow-workflow-canvas",
      revision: "b04-v1",
      historicalSource: request.qflowSource,
    },
    {
      repositoryId: "qos-harness-architecture",
      revision: "b05-v1",
      historicalSource: request.harnessSource,
    },
  ];

  const materialized: MaterializedBenchmarkFixture[] = [];
  for (const blueprint of blueprints) {
    materialized.push(await materializeBlueprint(fixtureRoot, blueprint));
  }

  return materialized;
}
