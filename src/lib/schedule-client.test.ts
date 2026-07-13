import { describe, expect, it, vi } from "vitest";
import {
  createInstructorSchedule,
  selectCurrentSchedule,
  updateInstructorSchedule,
} from "@/lib/schedule-client";

describe("schedule client", () => {
  it("creates a schedule assigned to the current instructor", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "schedule-1" }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await createInstructorSchedule(
      {
        studentId: "student-1",
        instructorId: "instructor-1",
        date: "2026-07-20T09:00",
        room: "Ruang A",
        location: "Lantai 2",
      },
      fetcher,
    );

    expect(fetcher).toHaveBeenCalledWith("/api/schedules", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: "student-1",
        instructorId: "instructor-1",
        date: new Date("2026-07-20T09:00").toISOString(),
        room: "Ruang A",
        location: "Lantai 2",
      }),
    });
  });

  it("updates only editable schedule details", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "schedule-1" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await updateInstructorSchedule(
      "schedule-1",
      {
        date: "2026-07-21T10:00",
        room: "Ruang B",
        location: "Lantai 3",
      },
      fetcher,
    );

    expect(fetcher).toHaveBeenCalledWith("/api/schedules/schedule-1", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: new Date("2026-07-21T10:00").toISOString(),
        room: "Ruang B",
        location: "Lantai 3",
      }),
    });
  });

  it("selects the nearest active schedule without mutating history", () => {
    const schedules = [
      { id: "far", date: "2026-08-20T09:00:00.000Z", status: "scheduled" },
      { id: "past", date: "2026-07-10T09:00:00.000Z", status: "completed" },
      { id: "near", date: "2026-07-20T09:00:00.000Z", status: "scheduled" },
    ] as const;

    expect(
      selectCurrentSchedule(
        schedules,
        new Date("2026-07-14T00:00:00.000Z"),
      )?.id,
    ).toBe("near");
    expect(schedules.map(({ id }) => id)).toEqual(["far", "past", "near"]);

    expect(
      selectCurrentSchedule(
        schedules,
        new Date("2026-09-01T00:00:00.000Z"),
      )?.id,
    ).toBe("far");
  });
});
