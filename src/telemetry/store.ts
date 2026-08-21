import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { RunTelemetry } from "./contracts.js";

export type PersistedRunTelemetry = Readonly<{
  path: string;
}>;

export interface RunTelemetryStore {
  save(telemetry: RunTelemetry): Promise<PersistedRunTelemetry>;
}

export type JsonRunTelemetryStoreOptions = Readonly<{
  rootDirectory?: string;
}>;

function assertSafeRunId(runId: string): void {
  const safeRunIdPattern = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

  if (
    !safeRunIdPattern.test(runId) ||
    runId === "." ||
    runId === ".."
  ) {
    throw new Error(`Run telemetry runId is not filename-safe: ${runId}`);
  }
}

export function createJsonRunTelemetryStore(
  options: JsonRunTelemetryStoreOptions = {},
): RunTelemetryStore {
  const rootDirectory = options.rootDirectory ?? process.cwd();

  return {
    async save(telemetry) {
      assertSafeRunId(telemetry.runId);

      const runsDirectory = path.join(rootDirectory, ".runs");
      const telemetryPath = path.join(
        runsDirectory,
        `${telemetry.runId}.json`,
      );

      await mkdir(runsDirectory, {
        recursive: true,
      });

      await writeFile(
        telemetryPath,
        `${JSON.stringify(telemetry, null, 2)}\n`,
        {
          encoding: "utf8",
          flag: "wx",
        },
      );

      return {
        path: telemetryPath,
      };
    },
  };
}
