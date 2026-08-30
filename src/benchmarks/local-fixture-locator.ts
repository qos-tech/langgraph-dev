import { resolve } from "node:path";
import type { BenchmarkRepositoryLocator } from "./workspace.js";
import {
  BENCHMARK_FIXTURE_REVISIONS,
  type BenchmarkFixtureRepositoryId,
} from "./fixture-materializer.js";

export class LocalBenchmarkFixtureLocator
  implements BenchmarkRepositoryLocator
{
  constructor(private readonly fixtureRoot: string) {}

  async locate(repositoryId: string): Promise<string> {
    if (!(repositoryId in BENCHMARK_FIXTURE_REVISIONS)) {
      throw new Error(`Unknown benchmark fixture repository: ${repositoryId}`);
    }

    return resolve(
      this.fixtureRoot,
      repositoryId as BenchmarkFixtureRepositoryId,
    );
  }
}
