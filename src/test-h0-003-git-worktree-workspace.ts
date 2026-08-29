import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import type { BenchmarkRepositoryLocator } from "./benchmarks/workspace.js";
import {
  GitWorktreeBenchmarkWorkspaceResolver,
  type GitCommandResult,
  type GitCommandRunner,
} from "./benchmarks/git-worktree-workspace.js";

const execFileAsync = promisify(execFile);

async function git(
  repositoryPath: string,
  args: readonly string[],
): Promise<string> {
  const result = await execFileAsync("git", ["-C", repositoryPath, ...args], {
    encoding: "utf8",
  });
  return result.stdout.trim();
}

const originalCwd = process.cwd();
const fixtureRoot = await mkdtemp(
  join(tmpdir(), "h0-003-git-worktree-workspace-"),
);
const sourceRepositoryPath = join(fixtureRoot, "source");
const workspaceRoot = join(fixtureRoot, "workspaces");

try {
  await execFileAsync("git", ["init", sourceRepositoryPath], {
    encoding: "utf8",
  });
  await git(sourceRepositoryPath, ["config", "user.name", "Harness Test"]);
  await git(sourceRepositoryPath, [
    "config",
    "user.email",
    "harness-test@example.invalid",
  ]);

  const baselineFile = join(sourceRepositoryPath, "baseline.txt");
  await writeFile(baselineFile, "baseline\n");
  await git(sourceRepositoryPath, ["add", "baseline.txt"]);
  await git(sourceRepositoryPath, ["commit", "-m", "fixture baseline"]);
  await git(sourceRepositoryPath, ["tag", "fixture-v1"]);

  const sourceHeadBefore = await git(sourceRepositoryPath, ["rev-parse", "HEAD"]);
  const sourceStatusBefore = await git(sourceRepositoryPath, [
    "status",
    "--porcelain",
  ]);

  const locatedRepositoryIds: string[] = [];
  const repositoryLocator: BenchmarkRepositoryLocator = {
    async locate(repositoryId: string): Promise<string> {
      locatedRepositoryIds.push(repositoryId);
      assert.equal(repositoryId, "fixture-repository");
      return sourceRepositoryPath;
    },
  };

  const resolver = new GitWorktreeBenchmarkWorkspaceResolver({
    repositoryLocator,
    workspaceRoot,
  });

  const first = await resolver.resolve({
    repository: {
      id: "fixture-repository",
      revision: "fixture-v1",
    },
  });
  const second = await resolver.resolve({
    repository: {
      id: "fixture-repository",
      revision: "fixture-v1",
    },
  });

  assert.equal(process.cwd(), originalCwd, "resolver must not mutate cwd");
  assert.deepEqual(locatedRepositoryIds, [
    "fixture-repository",
    "fixture-repository",
  ]);
  assert.notEqual(
    first.workspace.repositoryPath,
    second.workspace.repositoryPath,
    "each resolution must receive a fresh workspace",
  );

  const requestedCommit = await git(sourceRepositoryPath, [
    "rev-parse",
    "--verify",
    "fixture-v1^{commit}",
  ]);
  const firstHead = await git(first.workspace.repositoryPath, [
    "rev-parse",
    "HEAD",
  ]);
  const secondHead = await git(second.workspace.repositoryPath, [
    "rev-parse",
    "HEAD",
  ]);

  assert.equal(firstHead, requestedCommit);
  assert.equal(secondHead, requestedCommit);
  assert.equal(
    await git(first.workspace.repositoryPath, ["rev-parse", "--abbrev-ref", "HEAD"]),
    "HEAD",
    "benchmark worktree must be detached",
  );

  await writeFile(
    join(first.workspace.repositoryPath, "baseline.txt"),
    "mutated in first worktree\n",
  );
  await writeFile(
    join(first.workspace.repositoryPath, "first-only.txt"),
    "first worktree only\n",
  );

  assert.equal(await readFile(baselineFile, "utf8"), "baseline\n");
  assert.equal(
    await readFile(join(second.workspace.repositoryPath, "baseline.txt"), "utf8"),
    "baseline\n",
    "one isolated worktree must not mutate another",
  );
  await assert.rejects(
    readFile(join(second.workspace.repositoryPath, "first-only.txt"), "utf8"),
  );

  assert.equal(
    await git(sourceRepositoryPath, ["rev-parse", "HEAD"]),
    sourceHeadBefore,
    "source checkout HEAD must remain unchanged",
  );
  assert.equal(
    await git(sourceRepositoryPath, ["status", "--porcelain"]),
    sourceStatusBefore,
    "source checkout working tree must remain unchanged",
  );

  const firstPath = first.workspace.repositoryPath;
  await first.cleanup();
  await first.cleanup();

  await assert.rejects(readFile(join(firstPath, "baseline.txt"), "utf8"));
  assert.equal(
    (await git(sourceRepositoryPath, ["worktree", "list", "--porcelain"])).includes(
      firstPath,
    ),
    false,
    "cleanup must remove Git worktree registration",
  );

  await second.cleanup();

  const failedCommands: string[][] = [];
  class PartialFailureGitRunner implements GitCommandRunner {
    readonly commands: string[][] = [];

    async run(args: readonly string[]): Promise<GitCommandResult> {
      this.commands.push([...args]);

      if (args.includes("rev-parse") && args.at(-1)?.endsWith("^{commit}")) {
        return { stdout: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\n", stderr: "" };
      }

      if (args.includes("worktree") && args.includes("add")) {
        return { stdout: "", stderr: "" };
      }

      if (args.includes("rev-parse") && args.at(-1) === "HEAD") {
        return { stdout: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb\n", stderr: "" };
      }

      if (args.includes("worktree") && args.includes("remove")) {
        failedCommands.push([...args]);
        throw new Error("simulated cleanup failure");
      }

      return { stdout: "", stderr: "" };
    }
  }

  const failureRunner = new PartialFailureGitRunner();
  const failureResolver = new GitWorktreeBenchmarkWorkspaceResolver({
    repositoryLocator,
    workspaceRoot: join(fixtureRoot, "failure-workspaces"),
    gitRunner: failureRunner,
  });

  await assert.rejects(
    failureResolver.resolve({
      repository: {
        id: "fixture-repository",
        revision: "fixture-v1",
      },
    }),
    /Resolved benchmark worktree HEAD mismatch/,
    "original creation/verification error must be propagated",
  );

  assert.equal(
    failedCommands.length,
    1,
    "partial failure must attempt best-effort worktree cleanup",
  );
  assert.equal(
    failureRunner.commands.some(
      (args) => args.includes("worktree") && args.includes("prune"),
    ),
    true,
    "partial failure must attempt worktree prune after cleanup",
  );

  console.log("✅ H0-003 Step 4 Git worktree workspace resolver passed.");
} finally {
  assert.equal(process.cwd(), originalCwd, "test must restore cwd invariant");
  await rm(fixtureRoot, { recursive: true, force: true });
}
