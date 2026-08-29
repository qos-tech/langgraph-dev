import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

async function gitLines(
  repositoryPath: string,
  args: readonly string[],
): Promise<readonly string[]> {
  const result = await execFileAsync("git", ["-C", repositoryPath, ...args], {
    encoding: "utf8",
  });

  return result.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export async function collectBenchmarkChangedFiles(
  repositoryPath: string,
): Promise<readonly string[]> {
  const [trackedChanges, untrackedFiles] = await Promise.all([
    gitLines(repositoryPath, ["diff", "--name-only", "--relative", "HEAD", "--"]),
    gitLines(repositoryPath, ["ls-files", "--others", "--exclude-standard"]),
  ]);

  return [...new Set([...trackedChanges, ...untrackedFiles])].sort();
}
