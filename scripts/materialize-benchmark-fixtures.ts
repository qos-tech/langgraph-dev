import {
  B04_SOURCE_COMMIT,
  B05_SOURCE_COMMIT,
  materializeBenchmarkFixtures,
} from "../src/benchmarks/fixture-materializer.js";

const fixtureRoot = process.env.QOS_BENCHMARK_FIXTURE_ROOT;
const qflowRepository = process.env.QFLOW_REPOSITORY;
const harnessRepository = process.env.HARNESS_REPOSITORY;

if (!fixtureRoot || !qflowRepository || !harnessRepository) {
  throw new Error(
    "QOS_BENCHMARK_FIXTURE_ROOT, QFLOW_REPOSITORY and HARNESS_REPOSITORY are required.",
  );
}

const fixtures = await materializeBenchmarkFixtures({
  fixtureRoot,
  qflowSource: {
    repositoryPath: qflowRepository,
    revision: B04_SOURCE_COMMIT,
  },
  harnessSource: {
    repositoryPath: harnessRepository,
    revision: B05_SOURCE_COMMIT,
  },
});

for (const fixture of fixtures) {
  console.log(
    `${fixture.repositoryId}\t${fixture.revision}\t${fixture.commit}\t${fixture.repositoryPath}`,
  );
}
