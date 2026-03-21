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
    const assessment = await storage.getAssessmentByStudent(studentId);
    return NextResponse.json(assessment ? [assessment] : []);
  }

  if (instructorId) {
    const assessments = await storage.getAssessmentsByInstructor(instructorId);
    return NextResponse.json(assessments);
  }

  const assessments = await storage.getAllAssessments();
  return NextResponse.json(assessments);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }
  const role = (session.user as any).role;
  if (role !== "instruktur" && role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    if (body.assessedAt && typeof body.assessedAt === "string") {
      body.assessedAt = new Date(body.assessedAt);
    }
    const assessment = await storage.createAssessment(body);
    return NextResponse.json(assessment);
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 400 });
  }
}
