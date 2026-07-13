import { describe, expect, it, vi } from "vitest";
import { createLogger } from "@/lib/logger";

describe("structured logger", () => {
  it("emits JSON and redacts sensitive fields recursively", () => {
    const write = vi.fn();
    const logger = createLogger(write);

    logger.error("api.request.failed", {
      requestId: "request-1",
      username: "admin",
      password: "database-secret",
      nested: { token: "jwt-secret", status: 500 },
    });

    const entry = JSON.parse(write.mock.calls[0][0]);
    expect(entry).toMatchObject({
      level: "error",
      event: "api.request.failed",
      requestId: "request-1",
      username: "admin",
      password: "[REDACTED]",
      nested: { token: "[REDACTED]", status: 500 },
    });
    expect(entry.timestamp).toEqual(expect.any(String));
  });
});
