import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import {
  mkdtemp,
  readFile,
  rm,
  unlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { collectBenchmarkChangedFiles } from "./benchmarks/changed-files.js";

const execFileAsync = promisify(execFile);

async function git(
  repositoryPath: string,
  args: readonly string[],
): Promise<string> {
  const result = await execFileAsync("git", ["-C", repositoryPath, ...args], {
    encoding: "utf8",
  });
  return result.stdout.trimEnd();
}

const originalCwd = process.cwd();
const fixtureRoot = await mkdtemp(join(tmpdir(), "h0-003-changed-files-"));

try {
  await execFileAsync("git", ["init", fixtureRoot], { encoding: "utf8" });
  await git(fixtureRoot, ["config", "user.name", "Harness Test"]);
  await git(fixtureRoot, [
    "config",
    "user.email",
    "harness-test@example.invalid",
  ]);

  await writeFile(join(fixtureRoot, "modified.txt"), "baseline\n");
  await writeFile(join(fixtureRoot, "deleted.txt"), "delete me\n");
  await writeFile(join(fixtureRoot, "rename-old.txt"), "rename me\n");
  await git(fixtureRoot, ["add", "."]);
  await git(fixtureRoot, ["commit", "-m", "baseline"]);

  assert.deepEqual(await collectBenchmarkChangedFiles(fixtureRoot), []);

  await writeFile(join(fixtureRoot, "modified.txt"), "changed\n");
  await writeFile(join(fixtureRoot, "untracked.txt"), "new\n");
  await unlink(join(fixtureRoot, "deleted.txt"));
  await git(fixtureRoot, ["mv", "rename-old.txt", "rename-new.txt"]);

  assert.deepEqual(await collectBenchmarkChangedFiles(fixtureRoot), [
    "deleted.txt",
    "modified.txt",
    "rename-new.txt",
    "untracked.txt",
  ]);

  assert.equal(
    await readFile(join(fixtureRoot, "modified.txt"), "utf8"),
    "changed\n",
    "collection must not mutate repository contents",
  );
  assert.equal(
    await git(fixtureRoot, ["status", "--porcelain"]),
    [
      " D deleted.txt",
      " M modified.txt",
      "R  rename-old.txt -> rename-new.txt",
      "?? untracked.txt",
    ].join("\n"),
    "collection must not alter Git status",
  );
  assert.equal(
    process.cwd(),
    originalCwd,
    "changed-file collection must not mutate process-wide cwd",
  );

  console.log("✅ H0-003 Step 7 benchmark changed-files collection passed.");
} finally {
  assert.equal(process.cwd(), originalCwd);
  await rm(fixtureRoot, { recursive: true, force: true });
}
