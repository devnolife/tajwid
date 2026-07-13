import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUserByNim: vi.fn(),
  getAssessmentByStudent: vi.fn(),
  getCertificateByStudent: vi.fn(),
}));

vi.mock("@/lib/db/storage", () => ({ storage: mocks }));

import { GET } from "@/app/api/certificates/check/route";

const key = "vVY09FOEw7hb-KyJkFO4q1QFx3xrc3msoT_WfP94bE0";

function request(apiKey?: string) {
  return new Request("http://localhost/api/certificates/check?nim=2024101001", {
    headers: apiKey ? { "x-api-key": apiKey } : undefined,
  });
}

describe("certificate integration lookup", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    mocks.getUserByNim.mockResolvedValue(undefined);
  });

  it("fails closed when no integration key is configured", async () => {
    expect((await GET(request())).status).toBe(503);
  });

  it("requires the configured key without a public fallback", async () => {
    vi.stubEnv("CERTIFICATE_API_KEY", key);
    expect((await GET(request("wrong"))).status).toBe(401);
    expect((await GET(request(key))).status).toBe(200);
  });
});
