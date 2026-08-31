import { strict as assert } from "node:assert";
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

import {
  H0_004_BASELINE_DIRECTORY,
  resolveH0BaselineArtifactDirectory,
} from "./benchmarks/real-suite.js";

const repositoryRoot = resolve(process.cwd());

function testDefaultArtifactDirectory(): void {
  assert.equal(
    resolveH0BaselineArtifactDirectory({}, repositoryRoot),
    resolve(repositoryRoot, H0_004_BASELINE_DIRECTORY),
  );
}

function testExplicitArtifactDirectory(): void {
  const absolute = join(
    homedir(),
    ".cache",
    "qos-harness",
    "measurements",
    "h0-004a",
    "deadbeef",
  );

  assert.equal(
    resolveH0BaselineArtifactDirectory(
      { artifactDirectory: absolute },
      repositoryRoot,
    ),
    resolve(absolute),
  );

  assert.equal(
    resolveH0BaselineArtifactDirectory(
      { artifactDirectory: "./external-measurement" },
      repositoryRoot,
    ),
    resolve("./external-measurement"),
  );
}

async function testImplementationWiring(): Promise<void> {
  const [realSuiteSource, scriptSource, packageSource] = await Promise.all([
    readFile(join(repositoryRoot, "src/benchmarks/real-suite.ts"), "utf8"),
    readFile(
      join(repositoryRoot, "scripts/run-h0-004a-remeasurement.ts"),
      "utf8",
    ),
    readFile(join(repositoryRoot, "package.json"), "utf8"),
  ]);

  assert.match(
    realSuiteSource,
    /const gitRevision = await assertCleanRepository\([\s\S]*?await assertBaselineArtifactsAbsent\(artifactDirectory\)/,
  );
  assert.match(
    realSuiteSource,
    /const artifactDirectory = resolveH0BaselineArtifactDirectory\(\s*options,\s*harnessRepositoryPath,?\s*\)/,
  );
  assert.match(
    scriptSource,
    /\.cache[\s\S]*qos-harness[\s\S]*measurements[\s\S]*h0-004a[\s\S]*gitRevision/,
  );
  assert.match(
    scriptSource,
    /runDefaultH0BaselineCapture\(\{[\s\S]*harnessRepositoryPath,[\s\S]*artifactDirectory,[\s\S]*\}\)/,
  );
  assert.match(
    scriptSource,
    /result\.capture\.harness\.gitRevision !== gitRevision/,
  );
  assert.doesNotMatch(scriptSource, /for\s*\(|while\s*\(|do\s*\{/);
  assert.doesNotMatch(scriptSource, /benchmark:h0-004-baseline/);

  const packageJson = JSON.parse(packageSource) as {
    scripts?: Record<string, string>;
  };

  assert.equal(
    packageJson.scripts?.["benchmark:h0-004-baseline"],
    "node --env-file=.env --import tsx scripts/run-h0-004-baseline.ts",
  );
  assert.equal(
    packageJson.scripts?.["benchmark:h0-004a-remeasurement"],
    "node --env-file=.env --import tsx scripts/run-h0-004a-remeasurement.ts",
  );
  assert.equal(
    packageJson.scripts?.["test:h0-004a-remeasurement-boundary"],
    "tsx src/test-h0-004a-remeasurement-boundary.ts",
  );
}

async function main(): Promise<void> {
  testDefaultArtifactDirectory();
  testExplicitArtifactDirectory();
  await testImplementationWiring();
  console.log("H0-004A remeasurement boundary tests passed.");
}

await main();
