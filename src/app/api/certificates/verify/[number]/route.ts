import { NextResponse } from "next/server";
import { storage } from "@/lib/db/storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ number: string }> }
) {
  const { number } = await params;

  try {
    const cert = await storage.getCertificateByNumber(number);
    if (!cert) {
      return NextResponse.json({ valid: false, message: "Sertifikat tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({
      valid: true,
      certificate: {
        certificateNumber: cert.certificateNumber,
        studentName: cert.studentName,
        studentNim: cert.studentNim,
        studentFaculty: cert.studentFaculty,
        studentProgram: cert.studentProgram,
        totalScore: cert.totalScore,
        academicYear: cert.academicYear,
        signerName: cert.signerName,
        signerTitle: cert.signerTitle,
        issuedAt: cert.issuedAt,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ valid: false, message: e.message }, { status: 500 });
  }
}
