import { describe, expect, it } from "vitest";
import { getDatabasePoolConfig } from "@/lib/db/config";

describe("database pool configuration", () => {
  it("requires a database URL", () => {
    expect(() => getDatabasePoolConfig({})).toThrow("DATABASE_URL wajib");
  });

  it("applies bounded production pool, timeout, and SSL defaults", () => {
    expect(
      getDatabasePoolConfig({
        NODE_ENV: "production",
        DATABASE_URL: "postgresql://user:secret@db:5432/tajwid",
      }),
    ).toMatchObject({
      connectionString: "postgresql://user:secret@db:5432/tajwid",
      max: 10,
      connectionTimeoutMillis: 5_000,
      idleTimeoutMillis: 30_000,
      application_name: "tajwidku",
      ssl: { rejectUnauthorized: true },
    });
  });

  it("allows explicit local SSL disable and pool sizing", () => {
    expect(
      getDatabasePoolConfig({
        DATABASE_URL: "postgresql://localhost/tajwid",
        DATABASE_POOL_MAX: "4",
        DATABASE_SSL: "false",
      }),
    ).toMatchObject({ max: 4, ssl: false });
  });
});
