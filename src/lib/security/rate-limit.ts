interface RateLimiterOptions {
  limit: number;
  windowMs: number;
  now?: () => number;
}

interface Entry {
  count: number;
  resetAt: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export class FixedWindowRateLimiter {
  private readonly entries = new Map<string, Entry>();
  private readonly now: () => number;

  constructor(private readonly options: RateLimiterOptions) {
    if (options.limit < 1 || options.windowMs < 1) {
      throw new Error("Rate limiter configuration tidak valid");
    }
    this.now = options.now ?? Date.now;
  }

  consume(key: string): RateLimitResult {
    const now = this.now();
    const current = this.entries.get(key);
    const entry =
      !current || current.resetAt <= now
        ? { count: 0, resetAt: now + this.options.windowMs }
        : current;

    if (entry.count >= this.options.limit) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1_000)),
      };
    }

    entry.count++;
    this.entries.set(key, entry);
    if (this.entries.size > 10_000) this.removeExpired(now);
    return {
      allowed: true,
      remaining: this.options.limit - entry.count,
      retryAfterSeconds: 0,
    };
  }

  reset(key: string): void {
    this.entries.delete(key);
  }

  private removeExpired(now: number): void {
    for (const [key, entry] of this.entries) {
      if (entry.resetAt <= now) this.entries.delete(key);
    }
  }
}
