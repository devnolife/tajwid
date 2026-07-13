import { describe, expect, it } from "vitest";
import { FixedWindowRateLimiter } from "@/lib/security/rate-limit";

describe("fixed-window rate limiter", () => {
  it("blocks a key after the configured attempts and resets after the window", () => {
    let now = 1_000;
    const limiter = new FixedWindowRateLimiter({
      limit: 3,
      windowMs: 60_000,
      now: () => now,
    });

    expect(limiter.consume("login:admin").allowed).toBe(true);
    expect(limiter.consume("login:admin").allowed).toBe(true);
    expect(limiter.consume("login:admin").allowed).toBe(true);
    const blocked = limiter.consume("login:admin");
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(60);

    now += 60_001;
    expect(limiter.consume("login:admin").allowed).toBe(true);
  });

  it("can clear failures after a successful login", () => {
    const limiter = new FixedWindowRateLimiter({ limit: 1, windowMs: 60_000 });
    limiter.consume("login:admin");
    expect(limiter.consume("login:admin").allowed).toBe(false);
    limiter.reset("login:admin");
    expect(limiter.consume("login:admin").allowed).toBe(true);
  });
});
