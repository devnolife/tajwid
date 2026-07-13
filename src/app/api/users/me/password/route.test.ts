import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getUser: vi.fn(),
  updateUser: vi.fn(),
  createAuditEvent: vi.fn(),
  verifyPassword: vi.fn(),
  hashPassword: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db/storage", () => ({ storage: mocks }));
vi.mock("@/lib/security/password", () => ({
  verifyPassword: mocks.verifyPassword,
  hashPassword: mocks.hashPassword,
}));

import { PATCH } from "@/app/api/users/me/password/route";

function request(body: unknown) {
  return new Request("http://localhost/api/users/me/password", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("change password API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ user: { id: "user-1", role: "admin" } });
    mocks.getUser.mockResolvedValue({
      id: "user-1",
      role: "admin",
      password: "scrypt$existing",
    });
    mocks.verifyPassword.mockResolvedValue({ valid: true, needsRehash: false });
    mocks.hashPassword.mockResolvedValue("scrypt$new");
  });

  it("requires a strong password and rejects unknown fields", async () => {
    expect(
      (
        await PATCH(
          request({ currentPassword: "old", newPassword: "short123" }),
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await PATCH(
          request({
            currentPassword: "old",
            newPassword: "a-strong-password",
            role: "admin",
          }),
        )
      ).status,
    ).toBe(400);
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it("hashes and audits a valid password change", async () => {
    const response = await PATCH(
      request({
        currentPassword: "old-password",
        newPassword: "a-strong-password",
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.verifyPassword).toHaveBeenCalledWith(
      "old-password",
      "scrypt$existing",
      "admin",
    );
    expect(mocks.updateUser).toHaveBeenCalledWith("user-1", {
      password: "scrypt$new",
    });
    expect(mocks.createAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: "user-1",
        action: "user.password_changed",
      }),
    );
  });
});
