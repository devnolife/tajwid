import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getSettings: vi.fn(),
  updateSettings: vi.fn(),
  createAuditEvent: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db/storage", () => ({ storage: mocks }));

import { GET, PATCH } from "@/app/api/settings/route";

function request(body: unknown) {
  return new Request("http://localhost/api/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("settings API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSettings.mockResolvedValue({ passingScore: 70 });
    mocks.updateSettings.mockImplementation(async (input) => input);
  });

  it("remains admin-only", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "instructor-1", role: "instruktur" },
    });
    expect((await GET()).status).toBe(403);
    expect((await PATCH(request({ passingScore: 75 }))).status).toBe(403);
  });

  it("strictly validates and audits admin changes", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "admin-1", role: "admin" } });

    const response = await PATCH(request({ passingScore: 75 }));
    expect(response.status).toBe(200);
    expect(mocks.updateSettings).toHaveBeenCalledWith({ passingScore: 75 });
    expect(mocks.createAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: "admin-1",
        action: "settings.updated",
      }),
    );

    const injected = await PATCH(
      request({ passingScore: 75, unknownSetting: true }),
    );
    expect(injected.status).toBe(400);
    expect(mocks.updateSettings).toHaveBeenCalledTimes(1);
  });
});
