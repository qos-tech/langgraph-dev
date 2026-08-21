import assert from "node:assert/strict";
import {
  mkdtemp,
  readFile,
  rm,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { DevStateType } from "./state.js";
import { buildRunTelemetryCompletion } from "./telemetry/completion.js";
import { createLlmCallTelemetryCollector } from "./telemetry/llm-calls.js";
import { createRunLifecycleRecorder } from "./telemetry/recorder.js";
import { createJsonRunTelemetryStore } from "./telemetry/store.js";

const rootDirectory = await mkdtemp(
  path.join(os.tmpdir(), "qos-run-telemetry-integration-"),
);

try {
  const collector = createLlmCallTelemetryCollector();

  collector.record({
    role: "planner",
    model: "planner-model",
    elapsedSeconds: 1.5,
    promptTokens: 100,
    completionTokens: 25,
    totalTokens: 125,
  });

  const clockValues = [
    new Date("2026-08-21T12:00:00.000Z"),
    new Date("2026-08-21T12:00:03.000Z"),
  ];

  const recorder = createRunLifecycleRecorder({
    createRunId: () => "run-integration-001",
    now: () => {
      const value = clockValues.shift();

      if (!value) {
        throw new Error("Integration test clock exhausted.");
      }

      return value;
    },
  });

  const activeRun = recorder.start({
    task: "Add GET /health",
    repositoryPath: "/tmp/example",
  });

  const completedState: DevStateType = {
    task: "Add GET /health",
    repositoryPath: "/tmp/example",
    repositoryContext: undefined,
    fileContents: {
      "src/index.ts": "content",
      "src/health.ts": "content",
    },
    fileSummaries: {},
    recentlyReadFiles: ["src/health.ts"],
    explorationPlan: undefined,
    planReview: undefined,
    refinedPlan: undefined,
    planningAttempts: 2,
    reviewAttempts: 1,
    maxPlanningAttempts: 4,
    analysis: undefined,
    filesChanged: ["src/health.ts"],
    validationOutput: undefined,
    attempts: 1,
    maxAttempts: 3,
    failureReason: undefined,
    status: "completed",
  };

  const telemetry = activeRun.complete(
    buildRunTelemetryCompletion(
      completedState,
      collector.snapshot(),
    ),
  );

  const store = createJsonRunTelemetryStore({
    rootDirectory,
  });

  const persisted = await store.save(telemetry);
  const serialized = await readFile(persisted.path, "utf8");
  const parsed = JSON.parse(serialized) as typeof telemetry;

  assert.equal(
    persisted.path,
    path.join(
      rootDirectory,
      ".runs",
      "run-integration-001.json",
    ),
  );
  assert.equal(parsed.finalStatus, "completed");
  assert.equal(parsed.durationMs, 3000);
  assert.deepEqual(parsed.attempts, {
    planning: 2,
    review: 1,
    task: 1,
  });
  assert.deepEqual(parsed.files, {
    read: 2,
    changed: ["src/health.ts"],
  });
  assert.deepEqual(parsed.llmCalls, [
    {
      role: "planner",
      model: "planner-model",
      elapsedSeconds: 1.5,
      promptTokens: 100,
      completionTokens: 25,
      totalTokens: 125,
    },
  ]);

  const failedState: DevStateType = {
    ...completedState,
    filesChanged: [],
    failureReason: "planning budget exhausted",
    status: "failed",
  };

  assert.deepEqual(
    buildRunTelemetryCompletion(
      failedState,
      collector.snapshot(),
    ),
    {
      finalStatus: "failed",
      failureReason: "planning budget exhausted",
      attempts: {
        planning: 2,
        review: 1,
        task: 1,
      },
      files: {
        read: 2,
        changed: [],
      },
      llmCalls: [
        {
          role: "planner",
          model: "planner-model",
          elapsedSeconds: 1.5,
          promptTokens: 100,
          completionTokens: 25,
          totalTokens: 125,
        },
      ],
    },
  );

  assert.throws(
    () =>
      buildRunTelemetryCompletion(
        {
          ...completedState,
          status: "planning",
        },
        collector.snapshot(),
      ),
    /Run telemetry requires a terminal graph status/,
  );
} finally {
  await rm(rootDirectory, {
    recursive: true,
    force: true,
  });
}

console.log("✅ H0-001 Step 6 telemetry integration acceptance passed.");
