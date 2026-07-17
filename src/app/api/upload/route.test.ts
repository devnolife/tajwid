import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: { id: "student-1", role: "mahasiswa" },
  }),
}));

import { POST } from "@/app/api/upload/route";

describe("legacy upload endpoint", () => {
  it("is retired in favor of resource-scoped private uploads", async () => {
    const response = await POST(
      new Request("http://localhost/api/upload", {
        method: "POST",
        body: new FormData(),
      }),
    );

    expect(response.status).toBe(410);
    await expect(response.json()).resolves.toMatchObject({
      code: "UPLOAD_ENDPOINT_RETIRED",
    });
  });
});
