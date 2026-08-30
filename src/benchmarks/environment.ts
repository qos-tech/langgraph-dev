import type { ResolvedWorkspace } from "../app/run-harness.js";
import type { BenchmarkTask } from "./contracts.js";

export type BenchmarkExecutionEnvironment = Readonly<Record<string, string>>;

export type BenchmarkEnvironmentRequest = Readonly<{
  benchmark: BenchmarkTask;
  workspace: ResolvedWorkspace;
}>;

export type PreparedBenchmarkEnvironment = Readonly<{
  env: BenchmarkExecutionEnvironment;
  cleanup: () => Promise<void>;
}>;

export interface BenchmarkEnvironmentPreparer {
  prepare(
    request: BenchmarkEnvironmentRequest,
  ): Promise<PreparedBenchmarkEnvironment>;
}

export class NoopBenchmarkEnvironmentPreparer
  implements BenchmarkEnvironmentPreparer
{
  async prepare(
    _request: BenchmarkEnvironmentRequest,
  ): Promise<PreparedBenchmarkEnvironment> {
    return {
      env: {},
      cleanup: async () => {},
    };
  }
}
