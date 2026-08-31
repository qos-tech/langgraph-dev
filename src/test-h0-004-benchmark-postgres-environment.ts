import assert from "node:assert/strict";
import {
  BENCHMARK_TASK_SCHEMA_VERSION,
  defineBenchmarkTask,
  type BenchmarkTask,
} from "./benchmarks/contracts.js";
import type {
  PostgresAdminCommandRequest,
  PostgresAdminCommandRunner,
} from "./benchmarks/postgres-environment.js";
import {
  BENCHMARK_POSTGRES_ADMIN_URL_ENV,
  DisposablePostgresBenchmarkEnvironmentPreparer,
  postgresConnectionEnvironment,
} from "./benchmarks/postgres-environment.js";

function benchmark(repositoryId: string): BenchmarkTask {
  return defineBenchmarkTask({
    schemaVersion: BENCHMARK_TASK_SCHEMA_VERSION,
    id: repositoryId === "qflow-workflow-canvas" ? "B04" : "B01",
    title: "Postgres environment test",
    difficulty:
      repositoryId === "qflow-workflow-canvas" ? "cross-file" : "trivial",
    task: "Exercise benchmark environment preparation.",
    repository: {
      id: repositoryId,
      revision:
        repositoryId === "qflow-workflow-canvas" ? "b04-v1" : "b01-v1",
    },
    constraints: ["Preserve existing behavior."],
    successCriteria: ["Environment preparation is deterministic."],
    validationCommands: ["npm test"],
    expectedOutcome: "changes_required",
  });
}

class RecordingCommandRunner implements PostgresAdminCommandRunner {
  readonly requests: PostgresAdminCommandRequest[] = [];
  failure?: Error;

  async run(request: PostgresAdminCommandRequest): Promise<void> {
    this.requests.push(request);

    if (this.failure) {
      throw this.failure;
    }
  }
}

const workspace = {
  repositoryPath: "/isolated/benchmark",
};

{
  assert.deepEqual(
    postgresConnectionEnvironment(
      "postgresql://qflow:p%40ss@db.example.test:5544/postgres?sslmode=require",
    ),
    {
      PGHOST: "db.example.test",
      PGPORT: "5544",
      PGUSER: "qflow",
      PGPASSWORD: "p@ss",
      PGDATABASE: "postgres",
      PGSSLMODE: "require",
    },
    "psql admin commands must receive explicit libpq connection environment instead of treating the URI as a database name",
  );

  assert.deepEqual(
    postgresConnectionEnvironment(
      "postgres://localhost/postgres",
    ),
    {
      PGHOST: "localhost",
      PGDATABASE: "postgres",
    },
  );

  assert.throws(
    () => postgresConnectionEnvironment("file:///tmp/postgres"),
    new RegExp(BENCHMARK_POSTGRES_ADMIN_URL_ENV),
  );
}

{
  const runner = new RecordingCommandRunner();
  const preparer = new DisposablePostgresBenchmarkEnvironmentPreparer({
    env: {},
    commandRunner: runner,
    databaseNameFactory: () => "qos_b04_unused",
  });

  const prepared = await preparer.prepare({
    benchmark: benchmark("fixture-simple-api"),
    workspace,
  });

  assert.deepEqual(prepared.env, {});
  await prepared.cleanup();
  assert.equal(
    runner.requests.length,
    0,
    "non-Q-Flow benchmarks must remain no-op environments",
  );
}

{
  const runner = new RecordingCommandRunner();
  const preparer = new DisposablePostgresBenchmarkEnvironmentPreparer({
    env: {},
    commandRunner: runner,
    databaseNameFactory: () => "qos_b04_missing_admin",
  });

  await assert.rejects(
    preparer.prepare({
      benchmark: benchmark("qflow-workflow-canvas"),
      workspace,
    }),
    new RegExp(BENCHMARK_POSTGRES_ADMIN_URL_ENV),
  );

  assert.equal(runner.requests.length, 0);
}

{
  const runner = new RecordingCommandRunner();
  const sourceEnv = {
    [BENCHMARK_POSTGRES_ADMIN_URL_ENV]:
      "postgresql://qflow:qflow@localhost:5432/postgres?sslmode=disable",
    UNRELATED_VALUE: "preserved",
  };

  const preparer = new DisposablePostgresBenchmarkEnvironmentPreparer({
    env: sourceEnv,
    commandRunner: runner,
    databaseNameFactory: () => "qos_b04_test_123",
  });

  const prepared = await preparer.prepare({
    benchmark: benchmark("qflow-workflow-canvas"),
    workspace,
  });

  const expectedDatabaseUrl =
    "postgresql://qflow:qflow@localhost:5432/qos_b04_test_123?sslmode=disable";

  assert.deepEqual(prepared.env, {
    DATABASE_URL: expectedDatabaseUrl,
    TEST_DATABASE_URL: expectedDatabaseUrl,
  });

  assert.deepEqual(runner.requests, [
    {
      adminUrl:
        "postgresql://qflow:qflow@localhost:5432/postgres?sslmode=disable",
      sql: 'CREATE DATABASE "qos_b04_test_123" TEMPLATE template0;',
    },
  ]);

  assert.deepEqual(sourceEnv, {
    [BENCHMARK_POSTGRES_ADMIN_URL_ENV]:
      "postgresql://qflow:qflow@localhost:5432/postgres?sslmode=disable",
    UNRELATED_VALUE: "preserved",
  });

  await prepared.cleanup();

  assert.deepEqual(runner.requests.at(-1), {
    adminUrl:
      "postgresql://qflow:qflow@localhost:5432/postgres?sslmode=disable",
    sql: 'DROP DATABASE IF EXISTS "qos_b04_test_123" WITH (FORCE);',
  });
}

{
  const runner = new RecordingCommandRunner();
  const preparer = new DisposablePostgresBenchmarkEnvironmentPreparer({
    env: {
      [BENCHMARK_POSTGRES_ADMIN_URL_ENV]:
        "postgresql://qflow:qflow@localhost:5432/postgres",
    },
    commandRunner: runner,
    databaseNameFactory: () => "unsafe-name;drop database qflow_test",
  });

  await assert.rejects(
    preparer.prepare({
      benchmark: benchmark("qflow-workflow-canvas"),
      workspace,
    }),
    /Invalid disposable benchmark database name/,
  );

  assert.equal(
    runner.requests.length,
    0,
    "invalid generated names must fail before any PostgreSQL command",
  );
}

{
  const createFailure = new Error("create database failed");
  const runner = new RecordingCommandRunner();
  runner.failure = createFailure;

  const preparer = new DisposablePostgresBenchmarkEnvironmentPreparer({
    env: {
      [BENCHMARK_POSTGRES_ADMIN_URL_ENV]:
        "postgresql://qflow:qflow@localhost:5432/postgres",
    },
    commandRunner: runner,
    databaseNameFactory: () => "qos_b04_create_failure",
  });

  await assert.rejects(
    preparer.prepare({
      benchmark: benchmark("qflow-workflow-canvas"),
      workspace,
    }),
    (error: unknown) => error === createFailure,
  );

  assert.equal(runner.requests.length, 1);
}

{
  const cleanupFailure = new Error("drop database failed");
  const runner: PostgresAdminCommandRunner = {
    async run(request): Promise<void> {
      if (request.sql.startsWith("DROP DATABASE")) {
        throw cleanupFailure;
      }
    },
  };

  const preparer = new DisposablePostgresBenchmarkEnvironmentPreparer({
    env: {
      [BENCHMARK_POSTGRES_ADMIN_URL_ENV]:
        "postgresql://qflow:qflow@localhost:5432/postgres",
    },
    commandRunner: runner,
    databaseNameFactory: () => "qos_b04_cleanup_failure",
  });

  const prepared = await preparer.prepare({
    benchmark: benchmark("qflow-workflow-canvas"),
    workspace,
  });

  await assert.rejects(
    prepared.cleanup(),
    (error: unknown) => error === cleanupFailure,
  );
}

console.log(
  "✅ H0-004 Step 2B disposable PostgreSQL benchmark environment passed.",
);
