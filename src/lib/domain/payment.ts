export type AppRole = "mahasiswa" | "instruktur" | "admin";
export type PaymentStatus =
  | "belum_bayar"
  | "menunggu_verifikasi"
  | "lunas"
  | "ditolak";
export type PaymentAction = "submit_proof" | "approve" | "reject";

interface PaymentActor {
  id: string;
  role: AppRole;
}

interface PaymentSnapshot {
  id: string;
  studentId: string;
  status: PaymentStatus;
}

interface ResolvePaymentTransitionInput {
  actor: PaymentActor;
  payment: PaymentSnapshot;
  action: PaymentAction;
  proofUrl?: string;
  now?: Date;
}

export interface PaymentTransition {
  status: PaymentStatus;
  proofUrl?: string;
  paidAt: Date | null;
}

export function resolvePaymentTransition({
  actor,
  payment,
  action,
  proofUrl,
  now = new Date(),
}: ResolvePaymentTransitionInput): PaymentTransition {
  if (action === "submit_proof") {
    if (actor.role !== "mahasiswa" || actor.id !== payment.studentId) {
      throw new Error("Forbidden");
    }
    if (payment.status !== "belum_bayar" && payment.status !== "ditolak") {
      throw new Error("Transisi status pembayaran tidak valid");
    }
    const expectedProofUrl = `/api/payments/${payment.id}/proof`;
    if (proofUrl !== expectedProofUrl) {
      throw new Error("Bukti pembayaran wajib diisi");
    }

    return {
      status: "menunggu_verifikasi",
      proofUrl,
      paidAt: null,
    };
  }

  if (actor.role !== "admin") {
    throw new Error("Forbidden");
  }
  if (payment.status !== "menunggu_verifikasi") {
    throw new Error("Transisi status pembayaran tidak valid");
  }

  if (action === "approve") {
    return { status: "lunas", paidAt: now };
  }

  return { status: "ditolak", paidAt: null };
}
