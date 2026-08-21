import { randomUUID } from "node:crypto";
import {
  RUN_TELEMETRY_SCHEMA_VERSION,
  type RunTelemetry,
  type RunTelemetryCompletion,
  type RunTelemetryStart,
} from "./contracts.js";

export type RunTelemetryClock = () => Date;
export type RunTelemetryIdFactory = () => string;

export type StartRunTelemetryInput = Readonly<{
  task: string;
  repositoryPath: string;
}>;

export type CompleteRunTelemetryInput = Omit<
  RunTelemetryCompletion,
  "finishedAt" | "durationMs"
>;

export type ActiveRunTelemetry = Readonly<{
  start: RunTelemetryStart;
  complete: (input: CompleteRunTelemetryInput) => RunTelemetry;
}>;

export type RunLifecycleRecorder = Readonly<{
  start: (input: StartRunTelemetryInput) => ActiveRunTelemetry;
}>;

export type RunLifecycleRecorderDependencies = Readonly<{
  now?: RunTelemetryClock;
  createRunId?: RunTelemetryIdFactory;
}>;

function systemClock(): Date {
  return new Date();
}

function defaultRunIdFactory(): string {
  return randomUUID();
}

function assertValidClockValue(value: Date, label: string): number {
  const milliseconds = value.getTime();

  if (!Number.isFinite(milliseconds)) {
    throw new Error(`Run telemetry ${label} clock value is invalid.`);
  }

  return milliseconds;
}

export function createRunLifecycleRecorder(
  dependencies: RunLifecycleRecorderDependencies = {},
): RunLifecycleRecorder {
  const now = dependencies.now ?? systemClock;
  const createRunId = dependencies.createRunId ?? defaultRunIdFactory;

  return {
    start(input) {
      const startedAtDate = now();
      const startedAtMilliseconds = assertValidClockValue(
        startedAtDate,
        "start",
      );
      const start: RunTelemetryStart = {
        runId: createRunId(),
        startedAt: startedAtDate.toISOString(),
        task: input.task,
        repositoryPath: input.repositoryPath,
      };

      return {
        start,
        complete(completion) {
          const finishedAtDate = now();
          const finishedAtMilliseconds = assertValidClockValue(
            finishedAtDate,
            "finish",
          );
          const durationMs = Math.max(
            0,
            finishedAtMilliseconds - startedAtMilliseconds,
          );

          return {
            schemaVersion: RUN_TELEMETRY_SCHEMA_VERSION,
            ...start,
            ...completion,
            finishedAt: finishedAtDate.toISOString(),
            durationMs,
          };
        },
      };
    },
  };
}
