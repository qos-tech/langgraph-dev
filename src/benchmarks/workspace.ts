import type { ResolvedWorkspace } from "../app/run-harness.js";
import type { BenchmarkRepositoryRef } from "./contracts.js";

export type BenchmarkWorkspaceRequest = Readonly<{
  repository: BenchmarkRepositoryRef;
}>;

export type ResolvedBenchmarkWorkspace = Readonly<{
  workspace: ResolvedWorkspace;
  cleanup: () => Promise<void>;
}>;

export interface BenchmarkWorkspaceResolver {
  resolve(
    request: BenchmarkWorkspaceRequest,
  ): Promise<ResolvedBenchmarkWorkspace>;
}


export interface BenchmarkRepositoryLocator {
  locate(repositoryId: string): Promise<string>;
}
