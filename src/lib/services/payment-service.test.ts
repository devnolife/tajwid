import { describe, expect, it, vi } from "vitest";
import type { Identity } from "@/lib/api/authz";
import {
  transitionPaymentWorkflow,
  type PaymentTransaction,
  type PaymentWorkflowDependencies,
} from "@/lib/services/payment-service";

const payment = {
  id: "payment-1",
  studentId: "student-1",
  amount: "25000",
  dueDate: new Date("2026-08-13T00:00:00.000Z"),
  description: "Biaya Sertifikat",
  academicYear: "2026/2027",
  billingKey: "certificate",
  status: "belum_bayar" as const,
  proofUrl: null,
  paidAt: null,
  createdAt: new Date("2026-07-13T00:00:00.000Z"),
  updatedAt: new Date("2026-07-13T00:00:00.000Z"),
};

function createHarness(overrides: Partial<PaymentTransaction> = {}) {
  const tx: PaymentTransaction = {
    getPayment: vi.fn().mockResolvedValue(payment),
    updatePayment: vi.fn().mockImplementation(async (_id, input) => ({
      ...payment,
      ...input,
    })),
    getStudent: vi.fn().mockResolvedValue({ id: "student-1", name: "Student" }),
    getAdministrators: vi.fn().mockResolvedValue([{ id: "admin-1" }]),
    createNotification: vi.fn().mockResolvedValue(undefined),
    createAuditEvent: vi.fn().mockResolvedValue(undefined),
    issueCertificate: vi.fn().mockResolvedValue({ id: "certificate-1" }),
    ...overrides,
  };
  const dependencies: PaymentWorkflowDependencies = {
    transaction: vi.fn(async (work) => work(tx)),
    now: () => new Date("2026-07-13T12:00:00.000Z"),
  };
  return { tx, dependencies };
}

describe("payment workflow", () => {
  it("lets only the owner submit the canonical private proof reference", async () => {
    const { tx, dependencies } = createHarness();
    const identity: Identity = { id: "student-1", role: "mahasiswa" };

    const result = await transitionPaymentWorkflow(
      identity,
      "payment-1",
      {
        action: "submit_proof",
        proofUrl: "/api/payments/payment-1/proof",
      },
      dependencies,
    );

    expect(tx.updatePayment).toHaveBeenCalledWith("payment-1", {
      status: "menunggu_verifikasi",
      proofUrl: "/api/payments/payment-1/proof",
      paidAt: null,
      method: "transfer",
    });
    expect(tx.issueCertificate).not.toHaveBeenCalled();
    expect(tx.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "admin-1", type: "payment" }),
    );
    expect(result.payment.status).toBe("menunggu_verifikasi");
  });

  it("rejects proof submission for another student's payment", async () => {
    const { tx, dependencies } = createHarness();

    await expect(
      transitionPaymentWorkflow(
        { id: "student-2", role: "mahasiswa" },
        "payment-1",
        {
          action: "submit_proof",
          proofUrl: "/api/payments/payment-1/proof",
        },
        dependencies,
      ),
    ).rejects.toThrow("Forbidden");
    expect(tx.updatePayment).not.toHaveBeenCalled();
  });

  it("issues a certificate in the same transaction when an admin approves", async () => {
    const submitted = {
      ...payment,
      status: "menunggu_verifikasi" as const,
      proofUrl: "/api/payments/payment-1/proof",
    };
    const { tx, dependencies } = createHarness({
      getPayment: vi.fn().mockResolvedValue(submitted),
      updatePayment: vi.fn().mockImplementation(async (_id, input) => ({
        ...submitted,
        ...input,
      })),
    });

    const result = await transitionPaymentWorkflow(
      { id: "admin-1", role: "admin" },
      "payment-1",
      { action: "approve" },
      dependencies,
    );

    expect(tx.updatePayment).toHaveBeenCalledWith("payment-1", {
      status: "lunas",
      paidAt: new Date("2026-07-13T12:00:00.000Z"),
    });
    expect(tx.issueCertificate).toHaveBeenCalledWith(
      "student-1",
      "admin-1",
    );
    expect(tx.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "student-1", type: "payment" }),
    );
    expect(result.certificate).toEqual({ id: "certificate-1" });
  });

  it("marks payment lunas with method cash and issues certificate when admin confirms cash", async () => {
    const { tx, dependencies } = createHarness();

    const result = await transitionPaymentWorkflow(
      { id: "admin-1", role: "admin" },
      "payment-1",
      { action: "confirm_cash" },
      dependencies,
    );

    expect(tx.updatePayment).toHaveBeenCalledWith("payment-1", {
      status: "lunas",
      paidAt: new Date("2026-07-13T12:00:00.000Z"),
      method: "cash",
    });
    expect(tx.issueCertificate).toHaveBeenCalledWith("student-1", "admin-1");
    expect(tx.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "student-1", type: "payment" }),
    );
    expect(tx.createAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: "payment.confirm_cash" }),
    );
    expect(result.payment.status).toBe("lunas");
    expect(result.certificate).toEqual({ id: "certificate-1" });
  });

  it("rejects cash confirmation from non-admin actors", async () => {
    const { tx, dependencies } = createHarness();

    await expect(
      transitionPaymentWorkflow(
        { id: "instructor-1", role: "instruktur" },
        "payment-1",
        { action: "confirm_cash" },
        dependencies,
      ),
    ).rejects.toThrow("Forbidden");
    expect(tx.updatePayment).not.toHaveBeenCalled();
  });
});
