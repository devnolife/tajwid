import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { storage } from "@/lib/db/storage";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }
  if ((session.user as any).role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const user = await storage.updateUser(id, body);
    if (!user) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    const { password, ...sanitized } = user;
    return NextResponse.json(sanitized);
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }
  if ((session.user as any).role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    await storage.deleteUser(id);
    return NextResponse.json({ message: "User deleted" });
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 400 });
  }
}
