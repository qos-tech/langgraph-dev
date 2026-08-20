import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export type RepositoryInspection = {
  path: string;
  files: string[];
  packageJson?: Record<string, unknown>;
  gitStatus?: string;
};

async function walkDirectory(
  directory: string,
  baseDirectory: string,
): Promise<string[]> {
  const entries = await fs.readdir(directory, {
    withFileTypes: true,
  });

  const files: string[] = [];

  const ignoredDirectories = new Set([
    "node_modules",
    ".git",
    ".next",
    "dist",
    "build",
    "coverage",
  ]);

  for (const entry of entries) {
    if (
      entry.isDirectory() &&
      ignoredDirectories.has(entry.name)
    ) {
      continue;
    }

    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(
        ...(await walkDirectory(
          absolutePath,
          baseDirectory,
        )),
      );

      continue;
    }

    files.push(
      path.relative(baseDirectory, absolutePath),
    );
  }

  return files;
}

async function readPackageJson(
  repositoryPath: string,
): Promise<Record<string, unknown> | undefined> {
  const packageJsonPath = path.join(
    repositoryPath,
    "package.json",
  );

  try {
    const content = await fs.readFile(
      packageJsonPath,
      "utf8",
    );

    return JSON.parse(content);
  } catch {
    return undefined;
  }
}

async function readGitStatus(
  repositoryPath: string,
): Promise<string | undefined> {
  try {
    const { stdout } = await execFileAsync(
      "git",
      ["status", "--short"],
      {
        cwd: repositoryPath,
      },
    );

    return stdout.trim();
  } catch {
    return undefined;
  }
}

export async function inspectRepository(
  repositoryPath: string,
): Promise<RepositoryInspection> {
  const resolvedPath = path.resolve(repositoryPath);

  const files = await walkDirectory(
    resolvedPath,
    resolvedPath,
  );

  const packageJson = await readPackageJson(
    resolvedPath,
  );

  const gitStatus = await readGitStatus(
    resolvedPath,
  );

  return {
    path: resolvedPath,
    files,

    ...(packageJson !== undefined
      ? { packageJson }
      : {}),

    ...(gitStatus !== undefined
      ? { gitStatus }
      : {}),
  };
}