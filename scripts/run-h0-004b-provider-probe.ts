import { execFileSync } from "node:child_process";
import { access, mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

import {
  H0_004B_PROBE_MAX_OUTPUT_TOKENS,
  H0_004B_PROBE_MODELS,
  H0_004B_PROBE_ROUNDS,
  H0_004B_PROBE_TIMEOUT_MS,
  H0_004B_PROBE_TRANSPORT_RETRIES,
  runProviderReliabilityProbe,
} from "../src/benchmarks/provider-reliability-probe.js";
import { nvidiaProvider } from "../src/providers/nvidia.js";

function git(args: readonly string[]): string {
  return execFileSync("git", args, {
    cwd: process.cwd(),
    encoding: "utf8",
  }).trim();
}

async function main(): Promise<void> {
  const gitRevision = git(["rev-parse", "HEAD"]);
  const worktreeStatus = git(["status", "--porcelain"]);

  if (worktreeStatus.length > 0) {
    throw new Error(
      "H0-004B live probe requires a clean Harness worktree. Commit the probe implementation before running it.",
    );
  }

  const artifactDirectory = join(
    homedir(),
    ".cache",
    "qos-harness",
    "probes",
    "h0-004b",
    gitRevision,
  );
  const artifactPath = join(artifactDirectory, "probe.json");

  try {
    await access(artifactPath);

    throw new Error(
      `H0-004B probe artifact already exists for this SHA: ${artifactPath}`,
    );
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      // Expected: this SHA has not been probed yet.
    } else {
      throw error;
    }
  }

  const startedAt = new Date().toISOString();

  const probe = await runProviderReliabilityProbe(nvidiaProvider, {
    models: H0_004B_PROBE_MODELS,
    rounds: H0_004B_PROBE_ROUNDS,
    timeoutMs: H0_004B_PROBE_TIMEOUT_MS,
    maxOutputTokens: H0_004B_PROBE_MAX_OUTPUT_TOKENS,
    transportRetries: H0_004B_PROBE_TRANSPORT_RETRIES,
  });

  const finishedAt = new Date().toISOString();

  await mkdir(artifactDirectory, {
    recursive: true,
  });

  await writeFile(
    artifactPath,
    `${JSON.stringify(
      {
        kind: "h0-004b-provider-reliability-probe",
        harnessGitRevision: gitRevision,
        startedAt,
        finishedAt,
        provider: "nvidia",
        ...probe,
      },
      null,
      2,
    )}\n`,
    {
      flag: "wx",
    },
  );

  console.log("");
  console.log("H0-004B provider reliability probe completed.");
  console.log(`Harness SHA: ${gitRevision}`);
  console.log(`Artifact: ${artifactPath}`);

  for (const observation of probe.observations) {
    console.log(
      [
        `#${observation.sequenceIndex}`,
        observation.model,
        observation.status,
        `${observation.durationMs}ms`,
        observation.error ?? "",
      ]
        .filter((value) => value.length > 0)
        .join(" | "),
    );
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.stack ?? error.message : String(error),
  );
  process.exitCode = 1;
});
