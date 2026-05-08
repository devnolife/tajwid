import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { storage } from "@/lib/db/storage";

// POST /api/payments/ensure-mine
// Membuat tagihan default untuk mahasiswa yang sedang login bila belum ada tagihan apapun.
// Idempotent: aman dipanggil berulang.
export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }
  const role = (session.user as any).role;
  const studentId = (session.user as any).id as string;

  if (role !== "mahasiswa") {
    return NextResponse.json({ message: "Only mahasiswa can ensure own payment" }, { status: 403 });
  }

  try {
    const existing = await storage.getPaymentsByStudent(studentId);
    if (existing.length > 0) {
      return NextResponse.json({ created: false, payments: existing });
    }

    const settings = await storage.getSettings();
    const amount = settings?.paymentAmount ?? "25000";
    const academicYear = settings?.academicYear ?? "2025/2026";
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const payment = await storage.createPayment({
      studentId,
      amount,
      dueDate,
      description: `Biaya Ujian Tajwid Tahun Akademik ${academicYear}`,
      status: "belum_bayar",
    });

    return NextResponse.json({ created: true, payments: [payment] });
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 400 });
  }
}
