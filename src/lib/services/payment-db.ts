import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  auditEvents,
  notifications,
  payments,
  users,
} from "@shared/schema";
import { ApiError } from "@/lib/api/authz";
import { issueCertificateInTransaction } from "@/lib/services/certificate-service";
import type {
  PaymentTransaction,
  PaymentWorkflowDependencies,
} from "@/lib/services/payment-service";

function createPaymentTransaction(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
): PaymentTransaction {
  return {
    async getPayment(id) {
      const [payment] = await tx
        .select()
        .from(payments)
        .where(eq(payments.id, id))
        .for("update")
        .limit(1);
      return payment;
    },
    async updatePayment(id, input) {
      const [payment] = await tx
        .update(payments)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(payments.id, id))
        .returning();
      if (!payment) {
        throw new ApiError(404, "Payment not found", "NOT_FOUND");
      }
      return payment;
    },
    async getStudent(id) {
      const [student] = await tx
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      return student;
    },
    getAdministrators() {
      return tx
        .select({ id: users.id })
        .from(users)
        .where(eq(users.role, "admin"));
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
    issueCertificate(studentId, actorId) {
      return issueCertificateInTransaction(tx, studentId, actorId);
    },
  };
}

export const paymentWorkflowDependencies: PaymentWorkflowDependencies = {
  transaction(work) {
    return db.transaction((tx) => work(createPaymentTransaction(tx)));
  },
};
