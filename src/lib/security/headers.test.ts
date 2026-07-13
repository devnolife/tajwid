import { describe, expect, it } from "vitest";
import { getSecurityHeaders } from "@/lib/security/headers";

describe("HTTP security headers", () => {
  it("sets browser hardening and a restrictive CSP", () => {
    const headers = Object.fromEntries(
      getSecurityHeaders().map(({ key, value }) => [key, value]),
    );

    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["Permissions-Policy"]).toContain("camera=()");
    expect(headers["Content-Security-Policy"]).toContain("default-src 'self'");
    expect(headers["Content-Security-Policy"]).toContain("object-src 'none'");
    expect(headers["Content-Security-Policy"]).toContain("frame-ancestors 'none'");
  });

  it("enables insecure-request upgrades only in production", () => {
    const development = Object.fromEntries(
      getSecurityHeaders({ NODE_ENV: "development" }).map(({ key, value }) => [key, value]),
    );
    const production = Object.fromEntries(
      getSecurityHeaders({ NODE_ENV: "production" }).map(({ key, value }) => [key, value]),
    );

    expect(development["Content-Security-Policy"]).not.toContain(
      "upgrade-insecure-requests",
    );
    expect(production["Content-Security-Policy"]).toContain(
      "upgrade-insecure-requests",
    );
    expect(development["Content-Security-Policy"]).toContain("'unsafe-eval'");
    expect(production["Content-Security-Policy"]).not.toContain("'unsafe-eval'");
  });
});
