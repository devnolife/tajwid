import { randomBytes } from "node:crypto";

interface AssessmentEligibility {
  passed: boolean;
}

interface PaymentEligibility {
  status: "belum_bayar" | "menunggu_verifikasi" | "lunas" | "ditolak";
  billingKey: string;
}

interface CertificateEligibilityInput {
  assessment: AssessmentEligibility | null | undefined;
  payments: PaymentEligibility[];
}

export function assertCertificateEligible({
  assessment,
  payments,
}: CertificateEligibilityInput): void {
  if (!assessment?.passed) {
    throw new Error("Student has not passed");
  }
  const hasPaidCertificateInvoice = payments.some(
    (payment) =>
      payment.billingKey === "certificate" && payment.status === "lunas",
  );
  if (!hasPaidCertificateInvoice) {
    throw new Error("Payment not completed");
  }
}

export function generateCertificateNumber(
  now = new Date(),
  random = randomBytes,
): string {
  const suffix = random(8).toString("hex").toUpperCase();
  return `TJW-${now.getUTCFullYear()}-${suffix}`;
}
