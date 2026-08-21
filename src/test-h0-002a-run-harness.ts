import assert from "node:assert/strict";
import { runHarness } from "./app/run-harness.js";
import { defineNormalizedHarnessTask } from "./intake/contracts.js";
import { createLlmCallTelemetryCollector } from "./telemetry/llm-calls.js";
import { createRunLifecycleRecorder } from "./telemetry/recorder.js";
import type { RunTelemetryStore } from "./telemetry/store.js";

const task = defineNormalizedHarnessTask({
  schemaVersion: 1,
  id: "task-001",
  source: "benchmark",
  repository: {
    id: "qos-harness",
    revision: "v0.1.0-alpha.6",
  },
  request: "Characterize the application execution boundary.",
  constraints: [],
  acceptanceCriteria: [],
  metadata: {},
});

const events: string[] = [];
const clockValues = [
  new Date("2026-08-21T12:00:00.000Z"),
  new Date("2026-08-21T12:00:02.000Z"),
];
let clockIndex = 0;
let savedTelemetry: Parameters<RunTelemetryStore["save"]>[0] | undefined;

const result = await runHarness(
  {
    task,
    workspace: {
      repositoryPath: "/tmp/qos-harness-worktree",
    },
    execution: {
      maxPlanningAttempts: 7,
    },
  },
  {
    createLlmCallCollector() {
      events.push("collector:create");
      return createLlmCallTelemetryCollector();
    },
    createRunRecorder() {
      events.push("recorder:create");

      const recorder = createRunLifecycleRecorder({
        now() {
          const value = clockValues[clockIndex];
          clockIndex += 1;

          if (!value) {
            throw new Error("Unexpected telemetry clock read.");
          }

          return value;
        },
        createRunId() {
          return "run-step4";
        },
      });

      return {
        start(input) {
          events.push("recorder:start");
          const activeRun = recorder.start(input);

          return {
            start: activeRun.start,
            complete(completion) {
              events.push("recorder:complete");
              return activeRun.complete(completion);
            },
          };
        },
      };
    },
    createTelemetryStore() {
      events.push("store:create");

      return {
        async save(telemetry) {
          events.push("store:save");
          savedTelemetry = telemetry;

          return {
            path: "/virtual/.runs/run-step4.json",
          };
        },
      };
    },
    async invokeGraph(state, llmCallTelemetrySink) {
      events.push("graph:invoke");

      assert.equal(
        state.task,
        "Characterize the application execution boundary.",
      );
      assert.equal(
        state.repositoryPath,
        "/tmp/qos-harness-worktree",
      );
      assert.deepEqual(state.fileContents, {});
      assert.deepEqual(state.fileSummaries, {});
      assert.deepEqual(state.recentlyReadFiles, []);
      assert.deepEqual(state.filesChanged, []);
      assert.equal(state.attempts, 0);
      assert.equal(state.maxAttempts, 3);
      assert.equal(state.planningAttempts, 0);
      assert.equal(state.reviewAttempts, 0);
      assert.equal(state.maxPlanningAttempts, 7);
      assert.equal(state.failureReason, undefined);
      assert.equal(state.status, "pending");

      llmCallTelemetrySink.record({
        role: "planner",
        model: "deterministic-test-model",
        elapsedSeconds: 0.25,
        promptTokens: 20,
        completionTokens: 10,
        totalTokens: 30,
      });

      return {
        ...state,
        repositoryContext: undefined,
        explorationPlan: undefined,
        planReview: undefined,
        refinedPlan: undefined,
        analysis: undefined,
        validationOutput: undefined,
        fileContents: {
          "src/example.ts": "export const example = true;\n",
        },
        filesChanged: ["src/example.ts"],
        planningAttempts: 2,
        reviewAttempts: 1,
        status: "completed",
      };
    },
  },
);

assert.deepEqual(events, [
  "collector:create",
  "recorder:create",
  "recorder:start",
  "store:create",
  "graph:invoke",
  "recorder:complete",
  "store:save",
]);

assert.equal(result.state.status, "completed");
assert.equal(result.state.maxPlanningAttempts, 7);
assert.equal(result.telemetry.runId, "run-step4");
assert.equal(
  result.telemetry.task,
  "Characterize the application execution boundary.",
);
assert.equal(
  result.telemetry.repositoryPath,
  "/tmp/qos-harness-worktree",
);
assert.equal(result.telemetry.durationMs, 2000);
assert.equal(result.telemetry.finalStatus, "completed");
assert.deepEqual(result.telemetry.attempts, {
  planning: 2,
  review: 1,
  task: 0,
});
assert.deepEqual(result.telemetry.files, {
  read: 1,
  changed: ["src/example.ts"],
});
assert.deepEqual(result.telemetry.llmCalls, [
  {
    role: "planner",
    model: "deterministic-test-model",
    elapsedSeconds: 0.25,
    promptTokens: 20,
    completionTokens: 10,
    totalTokens: 30,
  },
]);
assert.equal(savedTelemetry, result.telemetry);
assert.deepEqual(result.persistedTelemetry, {
  path: "/virtual/.runs/run-step4.json",
});

const defaultExecutionResult = await runHarness(
  {
    task,
    workspace: {
      repositoryPath: "/tmp/default-planning-budget",
    },
  },
  {
    createRunRecorder() {
      const recorder = createRunLifecycleRecorder({
        now: () => new Date("2026-08-21T12:00:00.000Z"),
        createRunId: () => "run-default-budget",
      });

      return recorder;
    },
    createTelemetryStore() {
      return {
        async save() {
          return {
            path: "/virtual/.runs/run-default-budget.json",
          };
        },
      };
    },
    async invokeGraph(state) {
      assert.equal(
        state.maxPlanningAttempts,
        4,
        "application execution must preserve the characterized default planning budget",
      );

      return {
        ...state,
        repositoryContext: undefined,
        explorationPlan: undefined,
        planReview: undefined,
        refinedPlan: undefined,
        analysis: undefined,
        validationOutput: undefined,
        status: "completed",
      };
    },
  },
);

assert.equal(defaultExecutionResult.state.maxPlanningAttempts, 4);

console.log("✅ H0-002A Step 4 application execution boundary passed.");
