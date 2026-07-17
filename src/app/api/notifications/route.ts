import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { storage } from "@/lib/db/storage";
import {
  ApiError,
  getIdentity,
  requireRole,
} from "@/lib/api/authz";
import { parseJson, toErrorResponse } from "@/lib/api/http";
import { notificationCreateSchema } from "@/lib/api/schemas";

export async function GET(request: Request) {
  try {
    const identity = getIdentity(await auth());
    const { searchParams } = new URL(request.url);
    const onlyCount = searchParams.get("count") === "1";

    if (onlyCount) {
      const count = await storage.getUnreadNotificationCount(identity.id);
      return NextResponse.json({ unread: count });
    }

    const requestedLimit = Number(searchParams.get("limit") ?? 20);
    const limit = Number.isInteger(requestedLimit)
      ? Math.min(100, Math.max(1, requestedLimit))
      : 20;
    const items = await storage.getNotificationsByUser(identity.id, limit);
    const unread = await storage.getUnreadNotificationCount(identity.id);
    return NextResponse.json({ items, unread });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const identity = requireRole(getIdentity(await auth()), "admin");
    const input = await parseJson(request, notificationCreateSchema);
    const recipient = await storage.getUser(input.userId);
    if (!recipient) {
      throw new ApiError(404, "Penerima tidak ditemukan", "NOT_FOUND");
    }
    const created = await storage.createNotification({
      ...input,
      read: false,
    });
    await storage.createAuditEvent({
      actorId: identity.id,
      action: "notification.created",
      entityType: "notification",
      entityId: created.id,
      details: { userId: input.userId, type: input.type },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
