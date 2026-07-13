import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), getSettings: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db/storage", () => ({ storage: mocks }));

import { GET } from "@/app/api/settings/public/route";

describe("public authenticated settings", () => {
  it("returns workflow settings to any authenticated role", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "instructor-1", role: "instruktur" },
    });
    mocks.getSettings.mockResolvedValue({
      id: "settings-1",
      appName: "TajwidKu",
      academicYear: "2026/2027",
      passingScore: 75,
      paymentAmount: "25000",
    });

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      appName: "TajwidKu",
      academicYear: "2026/2027",
      passingScore: 75,
      paymentAmount: "25000",
    });
  });
});
