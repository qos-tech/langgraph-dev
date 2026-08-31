import { execFile } from "node:child_process";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";

import { runDefaultH0BaselineCapture } from "../src/benchmarks/real-suite.js";

const execFileAsync = promisify(execFile);

async function readGitRevision(repositoryPath: string): Promise<string> {
  const result = await execFileAsync(
    "git",
    ["-C", repositoryPath, "rev-parse", "HEAD"],
    { encoding: "utf8" },
  );

  const revision = result.stdout.trim();

  if (!revision) {
    throw new Error("H0-004A remeasurement resolved an empty Harness git revision.");
  }

  return revision;
}

try {
  const harnessRepositoryPath = resolve(process.cwd());
  const gitRevision = await readGitRevision(harnessRepositoryPath);
  const artifactDirectory = join(
    homedir(),
    ".cache",
    "qos-harness",
    "measurements",
    "h0-004a",
    gitRevision,
  );

  const result = await runDefaultH0BaselineCapture({
    harnessRepositoryPath,
    artifactDirectory,
  });

  if (result.capture.harness.gitRevision !== gitRevision) {
    throw new Error(
      [
        "H0-004A measurement identity mismatch.",
        `Artifact directory revision: ${gitRevision}`,
        `Captured revision: ${result.capture.harness.gitRevision}`,
      ].join(" "),
    );
  }

  console.log("H0-004A controlled remeasurement captured.");
  console.log(`Implementation SHA: ${gitRevision}`);
  console.log(`JSON: ${result.artifacts.jsonPath}`);
  console.log(`Markdown: ${result.artifacts.markdownPath}`);
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
