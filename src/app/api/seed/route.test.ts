import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), seedDatabase: vi.fn() }));

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db/seed", () => ({ seedDatabase: mocks.seedDatabase }));

import { POST } from "@/app/api/seed/route";

describe("seed endpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NODE_ENV", "development");
  });

  it("requires an administrator even in development", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "student-1", role: "mahasiswa" },
    });
    expect((await POST()).status).toBe(403);
    expect(mocks.seedDatabase).not.toHaveBeenCalled();

    mocks.auth.mockResolvedValue({ user: { id: "admin-1", role: "admin" } });
    expect((await POST()).status).toBe(200);
    expect(mocks.seedDatabase).toHaveBeenCalledOnce();
  });
});
