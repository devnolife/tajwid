import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { storage } from "@/lib/db/storage";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  const userId = (session.user as any).id;
  const { id } = await params;
  await storage.markNotificationRead(id, userId);
  return NextResponse.json({ message: "ok" });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  const userId = (session.user as any).id;
  const { id } = await params;
  await storage.deleteNotification(id, userId);
  return NextResponse.json({ message: "ok" });
}
