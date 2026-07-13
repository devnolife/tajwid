import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  assessments,
  auditEvents,
  notifications,
  payments,
  schedules,
  settings,
} from "@shared/schema";
import type {
  AssessmentTransaction,
  AssessmentWorkflowDependencies,
} from "@/lib/services/assessment-service";

function createAssessmentTransaction(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
): AssessmentTransaction {
  return {
    async getSchedule(id) {
      const [schedule] = await tx
        .select()
        .from(schedules)
        .where(eq(schedules.id, id))
        .limit(1);
      return schedule;
    },
    async getSettings() {
      const [appSettings] = await tx.select().from(settings).limit(1);
      return appSettings;
    },
    async getAssessment(id) {
      const [assessment] = await tx
        .select()
        .from(assessments)
        .where(eq(assessments.id, id))
        .for("update")
        .limit(1);
      return assessment;
    },
    async createAssessment(input) {
      const [assessment] = await tx
        .insert(assessments)
        .values(input)
        .returning();
      return assessment;
    },
    async updateAssessment(id, input) {
      const [assessment] = await tx
        .update(assessments)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(assessments.id, id))
        .returning();
      return assessment;
    },
    async completeSchedule(id) {
      await tx
        .update(schedules)
        .set({ status: "completed", updatedAt: new Date() })
        .where(eq(schedules.id, id));
    },
    async createCertificatePayment(input) {
      const [payment] = await tx
        .insert(payments)
        .values({
          studentId: input.studentId,
          amount: input.amount,
          academicYear: input.academicYear,
          billingKey: "certificate",
          dueDate: input.dueDate,
          description: input.description,
          status: "belum_bayar",
        })
        .onConflictDoNothing({
          target: [
            payments.studentId,
            payments.academicYear,
            payments.billingKey,
          ],
        })
        .returning({ id: payments.id, amount: payments.amount });
      return payment ?? null;
    },
    async createRepeatSchedule(input) {
      const [schedule] = await tx
        .insert(schedules)
        .values({
          studentId: input.studentId,
          instructorId: input.instructorId,
          parentScheduleId: input.parentScheduleId,
          date: input.date,
          room: input.room,
          location: input.location,
          status: "scheduled",
          isRepeat: true,
        })
        .returning({
          id: schedules.id,
          date: schedules.date,
          room: schedules.room,
        });
      return schedule ?? null;
    },
    async createNotification(input) {
      const [notification] = await tx
        .insert(notifications)
        .values(input)
        .returning();
      return notification;
    },
    async createAuditEvent(input) {
      const [event] = await tx.insert(auditEvents).values(input).returning();
      return event;
    },
  };
}

export const assessmentWorkflowDependencies: AssessmentWorkflowDependencies = {
  transaction(work) {
    return db.transaction((tx) => work(createAssessmentTransaction(tx)));
  },
};
