import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import {
  assessments,
  auditEvents,
  certificates,
  notifications,
  payments,
  schedules,
  settings,
  users,
} from "@shared/schema";
import { db, pool } from "@/lib/db";
import { storage } from "@/lib/db/storage";
import { hashPassword } from "@/lib/security/password";
import { createAssessmentWorkflow } from "@/lib/services/assessment-service";
import { assessmentWorkflowDependencies } from "@/lib/services/assessment-db";
import { transitionPaymentWorkflow } from "@/lib/services/payment-service";
import { paymentWorkflowDependencies } from "@/lib/services/payment-db";
import { issueCertificateForStudent } from "@/lib/services/certificate-service";

const databaseName = new URL(process.env.DATABASE_URL ?? "").pathname.slice(1);
if (!databaseName.endsWith("_test")) {
  throw new Error("Integration test hanya boleh memakai database berakhiran _test");
}

let studentId: string;
let instructorId: string;
let otherInstructorId: string;
let adminId: string;
let scheduleId: string;

beforeAll(async () => {
  await db.transaction(async (tx) => {
    await tx.delete(certificates);
    await tx.delete(assessments);
    await tx.delete(payments);
    await tx.delete(schedules);
    await tx.delete(settings);
    await tx.delete(users);
  });

  const suffix = randomUUID().slice(0, 8);
  const insertedUsers = await db
    .insert(users)
    .values([
      {
        username: `student-${suffix}`,
        password: await hashPassword("student-password"),
        role: "mahasiswa",
        name: "Mahasiswa Integration",
        nim: `NIM-${suffix}`,
      },
      {
        username: `instructor-${suffix}`,
        password: await hashPassword("instructor-password"),
        role: "instruktur",
        name: "Instruktur Integration",
      },
      {
        username: `other-instructor-${suffix}`,
        password: await hashPassword("other-password"),
        role: "instruktur",
        name: "Instruktur Lain",
      },
      {
        username: `admin-${suffix}`,
        password: await hashPassword("administrator-password"),
        role: "admin",
        name: "Admin Integration",
      },
    ])
    .returning();

  studentId = insertedUsers[0].id;
  instructorId = insertedUsers[1].id;
  otherInstructorId = insertedUsers[2].id;
  adminId = insertedUsers[3].id;

  await db.insert(settings).values({
    appName: "TajwidKu Test",
    academicYear: "2026/2027",
    passingScore: 75,
    paymentAmount: "25000",
  });

  const [schedule] = await db
    .insert(schedules)
    .values({
      studentId,
      instructorId,
      date: new Date("2026-07-20T09:00:00.000Z"),
      room: "Ruang Integration",
    })
    .returning();
  scheduleId = schedule.id;
});

afterAll(async () => {
  await db.transaction(async (tx) => {
    await tx.delete(auditEvents);
    await tx.delete(notifications);
    await tx.delete(certificates);
    await tx.delete(assessments);
    await tx.delete(payments);
    await tx.delete(schedules);
    await tx.delete(settings);
    await tx.delete(users);
  });
  await pool.end();
});

describe("assessment-payment-certificate integration", () => {
  it("rejects an instructor who does not own the schedule", async () => {
    await expect(
      createAssessmentWorkflow(
        { id: otherInstructorId, role: "instruktur" },
        {
          scheduleId,
          tajwid: 90,
          kelancaran: 90,
          makhorijulHuruf: 90,
          adab: 90,
        },
        assessmentWorkflowDependencies,
      ),
    ).rejects.toMatchObject({ status: 403, code: "FORBIDDEN" });
  });

  it("atomically creates an assessment and one certificate invoice", async () => {
    const assessment = await createAssessmentWorkflow(
      { id: instructorId, role: "instruktur" },
      {
        scheduleId,
        tajwid: 90,
        kelancaran: 80,
        makhorijulHuruf: 80,
        adab: 90,
        notes: "Lulus integration test",
      },
      assessmentWorkflowDependencies,
    );

    expect(assessment).toMatchObject({
      studentId,
      instructorId,
      scheduleId,
      totalScore: 85,
      passingScore: 75,
      passed: true,
    });

    const [completedSchedule] = await db
      .select()
      .from(schedules)
      .where(eq(schedules.id, scheduleId));
    expect(completedSchedule.status).toBe("completed");

    const invoices = await db
      .select()
      .from(payments)
      .where(eq(payments.studentId, studentId));
    expect(invoices).toHaveLength(1);
    expect(invoices[0]).toMatchObject({
      billingKey: "certificate",
      academicYear: "2026/2027",
      status: "belum_bayar",
    });

    await db.delete(payments).where(eq(payments.studentId, studentId));
    const invoiceInput = {
      studentId,
      amount: "25000",
      academicYear: "2026/2027",
      dueDate: new Date("2026-08-20T00:00:00.000Z"),
      description: "Biaya Sertifikat Tajwid Tahun Akademik 2026/2027",
    };
    const ensured = await Promise.all([
      storage.ensureCertificatePayment(invoiceInput),
      storage.ensureCertificatePayment(invoiceInput),
    ]);
    expect(ensured.filter((result) => result.created)).toHaveLength(1);
    expect(ensured[0].payment.id).toBe(ensured[1].payment.id);
  });

  it("moves payment through proof approval and issues one certificate", async () => {
    const [invoice] = await db
      .select()
      .from(payments)
      .where(eq(payments.studentId, studentId));
    const proofUrl = `/api/payments/${invoice.id}/proof`;

    const submitted = await transitionPaymentWorkflow(
      { id: studentId, role: "mahasiswa" },
      invoice.id,
      { action: "submit_proof", proofUrl },
      paymentWorkflowDependencies,
    );
    expect(submitted.payment.status).toBe("menunggu_verifikasi");

    const approved = await transitionPaymentWorkflow(
      { id: adminId, role: "admin" },
      invoice.id,
      { action: "approve" },
      paymentWorkflowDependencies,
    );
    expect(approved.payment.status).toBe("lunas");
    expect(approved.certificate).toBeTruthy();

    const [first, second] = await Promise.all([
      issueCertificateForStudent(studentId, adminId),
      issueCertificateForStudent(studentId, adminId),
    ]);
    expect(first.id).toBe(second.id);

    const issued = await db
      .select()
      .from(certificates)
      .where(eq(certificates.studentId, studentId));
    expect(issued).toHaveLength(1);
    expect(issued[0].totalScore).toBe(85);
  });
});
