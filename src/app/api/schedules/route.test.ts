import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getAllSchedules: vi.fn(),
  getSchedulesByStudent: vi.fn(),
  getSchedulesByInstructor: vi.fn(),
  getSchedulesByInstructorAndStudent: vi.fn(),
  createSchedule: vi.fn(),
  getUser: vi.fn(),
  createAuditEvent: vi.fn(),
  notify: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db/storage", () => ({
  storage: {
    getAllSchedules: mocks.getAllSchedules,
    getSchedulesByStudent: mocks.getSchedulesByStudent,
    getSchedulesByInstructor: mocks.getSchedulesByInstructor,
    getSchedulesByInstructorAndStudent:
      mocks.getSchedulesByInstructorAndStudent,
    createSchedule: mocks.createSchedule,
    getUser: mocks.getUser,
    createAuditEvent: mocks.createAuditEvent,
  },
}));
vi.mock("@/lib/notify", () => ({
  notify: mocks.notify,
  notifyTemplates: {
    scheduleCreatedForStudent: vi.fn(() => ({ title: "Jadwal" })),
    scheduleCreatedForInstructor: vi.fn(() => ({ title: "Jadwal" })),
  },
}));

import { GET, POST } from "@/app/api/schedules/route";

function session(id: string, role: "mahasiswa" | "instruktur" | "admin") {
  return { user: { id, role } };
}

describe("schedule collection authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAllSchedules.mockResolvedValue([]);
    mocks.getSchedulesByStudent.mockResolvedValue([]);
    mocks.getSchedulesByInstructor.mockResolvedValue([]);
    mocks.getSchedulesByInstructorAndStudent.mockResolvedValue([]);
  });

  it("scopes students to their own schedules", async () => {
    mocks.auth.mockResolvedValue(session("student-1", "mahasiswa"));

    const response = await GET(new Request("http://localhost/api/schedules"));
    expect(response.status).toBe(200);
    expect(mocks.getSchedulesByStudent).toHaveBeenCalledWith("student-1");

    const crossResponse = await GET(
      new Request("http://localhost/api/schedules?studentId=student-2"),
    );
    expect(crossResponse.status).toBe(403);
  });

  it("scopes instructors to their own schedules with an optional student filter", async () => {
    mocks.auth.mockResolvedValue(session("instructor-1", "instruktur"));

    const response = await GET(new Request("http://localhost/api/schedules"));
    expect(response.status).toBe(200);
    expect(mocks.getSchedulesByInstructor).toHaveBeenCalledWith("instructor-1");

    const filtered = await GET(
      new Request("http://localhost/api/schedules?studentId=student-2"),
    );
    expect(filtered.status).toBe(200);
    expect(mocks.getSchedulesByInstructorAndStudent).toHaveBeenCalledWith(
      "instructor-1",
      "student-2",
    );

    const crossResponse = await GET(
      new Request(
        "http://localhost/api/schedules?instructorId=instructor-2",
      ),
    );
    expect(crossResponse.status).toBe(403);
  });

  it("preserves administrator list and filter access", async () => {
    mocks.auth.mockResolvedValue(session("admin-1", "admin"));

    expect(
      (await GET(new Request("http://localhost/api/schedules"))).status,
    ).toBe(200);
    expect(mocks.getAllSchedules).toHaveBeenCalledOnce();

    expect(
      (
        await GET(
          new Request(
            "http://localhost/api/schedules?instructorId=instructor-2",
          ),
        )
      ).status,
    ).toBe(200);
    expect(mocks.getSchedulesByInstructor).toHaveBeenCalledWith("instructor-2");
  });

  it("lets an instructor create only a schedule assigned to themselves", async () => {
    const instructorId = "72bff73d-959f-4376-98cf-e10561a6eb85";
    const studentId = "b3919af3-f943-4cfa-856d-d53fdfdf7a8e";
    mocks.auth.mockResolvedValue(session(instructorId, "instruktur"));
    mocks.getUser.mockResolvedValue({ id: studentId, role: "mahasiswa", name: "Student" });
    mocks.createSchedule.mockImplementation(async (input) => ({
      id: "schedule-1",
      ...input,
    }));

    const response = await POST(
      new Request("http://localhost/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          instructorId,
          date: "2026-07-20T09:00:00.000Z",
          room: "Ruang A",
        }),
      }),
    );

    expect(response.status).toBe(201);
    expect(mocks.createSchedule).toHaveBeenCalledWith(
      expect.objectContaining({
        studentId,
        instructorId,
        date: new Date("2026-07-20T09:00:00.000Z"),
      }),
    );

    const forged = await POST(
      new Request("http://localhost/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          instructorId: "a8f35f2c-a9eb-4278-8601-1cb35b049dd4",
          date: "2026-07-20T09:00:00.000Z",
          room: "Ruang A",
        }),
      }),
    );
    expect(forged.status).toBe(403);
  });

  it("rejects client-owned schedule state", async () => {
    mocks.auth.mockResolvedValue(session("admin-1", "admin"));

    const response = await POST(
      new Request("http://localhost/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: "b3919af3-f943-4cfa-856d-d53fdfdf7a8e",
          instructorId: "72bff73d-959f-4376-98cf-e10561a6eb85",
          date: "2026-07-20T09:00:00.000Z",
          room: "Ruang A",
          status: "completed",
        }),
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.createSchedule).not.toHaveBeenCalled();
  });
});
