import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import {
  B04_HERMETICITY_OVERLAY_PATH,
  BENCHMARK_FIXTURE_REVISIONS,
  materializeBenchmarkFixtures,
} from "./benchmarks/fixture-materializer.js";
import { LocalBenchmarkFixtureLocator } from "./benchmarks/local-fixture-locator.js";

const execFileAsync = promisify(execFile);
const root = await mkdtemp(join(tmpdir(), "qos-benchmark-fixtures-test-"));

async function createHistoricalSource(name: string): Promise<{
  repositoryPath: string;
  revision: string;
}> {
  const repositoryPath = join(root, `${name}-source`);
  await execFileAsync("git", ["init", "-b", "main", repositoryPath]);
  await execFileAsync("git", ["-C", repositoryPath, "config", "user.email", "test@example.com"]);
  await execFileAsync("git", ["-C", repositoryPath, "config", "user.name", "Fixture Test"]);
  await writeFile(join(repositoryPath, "package.json"), '{"name":"historical-fixture","private":true}\n');
  await writeFile(join(repositoryPath, `${name}.txt`), `${name} baseline\n`);

  if (name === "qflow") {
    const billingTestPath = join(repositoryPath, B04_HERMETICITY_OVERLAY_PATH);
    await mkdir(join(repositoryPath, "src/tests/e2e"), { recursive: true });
    await writeFile(
      billingTestPath,
      `import { prepareTestDatabase } from "@/lib/db/test-helpers";

let db: any;

async function beforeEachBillingPipeline() {
    await prepareTestDatabase();

    // The overlay must not depend on exact adjacency to prepareTestDatabase().
    db = getDb();

    return db;
}
`,
    );
  }
  await execFileAsync("git", ["-C", repositoryPath, "add", "-A"]);
  await execFileAsync("git", ["-C", repositoryPath, "commit", "-m", `${name} baseline`]);
  const { stdout } = await execFileAsync("git", ["-C", repositoryPath, "rev-parse", "HEAD"], {
    encoding: "utf8",
  });
  return { repositoryPath, revision: stdout.trim() };
}

const qflowSource = await createHistoricalSource("qflow");
const harnessSource = await createHistoricalSource("harness");
const fixtureRoot = join(root, "materialized");

const first = await materializeBenchmarkFixtures({
  fixtureRoot,
  qflowSource,
  harnessSource,
});

assert.deepEqual(
  first.map((fixture) => fixture.repositoryId),
  Object.keys(BENCHMARK_FIXTURE_REVISIONS),
);

const locator = new LocalBenchmarkFixtureLocator(fixtureRoot);

for (const fixture of first) {
  assert.equal(await locator.locate(fixture.repositoryId), fixture.repositoryPath);

  const { stdout: revision } = await execFileAsync(
    "git",
    ["-C", fixture.repositoryPath, "rev-parse", `${fixture.revision}^{commit}`],
    { encoding: "utf8" },
  );
  assert.equal(revision.trim(), fixture.commit);

  const { stdout: status } = await execFileAsync(
    "git",
    ["-C", fixture.repositoryPath, "status", "--porcelain"],
    { encoding: "utf8" },
  );
  assert.equal(status, "");
}

const second = await materializeBenchmarkFixtures({
  fixtureRoot,
  qflowSource,
  harnessSource,
});

assert.deepEqual(second, first, "materialization must be idempotent");

const b01Path = await locator.locate("fixture-simple-api");
const b02Path = await locator.locate("fixture-health-already-present");
const b03Path = await locator.locate("fixture-component-app");

const b04Path = await locator.locate("qflow-workflow-canvas");
const b05Path = await locator.locate("qos-harness-architecture");

const b04Overlay = await readFile(
  join(b04Path, B04_HERMETICITY_OVERLAY_PATH),
  "utf8",
);

assert.match(
  b04Overlay,
  /syncPluginRegistry\(db\)/,
  "B04 overlay must explicitly synchronize the historical plugin registry",
);
assert.match(
  b04Overlay,
  /workflowExecutionStatuses/,
  "B04 overlay must establish workflow execution status lookups",
);
assert.match(
  b04Overlay,
  /nodeExecutionStatuses/,
  "B04 overlay must establish node execution status lookups",
);
assert.match(
  b04Overlay,
  /executionModes/,
  "B04 overlay must establish the historical execution mode prerequisite",
);
assert.match(
  b04Overlay,
  /\["pending", "running", "completed", "failed", "cancelled"\]/,
);
assert.match(
  b04Overlay,
  /\["pending", "running", "succeeded", "failed", "cancelled"\]/,
);
assert.match(
  b04Overlay,
  /name: "production", slug: "production"/,
  "B04 execution mode must use the historical production lookup",
);
assert.match(
  b04Overlay,
  /onConflictDoNothing/,
  "B04 lookup prerequisites must remain idempotent",
);

const historicalB04Source = await readFile(
  join(qflowSource.repositoryPath, B04_HERMETICITY_OVERLAY_PATH),
  "utf8",
);
assert.notEqual(
  b04Overlay,
  historicalB04Source,
  "B04 materialization must apply an explicit hermeticity overlay",
);

assert.equal(
  await readFile(join(b05Path, "harness.txt"), "utf8"),
  "harness baseline\n",
  "B05 historical snapshot must remain unchanged by the B04 overlay",
);

await execFileAsync("npm", ["run", "typecheck"], { cwd: b01Path });
await execFileAsync("npm", ["test"], { cwd: b01Path });
await execFileAsync("npm", ["run", "typecheck"], { cwd: b02Path });
await execFileAsync("npm", ["test"], { cwd: b02Path });
await execFileAsync("npm", ["run", "typecheck"], { cwd: b03Path });
await execFileAsync("npm", ["test"], { cwd: b03Path });

const metadataPath = join(
  fixtureRoot,
  "fixture-simple-api.fixture.json",
);
const metadata = JSON.parse(await readFile(metadataPath, "utf8")) as {
  sourceRevision: string | null;
};
assert.equal(metadata.sourceRevision, null);

const b04Metadata = JSON.parse(
  await readFile(
    join(fixtureRoot, "qflow-workflow-canvas.fixture.json"),
    "utf8",
  ),
) as {
  sourceRevision: string | null;
};

assert.equal(
  b04Metadata.sourceRevision,
  qflowSource.revision,
  "B04 metadata must preserve the frozen historical source revision",
);

await writeFile(
  join(qflowSource.repositoryPath, "qflow.txt"),
  "qflow changed historical source\n",
);
await execFileAsync("git", [
  "-C",
  qflowSource.repositoryPath,
  "add",
  "qflow.txt",
]);
await execFileAsync("git", [
  "-C",
  qflowSource.repositoryPath,
  "commit",
  "-m",
  "qflow changed historical source",
]);
const { stdout: changedQflowRevision } = await execFileAsync(
  "git",
  ["-C", qflowSource.repositoryPath, "rev-parse", "HEAD"],
  { encoding: "utf8" },
);

await assert.rejects(
  materializeBenchmarkFixtures({
    fixtureRoot,
    qflowSource: {
      repositoryPath: qflowSource.repositoryPath,
      revision: changedQflowRevision.trim(),
    },
    harnessSource,
  }),
  /does not match its recorded baseline/,
  "historical fixture reuse must reject a different requested source revision",
);

await writeFile(join(b01Path, "tampered.txt"), "tampered\n");

await assert.rejects(
  materializeBenchmarkFixtures({
    fixtureRoot,
    qflowSource,
    harnessSource,
  }),
  /does not match its recorded baseline/,
);

await assert.rejects(
  locator.locate("unknown-repository"),
  /Unknown benchmark fixture repository/,
);

console.log("✅ H0-004 Step 2A benchmark fixture materialization passed.");
