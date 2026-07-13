import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { storage } from "@/lib/db/storage";
import { ApiError, getIdentity, requireRole } from "@/lib/api/authz";
import { toPublicUser } from "@/lib/api/dto";
import { parseJson, toErrorResponse } from "@/lib/api/http";
import { userUpdateSchema } from "@/lib/api/schemas";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const identity = requireRole(getIdentity(await auth()), "admin");
    const { id } = await params;
    const input = await parseJson(request, userUpdateSchema);
    const user = await storage.updateUser(id, input);
    if (!user) {
      throw new ApiError(404, "User not found", "NOT_FOUND");
    }
    await storage.createAuditEvent({
      actorId: identity.id,
      action: "user.updated",
      entityType: "user",
      entityId: user.id,
      details: { fields: Object.keys(input) },
    });
    return NextResponse.json(toPublicUser(user));
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const identity = requireRole(getIdentity(await auth()), "admin");
    const { id } = await params;
    if (id === identity.id) {
      throw new ApiError(400, "Tidak dapat menghapus akun sendiri", "INVALID_OPERATION");
    }
    await storage.deleteUser(id);
    await storage.createAuditEvent({
      actorId: identity.id,
      action: "user.deleted",
      entityType: "user",
      entityId: id,
      details: null,
    });
    return NextResponse.json({ message: "User deleted" });
  } catch (error) {
    return toErrorResponse(error);
  }
}
