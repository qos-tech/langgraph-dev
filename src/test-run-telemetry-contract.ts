import assert from "node:assert/strict";
import type {
  LlmCallTelemetry,
  RunTelemetry,
  RunTelemetryCompletion,
  RunTelemetryStart,
} from "./telemetry/contracts.js";
import {
  RUN_TELEMETRY_SCHEMA_VERSION,
} from "./telemetry/contracts.js";

const start: RunTelemetryStart = {
  runId: "run-001",
  startedAt: "2026-08-21T12:00:00.000Z",
  task: "Add GET /health",
  repositoryPath: "/tmp/example",
};

const llmCalls: readonly LlmCallTelemetry[] = [
  {
    role: "planner",
    model: "planner-model",
    elapsedSeconds: 1.25,
    promptTokens: 120,
    completionTokens: 40,
    totalTokens: 160,
  },
  {
    role: "reviewer",
    model: "review-model",
    elapsedSeconds: 0.75,
  },
];

const completion: RunTelemetryCompletion = {
  finishedAt: "2026-08-21T12:00:02.500Z",
  durationMs: 2500,
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
  llmCalls,
};

const telemetry: RunTelemetry = {
  schemaVersion: RUN_TELEMETRY_SCHEMA_VERSION,
  ...start,
  ...completion,
};

assert.equal(RUN_TELEMETRY_SCHEMA_VERSION, 1);
assert.equal(telemetry.finalStatus, "completed");
assert.equal(telemetry.attempts.planning, 2);
assert.equal(telemetry.attempts.review, 1);
assert.equal(telemetry.files.read, 4);
assert.deepEqual(telemetry.files.changed, ["src/index.ts"]);
assert.equal(telemetry.llmCalls.length, 2);
assert.equal(telemetry.llmCalls[0]?.totalTokens, 160);
assert.equal(telemetry.llmCalls[1]?.totalTokens, undefined);

// Failure reason is terminal/failure-specific rather than mandatory for every
// run record.
const failed: RunTelemetry = {
  schemaVersion: RUN_TELEMETRY_SCHEMA_VERSION,
  ...start,
  ...completion,
  finalStatus: "failed",
  failureReason: "deterministic validation failed",
};

assert.equal(failed.failureReason, "deterministic validation failed");

// Compile-time contract checks.
//
// These are intentionally kept as type assignments instead of runtime schema
// validation. Step 2 defines the internal telemetry contract; persistence and
// parsing of on-disk JSON belong to later steps.
const _terminalStatus: RunTelemetry["finalStatus"] = "completed";
const _role: LlmCallTelemetry["role"] = "refiner";

void _terminalStatus;
void _role;

console.log("✅ H0-001 Step 2 run telemetry contract passed.");
