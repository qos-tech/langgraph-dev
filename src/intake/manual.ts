import type { RunHarnessRequest } from "../app/run-harness.js";
import { normalizeHarnessTask } from "./normalize.js";

export type ManualHarnessIntakeInput = Readonly<{
  env: NodeJS.ProcessEnv;
  taskId: string;
  request: string;
}>;

export function createManualHarnessRunRequest(
  input: ManualHarnessIntakeInput,
): RunHarnessRequest {
  const repositoryPath = input.env.TARGET_REPOSITORY;

  if (!repositoryPath) {
    throw new Error("TARGET_REPOSITORY não definido.");
  }

  const repositoryId = input.env.TARGET_REPOSITORY_ID;

  if (!repositoryId) {
    throw new Error("TARGET_REPOSITORY_ID não definido.");
  }

  const task = normalizeHarnessTask({
    id: input.taskId,
    source: "manual",
    repository: {
      id: repositoryId,
      ...(input.env.TARGET_REPOSITORY_REVISION !== undefined
        ? { revision: input.env.TARGET_REPOSITORY_REVISION }
        : {}),
    },
    request: input.request,
  });

  return {
    task,
    workspace: {
      repositoryPath,
    },
    ...(input.env.MAX_PLANNING_ATTEMPTS !== undefined
      ? {
          execution: {
            maxPlanningAttempts: Number(input.env.MAX_PLANNING_ATTEMPTS),
          },
        }
      : {}),
  };
}
