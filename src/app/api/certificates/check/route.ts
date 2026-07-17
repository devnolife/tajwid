import { NextResponse } from "next/server";
import { storage } from "@/lib/db/storage";
import {
  getCertificateIntegrationKey,
  isValidIntegrationKey,
} from "@/lib/security/integration-key";

export async function GET(request: Request) {
  let configuredKey: string | null;
  try {
    configuredKey = getCertificateIntegrationKey();
  } catch {
    configuredKey = null;
  }
  if (!configuredKey) {
    return NextResponse.json(
      { found: false, message: "Integrasi sertifikat belum dikonfigurasi" },
      { status: 503 },
    );
  }

  const apiKey = request.headers.get("x-api-key");
  if (!isValidIntegrationKey(apiKey, configuredKey)) {
    return NextResponse.json(
      { found: false, message: "Unauthorized: API key tidak valid" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const nim = searchParams.get("nim");

  if (!nim || nim.trim().length === 0) {
    return NextResponse.json(
      { found: false, message: "Parameter 'nim' wajib diisi" },
      { status: 400 }
    );
  }

  try {
    const user = await storage.getUserByNim(nim.trim());
    if (!user) {
      return NextResponse.json({
        found: false,
        message: "Mahasiswa dengan NIM tersebut tidak ditemukan",
      });
    }

    const assessment = await storage.getAssessmentByStudent(user.id);
    const certificate = await storage.getCertificateByStudent(user.id);

    if (!assessment || !assessment.passed) {
      return NextResponse.json({
        found: true,
        passed: false,
        message: "Mahasiswa ditemukan tetapi belum dinyatakan lulus",
        student: {
          name: user.name,
          nim: user.nim,
          faculty: user.faculty,
          program: user.program,
        },
      });
    }

    if (!certificate) {
      return NextResponse.json({
        found: true,
        passed: true,
        hasCertificate: false,
        message: "Mahasiswa telah lulus tetapi sertifikat belum diterbitkan",
        student: {
          name: user.name,
          nim: user.nim,
          faculty: user.faculty,
          program: user.program,
        },
        score: {
          tajwid: assessment.tajwid,
          kelancaran: assessment.kelancaran,
          makhorijulHuruf: assessment.makhorijulHuruf,
          adab: assessment.adab,
          totalScore: assessment.totalScore,
        },
      });
    }

    return NextResponse.json({
      found: true,
      passed: true,
      hasCertificate: true,
      message: "Mahasiswa telah lulus dan sertifikat telah diterbitkan",
      student: {
        name: certificate.studentName,
        nim: certificate.studentNim,
        faculty: certificate.studentFaculty,
        program: certificate.studentProgram,
      },
      score: {
        tajwid: assessment.tajwid,
        kelancaran: assessment.kelancaran,
        makhorijulHuruf: assessment.makhorijulHuruf,
        adab: assessment.adab,
        totalScore: assessment.totalScore,
      },
      certificate: {
        certificateNumber: certificate.certificateNumber,
        academicYear: certificate.academicYear,
        signerName: certificate.signerName,
        signerTitle: certificate.signerTitle,
        issuedAt: certificate.issuedAt,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { found: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
