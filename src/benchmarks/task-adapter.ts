import type { NormalizedHarnessTask } from "../intake/contracts.js";
import { normalizeHarnessTask } from "../intake/normalize.js";
import type { BenchmarkTask } from "./contracts.js";

export function adaptBenchmarkTaskToHarnessTask(
  benchmark: BenchmarkTask,
): NormalizedHarnessTask {
  return normalizeHarnessTask({
    id: benchmark.id,
    source: "benchmark",
    repository: benchmark.repository,
    request: benchmark.task,
    constraints: benchmark.constraints,
    acceptanceCriteria: benchmark.successCriteria,
  });
}
