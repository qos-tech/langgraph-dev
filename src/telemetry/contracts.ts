export const RUN_TELEMETRY_SCHEMA_VERSION = 1 as const;

export type RunTelemetryFinalStatus = "completed" | "failed";

export type RunAttemptTelemetry = Readonly<{
  planning: number;
  review: number;
  task: number;
}>;

export type RunFileTelemetry = Readonly<{
  read: number;
  changed: readonly string[];
}>;

export type LlmCallTelemetry = Readonly<{
  role: "planner" | "reviewer" | "refiner";
  model: string;
  elapsedSeconds: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}>;

export type RunTelemetry = Readonly<{
  schemaVersion: typeof RUN_TELEMETRY_SCHEMA_VERSION;
  runId: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  task: string;
  repositoryPath: string;
  finalStatus: RunTelemetryFinalStatus;
  failureReason?: string;
  attempts: RunAttemptTelemetry;
  files: RunFileTelemetry;
  llmCalls: readonly LlmCallTelemetry[];
}>;

export type RunTelemetryStart = Readonly<{
  runId: string;
  startedAt: string;
  task: string;
  repositoryPath: string;
}>;

export type RunTelemetryCompletion = Readonly<{
  finishedAt: string;
  durationMs: number;
  finalStatus: RunTelemetryFinalStatus;
  failureReason?: string;
  attempts: RunAttemptTelemetry;
  files: RunFileTelemetry;
  llmCalls: readonly LlmCallTelemetry[];
}>;
