import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ApiError } from "@/lib/api/authz";
import { parseJson, toErrorResponse } from "@/lib/api/http";

describe("API HTTP helpers", () => {
  it("strictly parses JSON and rejects unknown fields", async () => {
    const request = new Request("http://localhost/api/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Valid", role: "admin" }),
    });

    await expect(
      parseJson(request, z.object({ name: z.string() }).strict()),
    ).rejects.toMatchObject({ status: 400, code: "INVALID_INPUT" });
  });

  it("returns stable public errors without leaking internal messages", async () => {
    const known = toErrorResponse(new ApiError(403, "Forbidden", "FORBIDDEN"));
    expect(known.status).toBe(403);
    await expect(known.json()).resolves.toEqual({
      message: "Forbidden",
      code: "FORBIDDEN",
    });

    const unknown = toErrorResponse(new Error("password=database-secret"));
    expect(unknown.status).toBe(500);
    await expect(unknown.json()).resolves.toEqual({
      message: "Terjadi kesalahan server",
      code: "INTERNAL_ERROR",
    });
  });
});
