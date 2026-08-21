import assert from "node:assert/strict";
import {
  mkdtemp,
  readFile,
  readdir,
  rm,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { RunTelemetry } from "./telemetry/contracts.js";
import { createJsonRunTelemetryStore } from "./telemetry/store.js";

const rootDirectory = await mkdtemp(
  path.join(os.tmpdir(), "qos-run-telemetry-store-"),
);

try {
  const store = createJsonRunTelemetryStore({
    rootDirectory,
  });

  const telemetry: RunTelemetry = {
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
  };

  const persisted = await store.save(telemetry);
  const expectedPath = path.join(
    rootDirectory,
    ".runs",
    "run-fixed-001.json",
  );

  assert.equal(persisted.path, expectedPath);

  const serialized = await readFile(expectedPath, "utf8");

  assert.equal(serialized.endsWith("\n"), true);
  assert.deepEqual(JSON.parse(serialized), telemetry);

  const runFiles = await readdir(path.join(rootDirectory, ".runs"));

  assert.deepEqual(runFiles, ["run-fixed-001.json"]);

  // Existing run records must not be silently overwritten.
  await assert.rejects(
    () => store.save(telemetry),
    (error: unknown) =>
      error instanceof Error &&
      "code" in error &&
      error.code === "EEXIST",
  );

  // A runId is also a filename. Reject traversal/path syntax before touching
  // the filesystem outside the dedicated .runs directory.
  const unsafeTelemetry: RunTelemetry = {
    ...telemetry,
    runId: "../escape",
  };

  await assert.rejects(
    () => store.save(unsafeTelemetry),
    /Run telemetry runId is not filename-safe/,
  );

  assert.deepEqual(
    await readdir(rootDirectory),
    [".runs"],
  );
} finally {
  await rm(rootDirectory, {
    recursive: true,
    force: true,
  });
}

console.log("✅ H0-001 Step 4 run telemetry persistence passed.");
