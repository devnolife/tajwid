import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { storage } from "@/lib/db/storage";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role");

  if (role) {
    const users = await storage.getUsersByRole(role);
    const sanitized = users.map(({ password, ...rest }) => rest);
    return NextResponse.json(sanitized);
  }

  const [mahasiswa, instruktur] = await Promise.all([
    storage.getUsersByRole("mahasiswa"),
    storage.getUsersByRole("instruktur"),
  ]);
  const users = [...mahasiswa, ...instruktur];
  const sanitized = users.map(({ password, ...rest }) => rest);
  return NextResponse.json(sanitized);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }
  if ((session.user as any).role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const user = await storage.createUser(body);
    const { password, ...sanitized } = user;
    return NextResponse.json(sanitized);
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 400 });
  }
}
