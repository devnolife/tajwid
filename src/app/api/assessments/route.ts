import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { storage } from "@/lib/db/storage";
import { notify, notifyTemplates } from "@/lib/notify";
import { getIdentity, resolveAssignedResourceScope } from "@/lib/api/authz";
import { toErrorResponse } from "@/lib/api/http";

export async function GET(request: Request) {
  try {
    const identity = getIdentity(await auth());
    const { searchParams } = new URL(request.url);
    const scope = resolveAssignedResourceScope(
      identity,
      searchParams.get("studentId"),
      searchParams.get("instructorId"),
    );

    if ("all" in scope) {
      return NextResponse.json(await storage.getAllAssessments());
    }
    if (scope.studentId && scope.instructorId) {
      return NextResponse.json(
        await storage.getAssessmentsByInstructorAndStudent(
          scope.instructorId,
          scope.studentId,
        ),
      );
    }
    if (scope.studentId) {
      return NextResponse.json(
        await storage.getAssessmentsByStudent(scope.studentId),
      );
    }
    if (!scope.instructorId) {
      throw new Error("Invalid assessment scope");
    }
    return NextResponse.json(
      await storage.getAssessmentsByInstructor(scope.instructorId),
    );
  } catch (error) {
    return toErrorResponse(error);
  }
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
    // Extract non-schema fields before insert
    const scheduleId: string | null = body.scheduleId ?? null;
    const repeatScheduleAt: string | null = body.repeatScheduleAt ?? null;
    const repeatRoom: string | null = body.repeatRoom ?? null;
    delete body.repeatScheduleAt;
    delete body.repeatRoom;

    const assessment = await storage.createAssessment(body);

    // Tandai sesi yang dinilai sebagai "completed"
    if (scheduleId) {
      try {
        await storage.updateSchedule(scheduleId, { status: "completed" } as any);
      } catch (err) {
        console.error("[assessments] gagal update status schedule:", err);
      }
    }

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
      } else if (repeatScheduleAt) {
        // Tidak lulus + instruktur sudah memilih jadwal ulang → buat sesi baru
        try {
          const parentSchedule = scheduleId ? await storage.getSchedule(scheduleId) : null;
          const room = repeatRoom || parentSchedule?.room || "Ruang Mengaji";
          const newSchedule = await storage.createSchedule({
            studentId: assessment.studentId,
            instructorId: assessment.instructorId,
            date: new Date(repeatScheduleAt),
            room,
            location: parentSchedule?.location ?? null,
            status: "scheduled" as any,
            isRepeat: true as any,
            parentScheduleId: scheduleId as any,
          } as any);
          await notify(notifyTemplates.repeatScheduleCreated(assessment.studentId, new Date(newSchedule.date), newSchedule.room));
        } catch (err) {
          console.error("[assessments] gagal membuat jadwal ulang:", err);
        }
      }
      await notify(notifyTemplates.assessmentPublished(assessment.studentId, assessment.totalScore, assessment.passed));
    }
    return NextResponse.json(assessment);
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 400 });
  }
}

