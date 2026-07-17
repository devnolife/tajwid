import type {
  InsertAuditEvent,
  InsertNotification,
  Payment,
} from "@shared/schema";
import type { z } from "zod";
import { ApiError, type Identity } from "@/lib/api/authz";
import type { paymentActionSchema } from "@/lib/api/schemas";
import { resolvePaymentTransition } from "@/lib/domain/payment";
import { notifyTemplates } from "@/lib/notification-templates";

export type PaymentWorkflowInput = z.infer<typeof paymentActionSchema>;

export interface PaymentTransaction {
  getPayment(id: string): Promise<Payment | null | undefined>;
  updatePayment(
    id: string,
    input: {
      status: Payment["status"];
      proofUrl?: string;
      paidAt: Date | null;
      method?: "transfer" | "cash";
    },
  ): Promise<Payment>;
  getStudent(id: string): Promise<{ id: string; name: string } | null | undefined>;
  getAdministrators(): Promise<Array<{ id: string }>>;
  createNotification(input: InsertNotification): Promise<unknown>;
  createAuditEvent(input: InsertAuditEvent): Promise<unknown>;
  issueCertificate(studentId: string, actorId: string): Promise<unknown>;
}

export interface PaymentWorkflowDependencies {
  transaction<T>(work: (tx: PaymentTransaction) => Promise<T>): Promise<T>;
  now?: () => Date;
}

export interface PaymentWorkflowResult {
  payment: Payment;
  certificate?: unknown;
}

export async function transitionPaymentWorkflow(
  identity: Identity,
  paymentId: string,
  input: PaymentWorkflowInput,
  dependencies: PaymentWorkflowDependencies,
): Promise<PaymentWorkflowResult> {
  return dependencies.transaction(async (tx) => {
    const current = await tx.getPayment(paymentId);
    if (!current) {
      throw new ApiError(404, "Payment not found", "NOT_FOUND");
    }

    let transition;
    try {
      transition = resolvePaymentTransition({
        actor: identity,
        payment: current,
        action: input.action,
        proofUrl:
          input.action === "submit_proof" ? input.proofUrl : undefined,
        now: dependencies.now?.() ?? new Date(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid payment";
      if (message === "Forbidden") {
        throw new ApiError(403, message, "FORBIDDEN");
      }
      throw new ApiError(409, message, "INVALID_PAYMENT_STATE");
    }

    const updated = await tx.updatePayment(paymentId, {
      status: transition.status,
      ...(transition.proofUrl ? { proofUrl: transition.proofUrl } : {}),
      paidAt: transition.paidAt,
      ...(transition.method ? { method: transition.method } : {}),
    });

    let certificate: unknown;
    if (input.action === "submit_proof") {
      const [student, administrators] = await Promise.all([
        tx.getStudent(updated.studentId),
        tx.getAdministrators(),
      ]);
      for (const administrator of administrators) {
        await tx.createNotification(
          notifyTemplates.paymentNeedsVerification(
            administrator.id,
            student?.name ?? "Mahasiswa",
          ),
        );
      }
    } else {
      const verifiedStatus =
        input.action === "approve" || input.action === "confirm_cash"
          ? "lunas"
          : "ditolak";
      await tx.createNotification(
        notifyTemplates.paymentVerified(updated.studentId, verifiedStatus),
      );
      if (verifiedStatus === "lunas") {
        certificate = await tx.issueCertificate(
          updated.studentId,
          identity.id,
        );
      }
    }

    await tx.createAuditEvent({
      actorId: identity.id,
      action: `payment.${input.action}`,
      entityType: "payment",
      entityId: updated.id,
      details: {
        from: current.status,
        to: updated.status,
        studentId: updated.studentId,
      },
    });

    return certificate ? { payment: updated, certificate } : { payment: updated };
  });
}
