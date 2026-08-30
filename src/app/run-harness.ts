import type { DevStateType } from "../state.js";
import { buildRunTelemetryCompletion } from "../telemetry/completion.js";
import {
  createLlmCallTelemetryCollector,
  type LlmCallTelemetryCollector,
  type LlmCallTelemetrySink,
} from "../telemetry/llm-calls.js";
import {
  createRunLifecycleRecorder,
  type RunLifecycleRecorder,
} from "../telemetry/recorder.js";
import {
  createJsonRunTelemetryStore,
  type PersistedRunTelemetry,
  type RunTelemetryStore,
} from "../telemetry/store.js";
import type { RunTelemetry } from "../telemetry/contracts.js";
import type { NormalizedHarnessTask } from "../intake/contracts.js";

type HarnessGraphInput = Pick<
  DevStateType,
  | "task"
  | "repositoryPath"
  | "fileContents"
  | "fileSummaries"
  | "recentlyReadFiles"
  | "filesChanged"
  | "attempts"
  | "maxAttempts"
  | "planningAttempts"
  | "reviewAttempts"
  | "maxPlanningAttempts"
  | "failureReason"
  | "status"
>;

export type ResolvedWorkspace = Readonly<{
  repositoryPath: string;
}>;

export type HarnessExecutionOptions = Readonly<{
  maxPlanningAttempts?: number;
}>;

export type RunHarnessRequest = Readonly<{
  task: NormalizedHarnessTask;
  workspace: ResolvedWorkspace;
  environment?: Readonly<Record<string, string>>;
  execution?: HarnessExecutionOptions;
}>;

export type HarnessRunResult = Readonly<{
  state: DevStateType;
  telemetry: RunTelemetry;
  persistedTelemetry: PersistedRunTelemetry;
}>;

export type RunHarnessDependencies = Readonly<{
  createLlmCallCollector?: () => LlmCallTelemetryCollector;
  createRunRecorder?: () => RunLifecycleRecorder;
  createTelemetryStore?: () => RunTelemetryStore;
  invokeGraph?: (
    state: HarnessGraphInput,
    llmCallTelemetrySink: LlmCallTelemetrySink,
  ) => Promise<DevStateType>;
}>;

async function invokeDefaultGraph(
  state: HarnessGraphInput,
  llmCallTelemetrySink: LlmCallTelemetrySink,
): Promise<DevStateType> {
  const { buildDevGraph } = await import("../graph.js");
  const graph = buildDevGraph(llmCallTelemetrySink);

  return graph.invoke(state);
}

export async function runHarness(
  request: RunHarnessRequest,
  dependencies: RunHarnessDependencies = {},
): Promise<HarnessRunResult> {
  const createLlmCallCollector =
    dependencies.createLlmCallCollector ?? createLlmCallTelemetryCollector;
  const createRunRecorder =
    dependencies.createRunRecorder ?? createRunLifecycleRecorder;
  const createTelemetryStore =
    dependencies.createTelemetryStore ?? createJsonRunTelemetryStore;
  const invokeGraph = dependencies.invokeGraph ?? invokeDefaultGraph;

  const llmCallCollector = createLlmCallCollector();
  const runRecorder = createRunRecorder();
  const activeRun = runRecorder.start({
    task: request.task.request,
    repositoryPath: request.workspace.repositoryPath,
  });
  const telemetryStore = createTelemetryStore();

  const state = await invokeGraph(
    {
      task: request.task.request,
      repositoryPath: request.workspace.repositoryPath,

      fileContents: {},
      fileSummaries: {},
      recentlyReadFiles: [],

      filesChanged: [],

      attempts: 0,
      maxAttempts: 3,

      planningAttempts: 0,
      reviewAttempts: 0,

      maxPlanningAttempts: request.execution?.maxPlanningAttempts ?? 4,

      failureReason: undefined,

      status: "pending",
    },
    llmCallCollector,
  );

  const telemetry = activeRun.complete(
    buildRunTelemetryCompletion(
      state,
      llmCallCollector.snapshot(),
    ),
  );

  const persistedTelemetry = await telemetryStore.save(telemetry);

  return {
    state,
    telemetry,
    persistedTelemetry,
  };
}
