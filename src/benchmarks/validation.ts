import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export type BenchmarkValidationCommandResult = Readonly<{
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
}>;

export type BenchmarkValidationResult = Readonly<{
  passed: boolean;
  commands: readonly BenchmarkValidationCommandResult[];
}>;

export type BenchmarkValidationRequest = Readonly<{
  repositoryPath: string;
  commands: readonly string[];
}>;

export type BenchmarkValidationCommandRequest = Readonly<{
  command: string;
  cwd: string;
}>;

export interface BenchmarkValidationCommandRunner {
  run(
    request: BenchmarkValidationCommandRequest,
  ): Promise<BenchmarkValidationCommandResult>;
}

type ExecFailure = Error &
  Readonly<{
    code?: unknown;
    stdout?: unknown;
    stderr?: unknown;
  }>;

function asText(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (Buffer.isBuffer(value)) {
    return value.toString("utf8");
  }

  return "";
}

export class NodeShellBenchmarkValidationCommandRunner
  implements BenchmarkValidationCommandRunner
{
  async run(
    request: BenchmarkValidationCommandRequest,
  ): Promise<BenchmarkValidationCommandResult> {
    try {
      const result = await execAsync(request.command, {
        cwd: request.cwd,
        encoding: "utf8",
      });

      return {
        command: request.command,
        exitCode: 0,
        stdout: result.stdout,
        stderr: result.stderr,
      };
    } catch (error) {
      const execFailure = error as ExecFailure;

      if (typeof execFailure.code !== "number") {
        throw error;
      }

      return {
        command: request.command,
        exitCode: execFailure.code,
        stdout: asText(execFailure.stdout),
        stderr: asText(execFailure.stderr),
      };
    }
  }
}

export type ExecuteBenchmarkValidationDependencies = Readonly<{
  commandRunner?: BenchmarkValidationCommandRunner;
}>;

export async function executeBenchmarkValidation(
  request: BenchmarkValidationRequest,
  dependencies: ExecuteBenchmarkValidationDependencies = {},
): Promise<BenchmarkValidationResult> {
  const commandRunner =
    dependencies.commandRunner ?? new NodeShellBenchmarkValidationCommandRunner();

  const commands: BenchmarkValidationCommandResult[] = [];

  for (const command of request.commands) {
    const result = await commandRunner.run({
      command,
      cwd: request.repositoryPath,
    });

    commands.push(result);

    if (result.exitCode !== 0) {
      return {
        passed: false,
        commands,
      };
    }
  }

  return {
    passed: true,
    commands,
  };
}
