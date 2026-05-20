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
  const role = (session.user as any).role;
  const userId = (session.user as any).id;
  const { id } = await params;

  try {
    const body = await request.json();
    if (body.date && typeof body.date === "string") {
      body.date = new Date(body.date);
    }

    if (role !== "admin") {
      const existing = await storage.getSchedule(id);
      if (!existing) {
        return NextResponse.json({ message: "Not found" }, { status: 404 });
      }
      if (role !== "instruktur" || existing.instructorId !== userId) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      }
      // Instruktur hanya boleh mengubah status sesinya sendiri
      const allowed: any = {};
      if (body.status) allowed.status = body.status;
      const schedule = await storage.updateSchedule(id, allowed);
      return NextResponse.json(schedule);
    }

    const schedule = await storage.updateSchedule(id, body);
    if (!schedule) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    return NextResponse.json(schedule);
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
    await storage.deleteSchedule(id);
    return NextResponse.json({ message: "Schedule deleted" });
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 400 });
  }
}
