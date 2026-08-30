import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { promisify } from "node:util";
import type { BenchmarkEnvironmentRequest, PreparedBenchmarkEnvironment } from "./environment.js";

const execFileAsync = promisify(execFile);

export const QFLOW_WORKFLOW_CANVAS_REPOSITORY_ID = "qflow-workflow-canvas";
export const BENCHMARK_POSTGRES_ADMIN_URL_ENV =
  "QOS_BENCHMARK_POSTGRES_ADMIN_URL";

export type PostgresAdminCommandRequest = Readonly<{
  adminUrl: string;
  sql: string;
}>;

export interface PostgresAdminCommandRunner {
  run(request: PostgresAdminCommandRequest): Promise<void>;
}

export class PsqlPostgresAdminCommandRunner
  implements PostgresAdminCommandRunner
{
  async run(request: PostgresAdminCommandRequest): Promise<void> {
    await execFileAsync(
      "psql",
      [
        "--no-psqlrc",
        "--set",
        "ON_ERROR_STOP=1",
        "--command",
        request.sql,
      ],
      {
        encoding: "utf8",
        env: {
          ...process.env,
          PGDATABASE: request.adminUrl,
        },
      },
    );
  }
}

export type DisposablePostgresBenchmarkEnvironmentDependencies = Readonly<{
  env?: NodeJS.ProcessEnv;
  commandRunner?: PostgresAdminCommandRunner;
  databaseNameFactory?: () => string;
}>;

function createDatabaseName(): string {
  const suffix = randomUUID().replaceAll("-", "").slice(0, 12);
  return `qos_b04_${process.pid}_${suffix}`;
}

function assertSafeDatabaseName(databaseName: string): void {
  if (!/^[a-z][a-z0-9_]{0,62}$/.test(databaseName)) {
    throw new Error(
      `Invalid disposable benchmark database name: ${databaseName}`,
    );
  }
}

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replaceAll('"', '""')}"`;
}

function readAdminUrl(env: NodeJS.ProcessEnv): string {
  const adminUrl = env[BENCHMARK_POSTGRES_ADMIN_URL_ENV]?.trim();

  if (!adminUrl) {
    throw new Error(
      `${BENCHMARK_POSTGRES_ADMIN_URL_ENV} is required for the Q-Flow B04 benchmark environment`,
    );
  }

  return adminUrl;
}

function targetDatabaseUrl(adminUrl: string, databaseName: string): string {
  const parsed = new URL(adminUrl);

  if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
    throw new Error(
      `${BENCHMARK_POSTGRES_ADMIN_URL_ENV} must use postgres:// or postgresql://`,
    );
  }

  parsed.pathname = `/${databaseName}`;
  return parsed.toString();
}

export class DisposablePostgresBenchmarkEnvironmentPreparer {
  private readonly env: NodeJS.ProcessEnv;
  private readonly commandRunner: PostgresAdminCommandRunner;
  private readonly databaseNameFactory: () => string;

  constructor(
    dependencies: DisposablePostgresBenchmarkEnvironmentDependencies = {},
  ) {
    this.env = dependencies.env ?? process.env;
    this.commandRunner =
      dependencies.commandRunner ?? new PsqlPostgresAdminCommandRunner();
    this.databaseNameFactory =
      dependencies.databaseNameFactory ?? createDatabaseName;
  }

  async prepare(
    request: BenchmarkEnvironmentRequest,
  ): Promise<PreparedBenchmarkEnvironment> {
    if (
      request.benchmark.repository.id !==
      QFLOW_WORKFLOW_CANVAS_REPOSITORY_ID
    ) {
      return {
        env: {},
        cleanup: async () => {},
      };
    }

    const adminUrl = readAdminUrl(this.env);
    const databaseName = this.databaseNameFactory();
    assertSafeDatabaseName(databaseName);

    const databaseUrl = targetDatabaseUrl(adminUrl, databaseName);
    const quotedDatabaseName = quoteIdentifier(databaseName);

    await this.commandRunner.run({
      adminUrl,
      sql: `CREATE DATABASE ${quotedDatabaseName} TEMPLATE template0;`,
    });

    return {
      env: {
        DATABASE_URL: databaseUrl,
        TEST_DATABASE_URL: databaseUrl,
      },
      cleanup: async () => {
        await this.commandRunner.run({
          adminUrl,
          sql: `DROP DATABASE IF EXISTS ${quotedDatabaseName} WITH (FORCE);`,
        });
      },
    };
  }
}
