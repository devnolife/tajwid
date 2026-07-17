import { describe, expect, it } from "vitest";
import { getAdminSeedConfig } from "@/lib/db/seed-admin-config";

describe("admin seed configuration", () => {
  it("requires a non-default password", () => {
    expect(() => getAdminSeedConfig({})).toThrow("ADMIN_PASSWORD wajib");
    expect(() =>
      getAdminSeedConfig({ ADMIN_PASSWORD: "admin123" }),
    ).toThrow("minimal 12 karakter");
  });

  it("returns profile defaults without exposing password elsewhere", () => {
    expect(
      getAdminSeedConfig({
        ADMIN_PASSWORD: "strong-admin-password",
        ADMIN_USERNAME: "root-admin",
      }),
    ).toEqual({
      username: "root-admin",
      password: "strong-admin-password",
      name: "Administrator Sistem",
      email: "admin@tajwid.local",
      phone: null,
    });
  });
});
