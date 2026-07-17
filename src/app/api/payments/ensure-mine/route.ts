import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { storage } from "@/lib/db/storage";
import { getIdentity, requireRole } from "@/lib/api/authz";
import { toErrorResponse } from "@/lib/api/http";
import { notify, notifyTemplates } from "@/lib/notify";

// POST /api/payments/ensure-mine
// Membuat tagihan default untuk mahasiswa yang sedang login bila belum ada tagihan apapun.
// Idempotent: aman dipanggil berulang.
export async function POST() {
  try {
    const identity = requireRole(getIdentity(await auth()), "mahasiswa");
    const studentId = identity.id;
    const existing = await storage.getPaymentsByStudent(studentId);
    if (existing.length > 0) {
      return NextResponse.json({ created: false, payments: existing });
    }

    // UX baru: tagihan dibuat hanya setelah mahasiswa dinyatakan LULUS oleh instruktur.
    // Sebelum lulus, tidak ada tagihan apapun.
    const latest = await storage.getAssessmentByStudent(studentId);
    if (!latest?.passed) {
      return NextResponse.json({
        created: false,
        payments: [],
        reason: "not_yet_passed",
      });
    }

    const settings = await storage.getSettings();
    const amount = settings?.paymentAmount ?? "25000";
    const academicYear = settings?.academicYear ?? "2025/2026";
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const result = await storage.ensureCertificatePayment({
      studentId,
      amount,
      dueDate,
      description: `Biaya Sertifikat Tajwid Tahun Akademik ${academicYear}`,
      academicYear,
    });
    if (result.created) {
      await notify(
        notifyTemplates.paymentCreated(studentId, result.payment.amount),
      );
    }

    return NextResponse.json({
      created: result.created,
      payments: [result.payment],
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
