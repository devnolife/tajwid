import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ execute: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { execute: mocks.execute } }));

import { GET } from "@/app/api/health/route";

describe("health readiness endpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reports ready only when the database responds", async () => {
    mocks.execute.mockResolvedValue({ rows: [{ ok: 1 }] });
    const ready = await GET();
    expect(ready.status).toBe(200);
    await expect(ready.json()).resolves.toEqual({ status: "ok" });

    mocks.execute.mockRejectedValue(new Error("database unavailable"));
    const unavailable = await GET();
    expect(unavailable.status).toBe(503);
    await expect(unavailable.json()).resolves.toEqual({ status: "unavailable" });
  });
});
