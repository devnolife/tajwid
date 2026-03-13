import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { storage } from "@/lib/db/storage";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId");
  const instructorId = searchParams.get("instructorId");

  if (studentId) {
    const schedules = await storage.getSchedulesByStudent(studentId);
    return NextResponse.json(schedules);
  }

  if (instructorId) {
    const schedules = await storage.getSchedulesByInstructor(instructorId);
    return NextResponse.json(schedules);
  }

  const schedules = await storage.getAllSchedules();
  return NextResponse.json(schedules);
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
    const schedule = await storage.createSchedule(body);
    return NextResponse.json(schedule);
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 400 });
  }
}
