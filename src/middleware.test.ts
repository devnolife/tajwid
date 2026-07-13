import { describe, expect, it } from "vitest";
import { isPublicPath } from "@/middleware";

describe("middleware public path boundaries", () => {
  it("allows intended public route trees", () => {
    expect(isPublicPath("/login")).toBe(true);
    expect(isPublicPath("/api/auth/session")).toBe(true);
    expect(isPublicPath("/verify/TJW-2026-ABC")).toBe(true);
    expect(isPublicPath("/api/certificates/check")).toBe(true);
  });

  it("does not allow lookalike prefixes", () => {
    expect(isPublicPath("/api/authentication/internal")).toBe(false);
    expect(isPublicPath("/api/certificates/check-admin")).toBe(false);
    expect(isPublicPath("/login-backdoor")).toBe(false);
  });
});
