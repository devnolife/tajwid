import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { storage } from "@/lib/db/storage";

function generateCertificateNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TJW-${year}-${random}`;
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId");

  if (studentId) {
    const cert = await storage.getCertificateByStudent(studentId);
    return NextResponse.json(cert ?? null);
  }

  return NextResponse.json({ message: "studentId required" }, { status: 400 });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (role !== "admin" && role !== "instruktur") {
    // Mahasiswa can also generate their own certificate
    const body = await request.json();
    const { studentId } = body;
    if ((session.user as any).id !== studentId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
  }

  try {
    const body = await request.json().catch(() => ({}));
    const studentId = body.studentId || (session.user as any).id;

    const existing = await storage.getCertificateByStudent(studentId);
    if (existing) {
      return NextResponse.json(existing);
    }

    const user = await storage.getUser(studentId);
    if (!user) {
      return NextResponse.json({ message: "Student not found" }, { status: 404 });
    }

    const assessment = await storage.getAssessmentByStudent(studentId);
    if (!assessment || !assessment.passed) {
      return NextResponse.json({ message: "Student has not passed" }, { status: 400 });
    }

    const settings = await storage.getSettings();

    const cert = await storage.createCertificate({
      certificateNumber: generateCertificateNumber(),
      studentId: user.id,
      assessmentId: assessment.id,
      studentName: user.name,
      studentNim: user.nim,
      studentFaculty: user.faculty,
      studentProgram: user.program,
      totalScore: assessment.totalScore,
      academicYear: settings?.academicYear || "2025/2026",
      signerName: "Dr. Alamsyah, S.Pd.I., M.H.",
      signerTitle: "Wakil Dekan IV",
    });

    return NextResponse.json(cert);
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 400 });
  }
}
