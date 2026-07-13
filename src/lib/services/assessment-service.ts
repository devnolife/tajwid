import type {
  Assessment,
  InsertAssessment,
  InsertAuditEvent,
  InsertNotification,
} from "@shared/schema";
import { ApiError, type Identity } from "@/lib/api/authz";
import type { z } from "zod";
import type { assessmentCreateSchema } from "@/lib/api/schemas";
import { calculateAssessmentResult } from "@/lib/domain/assessment";
import { notifyTemplates } from "@/lib/notify";

export type AssessmentWorkflowInput = z.infer<typeof assessmentCreateSchema>;

interface ScheduleSnapshot {
  id: string;
  studentId: string;
  instructorId: string;
  date: Date;
  room: string;
  location: string | null;
  status: "scheduled" | "completed" | "no_show" | "cancelled";
  isRepeat: boolean;
  parentScheduleId: string | null;
}

interface SettingsSnapshot {
  passingScore: number;
  paymentAmount: string;
  academicYear: string;
}

interface CertificatePaymentInput {
  studentId: string;
  amount: string;
  academicYear: string;
  dueDate: Date;
  description: string;
}

interface RepeatScheduleInput {
  studentId: string;
  instructorId: string;
  parentScheduleId: string;
  date: Date;
  room: string;
  location: string | null;
}

export interface AssessmentTransaction {
  getSchedule(id: string): Promise<ScheduleSnapshot | null | undefined>;
  getSettings(): Promise<SettingsSnapshot | null | undefined>;
  createAssessment(input: InsertAssessment): Promise<Assessment>;
  completeSchedule(id: string): Promise<void>;
  createCertificatePayment(
    input: CertificatePaymentInput,
  ): Promise<{ id: string; amount: string } | null>;
  createRepeatSchedule(
    input: RepeatScheduleInput,
  ): Promise<{ id: string; date: Date; room: string } | null>;
  createNotification(input: InsertNotification): Promise<unknown>;
  createAuditEvent(input: InsertAuditEvent): Promise<unknown>;
}

export interface AssessmentWorkflowDependencies {
  transaction<T>(work: (tx: AssessmentTransaction) => Promise<T>): Promise<T>;
  now?: () => Date;
}

export async function createAssessmentWorkflow(
  identity: Identity,
  input: AssessmentWorkflowInput,
  dependencies: AssessmentWorkflowDependencies,
): Promise<Assessment> {
  if (identity.role !== "admin" && identity.role !== "instruktur") {
    throw new ApiError(403, "Forbidden", "FORBIDDEN");
  }

  return dependencies.transaction(async (tx) => {
    const schedule = await tx.getSchedule(input.scheduleId);
    if (!schedule) {
      throw new ApiError(404, "Jadwal tidak ditemukan", "NOT_FOUND");
    }
    if (
      identity.role === "instruktur" &&
      schedule.instructorId !== identity.id
    ) {
      throw new ApiError(403, "Forbidden", "FORBIDDEN");
    }
    if (schedule.status === "completed" || schedule.status === "cancelled") {
      throw new ApiError(
        409,
        "Jadwal tidak dapat dinilai",
        "INVALID_SCHEDULE_STATE",
      );
    }

    const settings = await tx.getSettings();
    const passingScore = settings?.passingScore ?? 70;
    const result = calculateAssessmentResult({
      scores: {
        tajwid: input.tajwid,
        kelancaran: input.kelancaran,
        makhorijulHuruf: input.makhorijulHuruf,
        adab: input.adab,
      },
      passingScore,
      requestedOutcome: input.requestedOutcome,
      overrideReason: input.overrideReason,
    });

    const assessment = await tx.createAssessment({
      studentId: schedule.studentId,
      instructorId: schedule.instructorId,
      scheduleId: schedule.id,
      tajwid: input.tajwid,
      kelancaran: input.kelancaran,
      makhorijulHuruf: input.makhorijulHuruf,
      adab: input.adab,
      totalScore: result.totalScore,
      passingScore,
      passed: result.passed,
      outcomeOverridden: result.overrideReason !== null,
      overrideReason: result.overrideReason,
      notes: input.notes ?? null,
    });
    await tx.completeSchedule(schedule.id);

    if (assessment.passed) {
      const academicYear = settings?.academicYear ?? "2025/2026";
      const amount = settings?.paymentAmount ?? "25000";
      const now = dependencies.now?.() ?? new Date();
      const dueDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const payment = await tx.createCertificatePayment({
        studentId: assessment.studentId,
        amount,
        academicYear,
        dueDate,
        description: `Biaya Sertifikat Tajwid Tahun Akademik ${academicYear}`,
      });
      if (payment) {
        await tx.createNotification(
          notifyTemplates.paymentCreated(
            assessment.studentId,
            payment.amount,
            payment.id,
          ),
        );
      }
    } else if (input.repeatScheduleAt) {
      const repeat = await tx.createRepeatSchedule({
        studentId: assessment.studentId,
        instructorId: assessment.instructorId,
        parentScheduleId: schedule.id,
        date: new Date(input.repeatScheduleAt),
        room: input.repeatRoom ?? schedule.room,
        location: schedule.location,
      });
      if (repeat) {
        await tx.createNotification(
          notifyTemplates.repeatScheduleCreated(
            assessment.studentId,
            repeat.date,
            repeat.room,
          ),
        );
      }
    }

    await tx.createNotification(
      notifyTemplates.assessmentPublished(
        assessment.studentId,
        assessment.totalScore,
        assessment.passed,
      ),
    );
    await tx.createAuditEvent({
      actorId: identity.id,
      action: "assessment.created",
      entityType: "assessment",
      entityId: assessment.id,
      details: {
        scheduleId: schedule.id,
        studentId: schedule.studentId,
        outcomeOverridden: assessment.outcomeOverridden,
      },
    });

    return assessment;
  });
}
