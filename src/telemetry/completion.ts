import type { DevStateType } from "../state.js";
import type {
  LlmCallTelemetry,
  RunTelemetryCompletion,
} from "./contracts.js";

export type RunTelemetryCompletionInput = Omit<
  RunTelemetryCompletion,
  "finishedAt" | "durationMs"
>;

export function buildRunTelemetryCompletion(
  state: DevStateType,
  llmCalls: readonly LlmCallTelemetry[],
): RunTelemetryCompletionInput {
  if (state.status !== "completed" && state.status !== "failed") {
    throw new Error(
      `Run telemetry requires a terminal graph status, received: ${state.status}`,
    );
  }

  const completion = {
    finalStatus: state.status,
    attempts: {
      planning: state.planningAttempts,
      review: state.reviewAttempts,
      task: state.attempts,
    },
    files: {
      read: Object.keys(state.fileContents).length,
      changed: [...state.filesChanged],
    },
    llmCalls: llmCalls.map((call) => ({
      ...call,
    })),
  } satisfies Omit<
    RunTelemetryCompletionInput,
    "failureReason"
  >;

  if (state.status === "failed" && state.failureReason !== undefined) {
    return {
      ...completion,
      failureReason: state.failureReason,
    };
  }

  return completion;
}
