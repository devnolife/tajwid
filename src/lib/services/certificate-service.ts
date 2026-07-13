import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  assessments,
  auditEvents,
  certificates,
  payments,
  settings,
  users,
  type Certificate,
} from "@shared/schema";
import { ApiError } from "@/lib/api/authz";
import {
  assertCertificateEligible,
  generateCertificateNumber,
} from "@/lib/domain/certificate";

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function issueCertificateInTransaction(
  tx: DbTransaction,
  studentId: string,
  actorId: string | null,
): Promise<Certificate> {
  const [existing] = await tx
    .select()
    .from(certificates)
    .where(eq(certificates.studentId, studentId))
    .limit(1);
  if (existing) {
    return existing;
  }

  const [student] = await tx
    .select()
    .from(users)
    .where(eq(users.id, studentId))
    .limit(1);
  if (!student || student.role !== "mahasiswa") {
    throw new ApiError(404, "Student not found", "NOT_FOUND");
  }

  const [assessment] = await tx
    .select()
    .from(assessments)
    .where(eq(assessments.studentId, studentId))
    .orderBy(desc(assessments.assessedAt))
    .limit(1);
  const studentPayments = await tx
    .select()
    .from(payments)
    .where(eq(payments.studentId, studentId));

  try {
    assertCertificateEligible({ assessment, payments: studentPayments });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Not eligible";
    throw new ApiError(400, message, "NOT_ELIGIBLE");
  }

  const [appSettings] = await tx.select().from(settings).limit(1);
  const [created] = await tx
    .insert(certificates)
    .values({
      certificateNumber: generateCertificateNumber(),
      studentId: student.id,
      assessmentId: assessment.id,
      studentName: student.name,
      studentNim: student.nim,
      studentFaculty: student.faculty,
      studentProgram: student.program,
      totalScore: assessment.totalScore,
      academicYear: appSettings?.academicYear ?? "2025/2026",
      signerName: "Dr. Alamsyah, S.Pd.I., M.H.",
      signerTitle: "Wakil Dekan IV",
    })
    .onConflictDoNothing({ target: certificates.studentId })
    .returning();

  const certificate =
    created ??
    (
      await tx
        .select()
        .from(certificates)
        .where(eq(certificates.studentId, studentId))
        .limit(1)
    )[0];
  if (!certificate) {
    throw new ApiError(500, "Gagal menerbitkan sertifikat", "ISSUANCE_FAILED");
  }

  if (created) {
    await tx.insert(auditEvents).values({
      actorId,
      action: "certificate.issued",
      entityType: "certificate",
      entityId: certificate.id,
      details: { studentId },
    });
  }

  return certificate;
}

export async function issueCertificateForStudent(
  studentId: string,
  actorId: string | null,
): Promise<Certificate> {
  return db.transaction((tx) =>
    issueCertificateInTransaction(tx, studentId, actorId),
  );
}
