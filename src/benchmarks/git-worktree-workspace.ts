import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import type {
  BenchmarkRepositoryLocator,
  BenchmarkWorkspaceRequest,
  BenchmarkWorkspaceResolver,
  ResolvedBenchmarkWorkspace,
} from "./workspace.js";

const execFileAsync = promisify(execFile);

export type GitCommandResult = Readonly<{
  stdout: string;
  stderr: string;
}>;

export interface GitCommandRunner {
  run(args: readonly string[]): Promise<GitCommandResult>;
}

export class NodeGitCommandRunner implements GitCommandRunner {
  async run(args: readonly string[]): Promise<GitCommandResult> {
    const result = await execFileAsync("git", [...args], {
      encoding: "utf8",
    });

    return {
      stdout: result.stdout,
      stderr: result.stderr,
    };
  }
}

export type GitWorktreeBenchmarkWorkspaceResolverOptions = Readonly<{
  repositoryLocator: BenchmarkRepositoryLocator;
  workspaceRoot: string;
  gitRunner?: GitCommandRunner;
}>;

function sanitizeWorkspaceSegment(value: string): string {
  const sanitized = value.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return sanitized.length > 0 ? sanitized : "benchmark";
}

async function removeWorktree(
  gitRunner: GitCommandRunner,
  sourceRepositoryPath: string,
  workspacePath: string,
): Promise<void> {
  await gitRunner.run([
    "-C",
    sourceRepositoryPath,
    "worktree",
    "remove",
    "--force",
    workspacePath,
  ]);
  await rm(workspacePath, { recursive: true, force: true });
  await gitRunner.run(["-C", sourceRepositoryPath, "worktree", "prune"]);
}

async function bestEffortRemoveWorktree(
  gitRunner: GitCommandRunner,
  sourceRepositoryPath: string,
  workspacePath: string,
): Promise<void> {
  try {
    await gitRunner.run([
      "-C",
      sourceRepositoryPath,
      "worktree",
      "remove",
      "--force",
      workspacePath,
    ]);
  } catch {
    // Preserve the original resolution failure.
  }

  try {
    await rm(workspacePath, { recursive: true, force: true });
  } catch {
    // Preserve the original resolution failure.
  }

  try {
    await gitRunner.run(["-C", sourceRepositoryPath, "worktree", "prune"]);
  } catch {
    // Preserve the original resolution failure.
  }
}

export class GitWorktreeBenchmarkWorkspaceResolver
  implements BenchmarkWorkspaceResolver
{
  readonly #repositoryLocator: BenchmarkRepositoryLocator;
  readonly #workspaceRoot: string;
  readonly #gitRunner: GitCommandRunner;

  constructor(options: GitWorktreeBenchmarkWorkspaceResolverOptions) {
    this.#repositoryLocator = options.repositoryLocator;
    this.#workspaceRoot = options.workspaceRoot;
    this.#gitRunner = options.gitRunner ?? new NodeGitCommandRunner();
  }

  async resolve(
    request: BenchmarkWorkspaceRequest,
  ): Promise<ResolvedBenchmarkWorkspace> {
    const sourceRepositoryPath = await this.#repositoryLocator.locate(
      request.repository.id,
    );

    const resolvedCommitResult = await this.#gitRunner.run([
      "-C",
      sourceRepositoryPath,
      "rev-parse",
      "--verify",
      "--end-of-options",
      `${request.repository.revision}^{commit}`,
    ]);
    const resolvedCommit = resolvedCommitResult.stdout.trim();

    if (resolvedCommit.length === 0) {
      throw new Error(
        `Git resolved an empty commit for benchmark revision ${request.repository.revision}.`,
      );
    }

    await mkdir(this.#workspaceRoot, { recursive: true });

    const workspaceName = [
      sanitizeWorkspaceSegment(request.repository.id),
      sanitizeWorkspaceSegment(request.repository.revision),
      randomUUID(),
    ].join("-");
    const workspacePath = join(this.#workspaceRoot, workspaceName);

    try {
      await this.#gitRunner.run([
        "-C",
        sourceRepositoryPath,
        "worktree",
        "add",
        "--detach",
        workspacePath,
        resolvedCommit,
      ]);

      const workspaceHeadResult = await this.#gitRunner.run([
        "-C",
        workspacePath,
        "rev-parse",
        "HEAD",
      ]);
      const workspaceHead = workspaceHeadResult.stdout.trim();

      if (workspaceHead !== resolvedCommit) {
        throw new Error(
          [
            "Resolved benchmark worktree HEAD mismatch.",
            `Expected: ${resolvedCommit}`,
            `Actual: ${workspaceHead || "<empty>"}`,
          ].join(" "),
        );
      }
    } catch (error) {
      await bestEffortRemoveWorktree(
        this.#gitRunner,
        sourceRepositoryPath,
        workspacePath,
      );
      throw error;
    }

    let cleaned = false;

    return {
      workspace: {
        repositoryPath: workspacePath,
      },
      cleanup: async () => {
        if (cleaned) {
          return;
        }

        await removeWorktree(
          this.#gitRunner,
          sourceRepositoryPath,
          workspacePath,
        );
        cleaned = true;
      },
    };
  }
}
