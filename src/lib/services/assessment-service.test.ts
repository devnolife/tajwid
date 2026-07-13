import { describe, expect, it, vi } from "vitest";
import { ApiError, type Identity } from "@/lib/api/authz";
import {
  createAssessmentWorkflow,
  type AssessmentTransaction,
  type AssessmentWorkflowDependencies,
} from "@/lib/services/assessment-service";

const schedule = {
  id: "schedule-1",
  studentId: "student-1",
  instructorId: "instructor-1",
  date: new Date("2026-07-20T09:00:00.000Z"),
  room: "Ruang A",
  location: null,
  status: "scheduled" as const,
  isRepeat: false,
  parentScheduleId: null,
};

const input = {
  scheduleId: schedule.id,
  tajwid: 80,
  kelancaran: 70,
  makhorijulHuruf: 60,
  adab: 90,
  notes: "Bacaan cukup baik",
};

function createHarness(overrides: Partial<AssessmentTransaction> = {}) {
  const tx: AssessmentTransaction = {
    getSchedule: vi.fn().mockResolvedValue(schedule),
    getSettings: vi.fn().mockResolvedValue({
      passingScore: 76,
      paymentAmount: "25000",
      academicYear: "2026/2027",
    }),
    createAssessment: vi.fn().mockImplementation(async (data) => ({
      id: "assessment-1",
      assessedAt: new Date("2026-07-13T00:00:00.000Z"),
      updatedAt: new Date("2026-07-13T00:00:00.000Z"),
      ...data,
    })),
    completeSchedule: vi.fn().mockResolvedValue(undefined),
    createCertificatePayment: vi.fn().mockResolvedValue(null),
    createRepeatSchedule: vi.fn().mockResolvedValue(null),
    createNotification: vi.fn().mockResolvedValue(undefined),
    createAuditEvent: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
  const dependencies: AssessmentWorkflowDependencies = {
    transaction: vi.fn(async (work) => work(tx)),
  };
  return { tx, dependencies };
}

const instructor: Identity = { id: "instructor-1", role: "instruktur" };

describe("assessment workflow", () => {
  it("derives identity, total, and outcome inside one transaction", async () => {
    const { tx, dependencies } = createHarness();

    const assessment = await createAssessmentWorkflow(
      instructor,
      input,
      dependencies,
    );

    expect(dependencies.transaction).toHaveBeenCalledOnce();
    expect(tx.createAssessment).toHaveBeenCalledWith(
      expect.objectContaining({
        scheduleId: "schedule-1",
        studentId: "student-1",
        instructorId: "instructor-1",
        totalScore: 75,
        passingScore: 76,
        passed: false,
        outcomeOverridden: false,
      }),
    );
    expect(tx.completeSchedule).toHaveBeenCalledWith("schedule-1");
    expect(tx.createCertificatePayment).not.toHaveBeenCalled();
    expect(assessment.totalScore).toBe(75);
  });

  it("rejects an instructor who does not own the schedule", async () => {
    const { tx, dependencies } = createHarness();

    await expect(
      createAssessmentWorkflow(
        { id: "instructor-2", role: "instruktur" },
        input,
        dependencies,
      ),
    ).rejects.toBeInstanceOf(ApiError);
    expect(tx.createAssessment).not.toHaveBeenCalled();
  });

  it("creates one certificate invoice only for a passing result", async () => {
    const createCertificatePayment = vi.fn().mockResolvedValue({
      id: "payment-1",
      amount: "25000",
    });
    const { tx, dependencies } = createHarness({ createCertificatePayment });

    await createAssessmentWorkflow(
      instructor,
      {
        ...input,
        tajwid: 90,
        kelancaran: 90,
        makhorijulHuruf: 90,
        adab: 90,
      },
      dependencies,
    );

    expect(createCertificatePayment).toHaveBeenCalledWith({
      studentId: "student-1",
      amount: "25000",
      academicYear: "2026/2027",
      dueDate: expect.any(Date),
      description: "Biaya Sertifikat Tajwid Tahun Akademik 2026/2027",
    });
    expect(tx.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "student-1", type: "payment" }),
    );
  });

  it("creates a repeat schedule only for a failed result that requests one", async () => {
    const createRepeatSchedule = vi.fn().mockResolvedValue({
      id: "repeat-1",
      date: new Date("2026-07-27T09:00:00.000Z"),
      room: "Ruang B",
    });
    const { tx, dependencies } = createHarness({ createRepeatSchedule });

    await createAssessmentWorkflow(
      instructor,
      {
        ...input,
        repeatScheduleAt: "2026-07-27T09:00:00.000Z",
        repeatRoom: "Ruang B",
      },
      dependencies,
    );

    expect(createRepeatSchedule).toHaveBeenCalledWith({
      studentId: "student-1",
      instructorId: "instructor-1",
      parentScheduleId: "schedule-1",
      date: new Date("2026-07-27T09:00:00.000Z"),
      room: "Ruang B",
      location: null,
    });
    expect(tx.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "student-1", type: "schedule" }),
    );
  });
});
