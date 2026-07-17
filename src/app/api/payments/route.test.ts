import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getAllPayments: vi.fn(),
  getPaymentsByStudent: vi.fn(),
  createPayment: vi.fn(),
  getSettings: vi.fn(),
  getUser: vi.fn(),
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
    getUser: mocks.getUser,
    createAuditEvent: mocks.createAuditEvent,
  },
}));
vi.mock("@/lib/notify", () => ({
  notify: mocks.notify,
  notifyTemplates: {
    paymentCreated: vi.fn(() => ({ title: "Tagihan baru" })),
  },
}));

import { GET, POST } from "@/app/api/payments/route";

function session(id: string, role: "mahasiswa" | "instruktur" | "admin") {
  return { user: { id, role } };
}

describe("payments collection authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAllPayments.mockResolvedValue([]);
    mocks.getPaymentsByStudent.mockResolvedValue([]);
    mocks.getSettings.mockResolvedValue({ academicYear: "2026/2027" });
    mocks.getUser.mockResolvedValue({ id: "student-1", role: "mahasiswa" });
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

  it("creates an admin payment with server-owned billing metadata", async () => {
    const studentId = "b3919af3-f943-4cfa-856d-d53fdfdf7a8e";
    mocks.auth.mockResolvedValue(session("admin-1", "admin"));
    mocks.getUser.mockResolvedValue({ id: studentId, role: "mahasiswa" });
    mocks.createPayment.mockImplementation(async (input) => ({
      id: "payment-1",
      ...input,
    }));

    const response = await POST(
      new Request("http://localhost/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          amount: "25000",
          dueDate: "2026-08-13T00:00:00.000Z",
          description: "Biaya sertifikat",
        }),
      }),
    );

    expect(response.status).toBe(201);
    expect(mocks.createPayment).toHaveBeenCalledWith({
      studentId,
      amount: "25000",
      dueDate: new Date("2026-08-13T00:00:00.000Z"),
      description: "Biaya sertifikat",
      academicYear: "2026/2027",
      billingKey: "certificate",
      status: "belum_bayar",
    });
  });

  it("rejects non-admin creation and client-owned payment state", async () => {
    const valid = {
      studentId: "b3919af3-f943-4cfa-856d-d53fdfdf7a8e",
      amount: "25000",
      dueDate: "2026-08-13T00:00:00.000Z",
    };
    mocks.auth.mockResolvedValue(session("instructor-1", "instruktur"));
    expect(
      (
        await POST(
          new Request("http://localhost/api/payments", {
            method: "POST",
            body: JSON.stringify(valid),
          }),
        )
      ).status,
    ).toBe(403);

    mocks.auth.mockResolvedValue(session("admin-1", "admin"));
    const injected = await POST(
      new Request("http://localhost/api/payments", {
        method: "POST",
        body: JSON.stringify({ ...valid, status: "lunas" }),
      }),
    );
    expect(injected.status).toBe(400);
  });
});
