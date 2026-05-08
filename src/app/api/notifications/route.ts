import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { storage } from "@/lib/db/storage";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }
  const userId = (session.user as any).id;
  const { searchParams } = new URL(request.url);
  const onlyCount = searchParams.get("count") === "1";

  if (onlyCount) {
    const count = await storage.getUnreadNotificationCount(userId);
    return NextResponse.json({ unread: count });
  }

  const limit = Number(searchParams.get("limit") || 20);
  const items = await storage.getNotificationsByUser(userId, limit);
  const unread = await storage.getUnreadNotificationCount(userId);
  return NextResponse.json({ items, unread });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }
  // Only admin/instruktur can broadcast directly
  const role = (session.user as any).role;
  if (role !== "admin" && role !== "instruktur") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  try {
    const body = await request.json();
    const created = await storage.createNotification(body);
    return NextResponse.json(created);
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 400 });
  }
}
