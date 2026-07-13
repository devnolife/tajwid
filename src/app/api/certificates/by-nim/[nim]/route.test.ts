import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ limit: vi.fn() }));

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({ limit: mocks.limit })),
        })),
      })),
    })),
  },
}));

import { GET } from "@/app/api/certificates/by-nim/[nim]/route";

const key = "vVY09FOEw7hb-KyJkFO4q1QFx3xrc3msoT_WfP94bE0";
const params = { params: Promise.resolve({ nim: "2024101001" }) };

describe("certificate lookup by NIM", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    mocks.limit.mockResolvedValue([]);
  });

  it("fails closed without a configured integration key", async () => {
    const response = await GET(new Request("http://localhost"), params);
    expect(response.status).toBe(503);
    expect(mocks.limit).not.toHaveBeenCalled();
  });

  it("requires the integration key before querying by NIM", async () => {
    vi.stubEnv("CERTIFICATE_API_KEY", key);
    const unauthorized = await GET(new Request("http://localhost"), params);
    expect(unauthorized.status).toBe(401);
    expect(mocks.limit).not.toHaveBeenCalled();

    const authorized = await GET(
      new Request("http://localhost", {
        headers: { "x-api-key": key },
      }),
      params,
    );
    expect(authorized.status).toBe(404);
    expect(mocks.limit).toHaveBeenCalledOnce();
  });
});
