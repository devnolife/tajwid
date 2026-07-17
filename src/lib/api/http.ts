import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiError } from "@/lib/api/authz";
import { logger } from "@/lib/logger";

export async function parseJson<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<T> {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    throw new ApiError(400, "JSON tidak valid", "INVALID_JSON");
  }

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    throw new ApiError(400, "Input tidak valid", "INVALID_INPUT");
  }
  return parsed.data;
}

export function toErrorResponse(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { message: error.message, code: error.code },
      { status: error.status },
    );
  }

  logger.error("api.request.failed", { error });
  return NextResponse.json(
    { message: "Terjadi kesalahan server", code: "INTERNAL_ERROR" },
    { status: 500 },
  );
}
