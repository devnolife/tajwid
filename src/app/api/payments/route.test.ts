import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getAllPayments: vi.fn(),
  getPaymentsByStudent: vi.fn(),
  createPayment: vi.fn(),
  getSettings: vi.fn(),
  createAuditEvent: vi.fn(),
  notify: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db/storage", () => ({
  storage: {
    getAllPayments: mocks.getAllPayments,
    getPaymentsByStudent: mocks.getPaymentsByStudent,
    createPayment: mocks.createPayment,
    getSettings: mocks.getSettings,
    createAuditEvent: mocks.createAuditEvent,
  },
}));
vi.mock("@/lib/notify", () => ({
  notify: mocks.notify,
  notifyTemplates: {
    paymentCreated: vi.fn(() => ({ title: "Tagihan baru" })),
  },
}));

import { GET } from "@/app/api/payments/route";

function session(id: string, role: "mahasiswa" | "instruktur" | "admin") {
  return { user: { id, role } };
}

describe("payments collection authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAllPayments.mockResolvedValue([]);
    mocks.getPaymentsByStudent.mockResolvedValue([]);
  });

  it("always scopes a student to their own payments", async () => {
    mocks.auth.mockResolvedValue(session("student-1", "mahasiswa"));

    const ownResponse = await GET(
      new Request("http://localhost/api/payments"),
    );
    expect(ownResponse.status).toBe(200);
    expect(mocks.getPaymentsByStudent).toHaveBeenCalledWith("student-1");
    expect(mocks.getAllPayments).not.toHaveBeenCalled();

    const crossResponse = await GET(
      new Request("http://localhost/api/payments?studentId=student-2"),
    );
    expect(crossResponse.status).toBe(403);
  });

  it("does not expose raw payments to instructors", async () => {
    mocks.auth.mockResolvedValue(session("instructor-1", "instruktur"));

    const response = await GET(new Request("http://localhost/api/payments"));

    expect(response.status).toBe(403);
    expect(mocks.getAllPayments).not.toHaveBeenCalled();
  });

  it("allows an administrator to list or filter payments", async () => {
    mocks.auth.mockResolvedValue(session("admin-1", "admin"));

    expect(
      (await GET(new Request("http://localhost/api/payments"))).status,
    ).toBe(200);
    expect(mocks.getAllPayments).toHaveBeenCalledOnce();

    expect(
      (
        await GET(
          new Request(
            "http://localhost/api/payments?studentId=student-2",
          ),
        )
      ).status,
    ).toBe(200);
    expect(mocks.getPaymentsByStudent).toHaveBeenCalledWith("student-2");
  });
});
