import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { storage } from "@/lib/db/storage";
import { hashPassword, verifyPassword } from "@/lib/security/password";
import { z } from "zod";
import { ApiError, getIdentity } from "@/lib/api/authz";
import { parseJson, toErrorResponse } from "@/lib/api/http";

const schema = z
  .object({
    currentPassword: z.string().min(1).max(128),
    newPassword: z.string().min(12).max(128),
  })
  .strict();

export async function PATCH(request: Request) {
  try {
    const identity = getIdentity(await auth());
    const { currentPassword, newPassword } = await parseJson(request, schema);
    const user = await storage.getUser(identity.id);
    if (!user) {
      throw new ApiError(404, "User not found", "NOT_FOUND");
    }

    const verification = await verifyPassword(currentPassword, user.password, user.role);
    if (!verification.valid) {
      throw new ApiError(
        400,
        "Password lama tidak sesuai",
        "INVALID_PASSWORD",
      );
    }

    await storage.updateUser(identity.id, {
      password: await hashPassword(newPassword),
    });
    await storage.createAuditEvent({
      actorId: identity.id,
      action: "user.password_changed",
      entityType: "user",
      entityId: identity.id,
      details: null,
    });

    return NextResponse.json({ message: "Password berhasil diganti" });
  } catch (error) {
    return toErrorResponse(error);
  }
}
