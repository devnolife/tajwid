import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { storage } from "@/lib/db/storage";

export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  const userId = (session.user as any).id;
  await storage.markAllNotificationsRead(userId);
  return NextResponse.json({ message: "ok" });
}
