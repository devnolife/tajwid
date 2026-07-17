import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  transitionPaymentWorkflow: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/services/payment-service", () => ({
  transitionPaymentWorkflow: mocks.transitionPaymentWorkflow,
}));
vi.mock("@/lib/services/payment-db", () => ({
  paymentWorkflowDependencies: { transaction: vi.fn() },
}));
vi.mock("@/lib/db/storage", () => ({ storage: {} }));
vi.mock("@/lib/notify", () => ({ notify: vi.fn(), notifyTemplates: {} }));

import { PATCH } from "@/app/api/payments/[id]/route";

const paymentId = "4a329697-1de5-4099-9898-1d9dc34e6810";

function params(id = paymentId) {
  return { params: Promise.resolve({ id }) };
}

function request(body: unknown) {
  return new Request("http://localhost/api/payments/payment-1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("payment actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transitionPaymentWorkflow.mockResolvedValue({
      payment: { id: "payment-1", status: "menunggu_verifikasi" },
    });
  });

  it("passes a student proof action to the transactional workflow", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "student-1", role: "mahasiswa" },
    });

    const response = await PATCH(
      request({
        action: "submit_proof",
        proofUrl: `/api/payments/${paymentId}/proof`,
      }),
      params(),
    );

    expect(response.status).toBe(200);
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

  it("rejects client-owned status and timestamps", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "admin-1", role: "admin" } });

    const response = await PATCH(
      request({
        action: "approve",
        status: "lunas",
        paidAt: "2026-07-13T00:00:00.000Z",
      }),
      params(),
    );

    expect(response.status).toBe(400);
    expect(mocks.transitionPaymentWorkflow).not.toHaveBeenCalled();
  });

  it("accepts an explicit admin approval action", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "admin-1", role: "admin" } });
    mocks.transitionPaymentWorkflow.mockResolvedValue({
      payment: { id: "payment-1", status: "lunas" },
      certificate: { id: "certificate-1" },
    });

    const response = await PATCH(request({ action: "approve" }), params());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      id: "payment-1",
      status: "lunas",
    });
  });
});
