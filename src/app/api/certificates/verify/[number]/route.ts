import { NextResponse } from "next/server";
import { storage } from "@/lib/db/storage";
import { logger } from "@/lib/logger";

/**
 * Public certificate verification endpoint.
 *
 * Used by:
 *   - The TajwidKu verify page (browser, same origin)
 *   - External integrations such as `simtekmu` (server-to-server) to
 *     auto-verify the "quran_reading_certificate" KKP requirement.
 *
 * Permissive CORS headers are added so that, if a future integration calls
 * this endpoint from a browser on a different origin, it works without a
 * server-side proxy. Endpoint is read-only and exposes only data already
 * intended to be public (printed on the certificate itself).
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
  { params }: { params: Promise<{ number: string }> }
) {
  const { number } = await params;

  try {
    const cert = await storage.getCertificateByNumber(number);
    if (!cert) {
      return NextResponse.json(
        { valid: false, message: "Sertifikat tidak ditemukan" },
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
  } catch (error) {
    logger.error("certificate.verify.failed", { error });
    return NextResponse.json(
      { valid: false, message: "Terjadi kesalahan server" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
