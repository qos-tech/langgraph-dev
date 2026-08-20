import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const ignoredDirectories = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "coverage",
]);

function resolveSafePath(
  repositoryPath: string,
  targetPath: string,
): string {
  const repositoryRoot = path.resolve(repositoryPath);

  const resolvedTarget = path.resolve(
    repositoryRoot,
    targetPath,
  );

  if (
    resolvedTarget !== repositoryRoot &&
    !resolvedTarget.startsWith(
      `${repositoryRoot}${path.sep}`,
    )
  ) {
    throw new Error(
      `Path outside repository is not allowed: ${targetPath}`,
    );
  }

  return resolvedTarget;
}

async function walkDirectory(
  directory: string,
  repositoryRoot: string,
): Promise<string[]> {
  const entries = await fs.readdir(directory, {
    withFileTypes: true,
  });

  const files: string[] = [];

  for (const entry of entries) {
    if (
      entry.isDirectory() &&
      ignoredDirectories.has(entry.name)
    ) {
      continue;
    }

    const absolutePath = path.join(
      directory,
      entry.name,
    );

    if (entry.isDirectory()) {
      files.push(
        ...(await walkDirectory(
          absolutePath,
          repositoryRoot,
        )),
      );

      continue;
    }

    files.push(
      path.relative(
        repositoryRoot,
        absolutePath,
      ),
    );
  }

  return files;
}

/**
 * Verifica se o diretório pertence a um repositório Git.
 */
export async function isGitRepository(
  repositoryPath: string,
): Promise<boolean> {
  try {
    const { stdout } = await execFileAsync(
      "git",
      ["rev-parse", "--is-inside-work-tree"],
      {
        cwd: repositoryPath,
      },
    );

    return stdout.trim() === "true";
  } catch {
    return false;
  }
}

/**
 * Lista arquivos do repositório.
 */
export async function listFiles(
  repositoryPath: string,
  directory = ".",
): Promise<string[]> {
  const repositoryRoot =
    path.resolve(repositoryPath);

  const targetDirectory =
    resolveSafePath(
      repositoryRoot,
      directory,
    );

  return walkDirectory(
    targetDirectory,
    repositoryRoot,
  );
}

/**
 * Lê um arquivo do repositório.
 *
 * Impede acesso fora da raiz do projeto.
 */
export async function readFile(
  repositoryPath: string,
  filePath: string,
): Promise<string> {
  const absolutePath =
    resolveSafePath(
      repositoryPath,
      filePath,
    );

  return fs.readFile(
    absolutePath,
    "utf8",
  );
}

/**
 * Busca texto nos arquivos.
 */
export async function searchFiles(
  repositoryPath: string,
  query: string,
): Promise<
  Array<{
    file: string;
    line: number;
    content: string;
  }>
> {
  const files =
    await listFiles(repositoryPath);

  const results: Array<{
    file: string;
    line: number;
    content: string;
  }> = [];

  const normalizedQuery =
    query.toLowerCase();

  for (const file of files) {
    let content: string;

    try {
      content = await readFile(
        repositoryPath,
        file,
      );
    } catch {
      continue;
    }

    const lines =
      content.split(/\r?\n/);

    lines.forEach(
      (line, index) => {
        if (
          line
            .toLowerCase()
            .includes(normalizedQuery)
        ) {
          results.push({
            file,
            line: index + 1,
            content: line.trim(),
          });
        }
      },
    );
  }

  return results;
}

/**
 * Retorna git status --short.
 */
export async function getGitStatus(
  repositoryPath: string,
): Promise<string> {
  if (
    !(await isGitRepository(repositoryPath))
  ) {
    return "Not a git repository";
  }

  try {
    const { stdout } =
      await execFileAsync(
        "git",
        [
          "status",
          "--short",
        ],
        {
          cwd: repositoryPath,
        },
      );

    const result =
      stdout.trim();

    return result || "clean";
  } catch (error) {
    return `Git status failed: ${
      error instanceof Error
        ? error.message
        : String(error)
    }`;
  }
}

/**
 * Retorna diff do working tree.
 */
export async function getGitDiff(
  repositoryPath: string,
): Promise<string> {
  if (
    !(await isGitRepository(repositoryPath))
  ) {
    return "Not a git repository";
  }

  try {
    const { stdout } =
      await execFileAsync(
        "git",
        [
          "diff",
          "--",
        ],
        {
          cwd: repositoryPath,

          maxBuffer:
            10 * 1024 * 1024,
        },
      );

    const result =
      stdout.trim();

    return result || "no changes";
  } catch (error) {
    return `Git diff failed: ${
      error instanceof Error
        ? error.message
        : String(error)
    }`;
  }
}