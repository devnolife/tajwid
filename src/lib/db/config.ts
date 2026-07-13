import type { PoolConfig } from "pg";

type Environment = Record<string, string | undefined>;

function positiveInteger(
  value: string | undefined,
  fallback: number,
  maximum: number,
): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= maximum
    ? parsed
    : fallback;
}

export function getDatabasePoolConfig(
  environment: Environment = process.env,
): PoolConfig {
  const connectionString = environment.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error("DATABASE_URL wajib dikonfigurasi");
  }

  const production = environment.NODE_ENV === "production";
  const sslEnabled = environment.DATABASE_SSL
    ? environment.DATABASE_SSL !== "false"
    : production;

  return {
    connectionString,
    max: positiveInteger(environment.DATABASE_POOL_MAX, 10, 50),
    connectionTimeoutMillis: positiveInteger(
      environment.DATABASE_CONNECT_TIMEOUT_MS,
      5_000,
      60_000,
    ),
    idleTimeoutMillis: positiveInteger(
      environment.DATABASE_IDLE_TIMEOUT_MS,
      30_000,
      300_000,
    ),
    application_name: "tajwidku",
    ssl: sslEnabled ? { rejectUnauthorized: true } : false,
  };
}
