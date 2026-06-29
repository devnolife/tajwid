import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { certificates } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

/**
 * Public lookup endpoint: GET /api/certificates/by-nim/{nim}
 *
 * Returns the most recently issued certificate for the given NIM
 * (latest `issuedAt`). Used by integrations such as `simtekmu` to
 * auto-resolve a student's Qur'an-reading certificate without
 * requiring the student to type a certificate number.
 *
 * Public on purpose — only fields already printed on the physical
 * certificate are returned (no internal IDs or scores breakdown).
 */
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
} as const;

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ nim: string }> }
) {
  const { nim } = await params;
  const trimmed = (nim || "").trim();

  if (!trimmed) {
    return NextResponse.json(
      { valid: false, message: "NIM wajib diisi" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  try {
    const rows = await db
      .select()
      .from(certificates)
      .where(eq(certificates.studentNim, trimmed))
      .orderBy(desc(certificates.issuedAt))
      .limit(1);

    const cert = rows[0];
    if (!cert) {
      return NextResponse.json(
        { valid: false, message: "Sertifikat untuk NIM ini tidak ditemukan" },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json(
      {
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
      },
      { headers: CORS_HEADERS }
    );
  } catch (e: any) {
    return NextResponse.json(
      { valid: false, message: e.message },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
