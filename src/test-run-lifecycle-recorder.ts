import assert from "node:assert/strict";
import {
  createRunLifecycleRecorder,
  type RunTelemetryClock,
} from "./telemetry/recorder.js";

function clockFrom(...values: readonly string[]): RunTelemetryClock {
  let index = 0;

  return () => {
    const value = values[index];

    if (!value) {
      throw new Error("Test clock exhausted.");
    }

    index += 1;
    return new Date(value);
  };
}

const recorder = createRunLifecycleRecorder({
  createRunId: () => "run-fixed-001",
  now: clockFrom(
    "2026-08-21T12:00:00.000Z",
    "2026-08-21T12:00:02.500Z",
  ),
});

const activeRun = recorder.start({
  task: "Add GET /health",
  repositoryPath: "/tmp/example",
});

assert.deepEqual(activeRun.start, {
  runId: "run-fixed-001",
  startedAt: "2026-08-21T12:00:00.000Z",
  task: "Add GET /health",
  repositoryPath: "/tmp/example",
});

const completed = activeRun.complete({
  finalStatus: "completed",
  attempts: {
    planning: 2,
    review: 1,
    task: 0,
  },
  files: {
    read: 4,
    changed: ["src/index.ts"],
  },
  llmCalls: [],
});

assert.deepEqual(completed, {
  schemaVersion: 1,
  runId: "run-fixed-001",
  startedAt: "2026-08-21T12:00:00.000Z",
  finishedAt: "2026-08-21T12:00:02.500Z",
  durationMs: 2500,
  task: "Add GET /health",
  repositoryPath: "/tmp/example",
  finalStatus: "completed",
  attempts: {
    planning: 2,
    review: 1,
    task: 0,
  },
  files: {
    read: 4,
    changed: ["src/index.ts"],
  },
  llmCalls: [],
});

const failedRecorder = createRunLifecycleRecorder({
  createRunId: () => "run-failed-001",
  now: clockFrom(
    "2026-08-21T13:00:00.000Z",
    "2026-08-21T13:00:01.000Z",
  ),
});

const failed = failedRecorder
  .start({
    task: "Fail deterministically",
    repositoryPath: "/tmp/example",
  })
  .complete({
    finalStatus: "failed",
    failureReason: "typecheck failed",
    attempts: {
      planning: 1,
      review: 0,
      task: 1,
    },
    files: {
      read: 2,
      changed: [],
    },
    llmCalls: [],
  });

assert.equal(failed.finalStatus, "failed");
assert.equal(failed.failureReason, "typecheck failed");
assert.equal(failed.durationMs, 1000);

// Wall-clock adjustments must not produce a negative benchmark duration.
const backwardsClockRecorder = createRunLifecycleRecorder({
  createRunId: () => "run-clock-adjustment",
  now: clockFrom(
    "2026-08-21T14:00:01.000Z",
    "2026-08-21T14:00:00.000Z",
  ),
});

const adjusted = backwardsClockRecorder
  .start({
    task: "Clock adjustment",
    repositoryPath: "/tmp/example",
  })
  .complete({
    finalStatus: "completed",
    attempts: {
      planning: 0,
      review: 0,
      task: 0,
    },
    files: {
      read: 0,
      changed: [],
    },
    llmCalls: [],
  });

assert.equal(adjusted.durationMs, 0);

// Invalid injected clocks fail deterministically instead of producing invalid
// timestamps or NaN durations.
assert.throws(
  () =>
    createRunLifecycleRecorder({
      createRunId: () => "run-invalid-clock",
      now: () => new Date("not-a-date"),
    }).start({
      task: "Invalid clock",
      repositoryPath: "/tmp/example",
    }),
  /Run telemetry start clock value is invalid/,
);

console.log("✅ H0-001 Step 3 run lifecycle recorder passed.");
