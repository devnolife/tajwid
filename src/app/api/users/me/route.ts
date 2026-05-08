import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { storage } from "@/lib/db/storage";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }
  const id = (session.user as any).id;
  const user = await storage.getUser(id);
  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }
  const { password, ...sanitized } = user;
  return NextResponse.json(sanitized);
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }
  const id = (session.user as any).id;

  try {
    const body = await request.json();
    // Whitelist fields user can edit on themselves
    const allowed: Record<string, unknown> = {};
    for (const k of ["name", "email", "phone", "faculty", "program", "specialization"]) {
      if (k in body) allowed[k] = body[k];
    }
    const user = await storage.updateUser(id, allowed as any);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    const { password, ...sanitized } = user;
    return NextResponse.json(sanitized);
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 400 });
  }
}
