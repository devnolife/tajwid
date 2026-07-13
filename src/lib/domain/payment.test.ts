import { describe, expect, it } from "vitest";
import { resolvePaymentTransition } from "@/lib/domain/payment";

const payment = {
  id: "payment-1",
  studentId: "student-1",
  status: "belum_bayar" as const,
};

describe("payment state transitions", () => {
  it("allows only the owner student to submit proof", () => {
    expect(
      resolvePaymentTransition({
        actor: { id: "student-1", role: "mahasiswa" },
        payment,
        action: "submit_proof",
        proofUrl: "/api/payments/payment-1/proof",
      }),
    ).toEqual({
      status: "menunggu_verifikasi",
      proofUrl: "/api/payments/payment-1/proof",
      paidAt: null,
    });

    expect(() =>
      resolvePaymentTransition({
        actor: { id: "student-2", role: "mahasiswa" },
        payment,
        action: "submit_proof",
        proofUrl: "/api/payments/payment-1/proof",
      }),
    ).toThrow("Forbidden");
  });

  it("allows only an admin to approve a submitted payment", () => {
    const now = new Date("2026-07-13T12:00:00.000Z");
    const submitted = { ...payment, status: "menunggu_verifikasi" as const };

    expect(
      resolvePaymentTransition({
        actor: { id: "admin-1", role: "admin" },
        payment: submitted,
        action: "approve",
        now,
      }),
    ).toEqual({ status: "lunas", paidAt: now });

    expect(() =>
      resolvePaymentTransition({
        actor: { id: "student-1", role: "mahasiswa" },
        payment: submitted,
        action: "approve",
        now,
      }),
    ).toThrow("Forbidden");
  });

  it("rejects illegal state changes and missing proof", () => {
    expect(() =>
      resolvePaymentTransition({
        actor: { id: "student-1", role: "mahasiswa" },
        payment,
        action: "submit_proof",
      }),
    ).toThrow("Bukti pembayaran wajib diisi");

    expect(() =>
      resolvePaymentTransition({
        actor: { id: "admin-1", role: "admin" },
        payment,
        action: "approve",
      }),
    ).toThrow("Transisi status pembayaran tidak valid");
  });
});
