import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getPaymentsByStudent: vi.fn(),
  getAssessmentByStudent: vi.fn(),
  getSettings: vi.fn(),
  ensureCertificatePayment: vi.fn(),
  notify: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db/storage", () => ({ storage: mocks }));
vi.mock("@/lib/notify", () => ({
  notify: mocks.notify,
  notifyTemplates: {
    paymentCreated: vi.fn((userId, amount) => ({
      userId,
      amount,
      type: "payment",
    })),
  },
}));

import { POST } from "@/app/api/payments/ensure-mine/route";

const payment = {
  id: "payment-1",
  studentId: "student-1",
  amount: "25000",
  academicYear: "2026/2027",
  billingKey: "certificate",
  status: "belum_bayar",
};

describe("ensure own certificate invoice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({
      user: { id: "student-1", role: "mahasiswa" },
    });
    mocks.getPaymentsByStudent.mockResolvedValue([]);
    mocks.getAssessmentByStudent.mockResolvedValue({ passed: true });
    mocks.getSettings.mockResolvedValue({
      paymentAmount: "25000",
      academicYear: "2026/2027",
    });
    mocks.ensureCertificatePayment.mockResolvedValue({
      payment,
      created: true,
    });
  });

  it("is student-only and derives the student from the session", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "instructor-1", role: "instruktur" },
    });
    expect((await POST()).status).toBe(403);
    expect(mocks.ensureCertificatePayment).not.toHaveBeenCalled();
  });

  it("atomically creates or returns the student's invoice", async () => {
    const response = await POST();

    expect(response.status).toBe(200);
    expect(mocks.ensureCertificatePayment).toHaveBeenCalledWith({
      studentId: "student-1",
      amount: "25000",
      academicYear: "2026/2027",
      dueDate: expect.any(Date),
      description: "Biaya Sertifikat Tajwid Tahun Akademik 2026/2027",
    });
    await expect(response.json()).resolves.toEqual({
      created: true,
      payments: [payment],
    });
  });

  it("does not create an invoice before passing", async () => {
    mocks.getAssessmentByStudent.mockResolvedValue({ passed: false });

    const response = await POST();

    await expect(response.json()).resolves.toEqual({
      created: false,
      payments: [],
      reason: "not_yet_passed",
    });
    expect(mocks.ensureCertificatePayment).not.toHaveBeenCalled();
  });
});
