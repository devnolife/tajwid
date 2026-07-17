import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getPayment: vi.fn(),
  writePaymentProof: vi.fn(),
  readPaymentProof: vi.fn(),
  deletePaymentProof: vi.fn(),
  detectPaymentProofType: vi.fn(),
  getPaymentProofRoot: vi.fn(),
  transitionPaymentWorkflow: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db/storage", () => ({
  storage: { getPayment: mocks.getPayment },
}));
vi.mock("@/lib/security/payment-proof", () => ({
  writePaymentProof: mocks.writePaymentProof,
  readPaymentProof: mocks.readPaymentProof,
  deletePaymentProof: mocks.deletePaymentProof,
  detectPaymentProofType: mocks.detectPaymentProofType,
  getPaymentProofRoot: mocks.getPaymentProofRoot,
}));
vi.mock("@/lib/services/payment-service", () => ({
  transitionPaymentWorkflow: mocks.transitionPaymentWorkflow,
}));
vi.mock("@/lib/services/payment-db", () => ({
  paymentWorkflowDependencies: { transaction: vi.fn() },
}));

import { GET, POST } from "@/app/api/payments/[id]/proof/route";

const paymentId = "4a329697-1de5-4099-9898-1d9dc34e6810";
const payment = {
  id: paymentId,
  studentId: "student-1",
  status: "belum_bayar" as const,
};
const context = { params: Promise.resolve({ id: paymentId }) };

function uploadRequest() {
  const form = new FormData();
  form.append(
    "file",
    new Blob([
      new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    ], { type: "image/png" }),
    "proof.png",
  );
  return new Request(`http://localhost/api/payments/${paymentId}/proof`, {
    method: "POST",
    body: form,
  });
}

describe("private payment proof endpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({
      user: { id: "student-1", role: "mahasiswa" },
    });
    mocks.getPayment.mockResolvedValue(payment);
    mocks.getPaymentProofRoot.mockReturnValue("/private/proofs");
    mocks.writePaymentProof.mockResolvedValue({
      path: `/private/proofs/${paymentId}.proof`,
      mimeType: "image/png",
      extension: "png",
      size: 8,
    });
    mocks.transitionPaymentWorkflow.mockResolvedValue({
      payment: { ...payment, status: "menunggu_verifikasi" },
    });
    mocks.readPaymentProof.mockResolvedValue(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
    mocks.detectPaymentProofType.mockReturnValue({
      mimeType: "image/png",
      extension: "png",
    });
  });

  it("stores an owner upload privately and submits the canonical proof action", async () => {
    const response = await POST(uploadRequest(), context);

    expect(response.status).toBe(201);
    expect(mocks.writePaymentProof).toHaveBeenCalledWith(
      "/private/proofs",
      paymentId,
      expect.any(Buffer),
    );
    expect(mocks.transitionPaymentWorkflow).toHaveBeenCalledWith(
      { id: "student-1", role: "mahasiswa" },
      paymentId,
      {
        action: "submit_proof",
        proofUrl: `/api/payments/${paymentId}/proof`,
      },
      expect.any(Object),
    );
  });

  it("rejects a non-owner before writing bytes", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "student-2", role: "mahasiswa" },
    });

    const response = await POST(uploadRequest(), context);

    expect(response.status).toBe(403);
    expect(mocks.writePaymentProof).not.toHaveBeenCalled();
  });

  it("serves proof only to its owner or an administrator as an attachment", async () => {
    const response = await GET(
      new Request(`http://localhost/api/payments/${paymentId}/proof`),
      context,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(response.headers.get("content-disposition")).toContain("attachment");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");

    mocks.auth.mockResolvedValue({
      user: { id: "instructor-1", role: "instruktur" },
    });
    expect(
      (
        await GET(
          new Request(`http://localhost/api/payments/${paymentId}/proof`),
          context,
        )
      ).status,
    ).toBe(403);
  });
});
