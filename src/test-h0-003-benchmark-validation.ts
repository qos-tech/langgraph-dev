import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  executeBenchmarkValidation,
  NodeShellBenchmarkValidationCommandRunner,
  type BenchmarkValidationCommandRequest,
  type BenchmarkValidationCommandResult,
  type BenchmarkValidationCommandRunner,
} from "./benchmarks/validation.js";

const originalCwd = process.cwd();

const calls: BenchmarkValidationCommandRequest[] = [];
const successfulRunner: BenchmarkValidationCommandRunner = {
  async run(
    request: BenchmarkValidationCommandRequest,
  ): Promise<BenchmarkValidationCommandResult> {
    calls.push(request);

    return {
      command: request.command,
      exitCode: 0,
      stdout: `stdout:${request.command}`,
      stderr: `stderr:${request.command}`,
    };
  },
};

const successful = await executeBenchmarkValidation(
  {
    repositoryPath: "/isolated/benchmark-validation",
    commands: ["first", "second", "third"],
  },
  {
    commandRunner: successfulRunner,
  },
);

assert.deepEqual(calls, [
  {
    command: "first",
    cwd: "/isolated/benchmark-validation",
  },
  {
    command: "second",
    cwd: "/isolated/benchmark-validation",
  },
  {
    command: "third",
    cwd: "/isolated/benchmark-validation",
  },
]);
assert.deepEqual(successful, {
  passed: true,
  commands: [
    {
      command: "first",
      exitCode: 0,
      stdout: "stdout:first",
      stderr: "stderr:first",
    },
    {
      command: "second",
      exitCode: 0,
      stdout: "stdout:second",
      stderr: "stderr:second",
    },
    {
      command: "third",
      exitCode: 0,
      stdout: "stdout:third",
      stderr: "stderr:third",
    },
  ],
});

const failedCalls: string[] = [];
const failed = await executeBenchmarkValidation(
  {
    repositoryPath: "/isolated/benchmark-validation",
    commands: ["typecheck", "tests", "must-not-run"],
  },
  {
    commandRunner: {
      async run(
        request: BenchmarkValidationCommandRequest,
      ): Promise<BenchmarkValidationCommandResult> {
        failedCalls.push(request.command);

        if (request.command === "tests") {
          return {
            command: request.command,
            exitCode: 2,
            stdout: "partial stdout",
            stderr: "test failure",
          };
        }

        return {
          command: request.command,
          exitCode: 0,
          stdout: "ok",
          stderr: "",
        };
      },
    },
  },
);

assert.deepEqual(failedCalls, ["typecheck", "tests"]);
assert.deepEqual(failed, {
  passed: false,
  commands: [
    {
      command: "typecheck",
      exitCode: 0,
      stdout: "ok",
      stderr: "",
    },
    {
      command: "tests",
      exitCode: 2,
      stdout: "partial stdout",
      stderr: "test failure",
    },
  ],
});

const launchFailure = new Error("simulated shell launch failure");

await assert.rejects(
  executeBenchmarkValidation(
    {
      repositoryPath: "/isolated/benchmark-validation",
      commands: ["first"],
    },
    {
      commandRunner: {
        async run(): Promise<BenchmarkValidationCommandResult> {
          throw launchFailure;
        },
      },
    },
  ),
  (error: unknown) => error === launchFailure,
);

const fixtureRoot = await mkdtemp(
  join(tmpdir(), "h0-003-benchmark-validation-"),
);

try {
  const shellRunner = new NodeShellBenchmarkValidationCommandRunner();

  const shellSuccess = await executeBenchmarkValidation(
    {
      repositoryPath: fixtureRoot,
      commands: [
        'printf "stdout-value"; printf "stderr-value" >&2',
        'test "$PWD" = "$(pwd)"',
      ],
    },
    {
      commandRunner: shellRunner,
    },
  );

  assert.equal(shellSuccess.passed, true);
  assert.equal(shellSuccess.commands.length, 2);
  assert.equal(shellSuccess.commands[0]?.exitCode, 0);
  assert.equal(shellSuccess.commands[0]?.stdout, "stdout-value");
  assert.equal(shellSuccess.commands[0]?.stderr, "stderr-value");

  const shellFailure = await executeBenchmarkValidation(
    {
      repositoryPath: fixtureRoot,
      commands: [
        'printf "before-failure"',
        'printf "failure-stderr" >&2; exit 7',
        'printf "must-not-run"',
      ],
    },
    {
      commandRunner: shellRunner,
    },
  );

  assert.equal(shellFailure.passed, false);
  assert.equal(shellFailure.commands.length, 2);
  assert.equal(shellFailure.commands[0]?.stdout, "before-failure");
  assert.equal(shellFailure.commands[1]?.exitCode, 7);
  assert.equal(shellFailure.commands[1]?.stderr, "failure-stderr");
} finally {
  await rm(fixtureRoot, { recursive: true, force: true });
}

assert.equal(
  process.cwd(),
  originalCwd,
  "validation execution must not mutate process-wide cwd",
);

console.log("✅ H0-003 Step 6 benchmark validation execution passed.");
