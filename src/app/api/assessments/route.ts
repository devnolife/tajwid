import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { storage } from "@/lib/db/storage";
import { notify, notifyTemplates } from "@/lib/notify";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId");
  const instructorId = searchParams.get("instructorId");

  if (studentId) {
    const assessments = await storage.getAssessmentsByStudent(studentId);
    return NextResponse.json(assessments);
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
    if (assessment.studentId) {
      // Saat mahasiswa dinyatakan LULUS, otomatis buatkan tagihan biaya
      // (kalau belum punya tagihan aktif). Pembayaran dilakukan setelah lulus.
      if (assessment.passed) {
        const existing = await storage.getPaymentsByStudent(assessment.studentId);
        const hasActive = existing.some(
          (p) => p.status === "belum_bayar" || p.status === "menunggu_verifikasi" || p.status === "lunas",
        );
        if (!hasActive) {
          const settings = await storage.getSettings();
          const amount = settings?.paymentAmount ?? "25000";
          const academicYear = settings?.academicYear ?? "2025/2026";
          const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          try {
            const newPayment = await storage.createPayment({
              studentId: assessment.studentId,
              amount,
              dueDate,
              description: `Biaya Sertifikat Tajwid Tahun Akademik ${academicYear}`,
              status: "belum_bayar",
            });
            await notify(notifyTemplates.paymentCreated(assessment.studentId, newPayment.amount, newPayment.id));
          } catch (err) {
            console.error("[assessments] gagal membuat tagihan otomatis:", err);
          }
        }
      }
      await notify(notifyTemplates.assessmentPublished(assessment.studentId, assessment.totalScore, assessment.passed));
    }
    return NextResponse.json(assessment);
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 400 });
  }
}

