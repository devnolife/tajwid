import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getCertificateByNumber: vi.fn() }));

vi.mock("@/lib/db/storage", () => ({
  storage: { getCertificateByNumber: mocks.getCertificateByNumber },
}));

import { GET } from "@/app/api/certificates/verify/[number]/route";

const params = { params: Promise.resolve({ number: "TJW-2026-TEST" }) };

describe("public certificate verification", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns a public-safe not-found response", async () => {
    mocks.getCertificateByNumber.mockResolvedValue(undefined);
    const response = await GET(new Request("http://localhost"), params);
    expect(response.status).toBe(404);
  });

  it("does not expose storage errors", async () => {
    mocks.getCertificateByNumber.mockRejectedValue(
      new Error("database-password=secret"),
    );
    const response = await GET(new Request("http://localhost"), params);

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      valid: false,
      message: "Terjadi kesalahan server",
    });
  });
});
