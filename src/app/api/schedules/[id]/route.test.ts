import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getSchedule: vi.fn(),
  updateSchedule: vi.fn(),
  createSchedule: vi.fn(),
  deleteSchedule: vi.fn(),
  createAuditEvent: vi.fn(),
  notify: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db/storage", () => ({
  storage: {
    getSchedule: mocks.getSchedule,
    updateSchedule: mocks.updateSchedule,
    createSchedule: mocks.createSchedule,
    deleteSchedule: mocks.deleteSchedule,
    createAuditEvent: mocks.createAuditEvent,
  },
}));
vi.mock("@/lib/notify", () => ({
  notify: mocks.notify,
  notifyTemplates: {
    repeatScheduleCreated: vi.fn(() => ({ title: "Jadwal ulang" })),
    scheduleUpdatedForStudent: vi.fn(() => ({ title: "Jadwal diperbarui" })),
    scheduleCancelledForStudent: vi.fn(() => ({ title: "Jadwal dibatalkan" })),
  },
}));

import { DELETE, PATCH } from "@/app/api/schedules/[id]/route";

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

function session(id: string, role: "mahasiswa" | "instruktur" | "admin") {
  return { user: { id, role } };
}

function params(id = schedule.id) {
  return { params: Promise.resolve({ id }) };
}

describe("schedule item authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSchedule.mockResolvedValue(schedule);
    mocks.updateSchedule.mockImplementation(async (_id, input) => ({
      ...schedule,
      ...input,
    }));
    mocks.createSchedule.mockResolvedValue({ ...schedule, id: "repeat-1" });
  });

  it("allows an instructor to edit only their own schedule fields", async () => {
    mocks.auth.mockResolvedValue(session("instructor-1", "instruktur"));

    const response = await PATCH(
      new Request("http://localhost/api/schedules/schedule-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: "2026-07-21T10:00:00.000Z",
          room: "Ruang B",
          location: "Lantai 2",
        }),
      }),
      params(),
    );

    expect(response.status).toBe(200);
    expect(mocks.updateSchedule).toHaveBeenCalledWith("schedule-1", {
      date: new Date("2026-07-21T10:00:00.000Z"),
      room: "Ruang B",
      location: "Lantai 2",
    });

    mocks.auth.mockResolvedValue(session("instructor-2", "instruktur"));
    expect(
      (
        await PATCH(
          new Request("http://localhost/api/schedules/schedule-1", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ room: "Forged" }),
          }),
          params(),
        )
      ).status,
    ).toBe(403);
  });

  it("rejects attempts to change schedule ownership", async () => {
    mocks.auth.mockResolvedValue(session("admin-1", "admin"));

    const response = await PATCH(
      new Request("http://localhost/api/schedules/schedule-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: "student-2" }),
      }),
      params(),
    );

    expect(response.status).toBe(400);
    expect(mocks.updateSchedule).not.toHaveBeenCalled();
  });

  it("restricts schedule deletion to administrators", async () => {
    mocks.auth.mockResolvedValue(session("instructor-1", "instruktur"));
    expect(
      (
        await DELETE(
          new Request("http://localhost/api/schedules/schedule-1", {
            method: "DELETE",
          }),
          params(),
        )
      ).status,
    ).toBe(403);

    mocks.auth.mockResolvedValue(session("admin-1", "admin"));
    expect(
      (
        await DELETE(
          new Request("http://localhost/api/schedules/schedule-1", {
            method: "DELETE",
          }),
          params(),
        )
      ).status,
    ).toBe(200);
    expect(mocks.deleteSchedule).toHaveBeenCalledWith("schedule-1");
  });
});
