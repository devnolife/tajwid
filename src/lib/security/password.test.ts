import { describe, expect, it } from "vitest";
import { md5Hash } from "@/lib/md5";
import {
  hashPassword,
  verifyAndUpgradePassword,
  verifyPassword,
} from "@/lib/security/password";

describe("password security", () => {
  it("hashes passwords with a unique salted strong hash", async () => {
    const first = await hashPassword("correct horse battery staple");
    const second = await hashPassword("correct horse battery staple");

    expect(first).toMatch(/^scrypt\$/);
    expect(second).toMatch(/^scrypt\$/);
    expect(first).not.toBe(second);
    await expect(verifyPassword("correct horse battery staple", first, "admin")).resolves.toEqual({
      valid: true,
      needsRehash: false,
    });
    await expect(verifyPassword("wrong", first, "admin")).resolves.toEqual({
      valid: false,
      needsRehash: false,
    });
  });

  it("accepts a legacy plaintext staff password only for migration", async () => {
    await expect(verifyPassword("password123", "password123", "instruktur")).resolves.toEqual({
      valid: true,
      needsRehash: true,
    });
    await expect(verifyPassword("wrong", "password123", "instruktur")).resolves.toEqual({
      valid: false,
      needsRehash: true,
    });
  });

  it("accepts a legacy MD5 student password only for migration", async () => {
    const legacyHash = md5Hash("tajwid123");

    await expect(verifyPassword("tajwid123", legacyHash, "mahasiswa")).resolves.toEqual({
      valid: true,
      needsRehash: true,
    });
    await expect(verifyPassword("wrong", legacyHash, "mahasiswa")).resolves.toEqual({
      valid: false,
      needsRehash: true,
    });
  });

  it("upgrades a valid legacy password and never upgrades an invalid one", async () => {
    const upgraded: string[] = [];

    await expect(
      verifyAndUpgradePassword(
        "password123",
        "password123",
        "admin",
        async (encoded) => upgraded.push(encoded),
      ),
    ).resolves.toBe(true);
    expect(upgraded).toHaveLength(1);
    expect(upgraded[0]).toMatch(/^scrypt\$/);

    await expect(
      verifyAndUpgradePassword(
        "wrong",
        "password123",
        "admin",
        async (encoded) => upgraded.push(encoded),
      ),
    ).resolves.toBe(false);
    expect(upgraded).toHaveLength(1);
  });
});
