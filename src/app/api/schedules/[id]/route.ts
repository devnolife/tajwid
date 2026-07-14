import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { storage } from "@/lib/db/storage";
import { notify, notifyTemplates } from "@/lib/notify";
import {
  ApiError,
  getIdentity,
  requireRole,
} from "@/lib/api/authz";
import { parseJson, toErrorResponse } from "@/lib/api/http";
import { scheduleUpdateSchema } from "@/lib/api/schemas";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const identity = requireRole(
      getIdentity(await auth()),
      "admin",
      "instruktur",
    );
    const { id } = await params;
    const input = await parseJson(request, scheduleUpdateSchema);
    const existing = await storage.getSchedule(id);
    if (!existing) {
      throw new ApiError(404, "Not found", "NOT_FOUND");
    }
    if (
      identity.role === "instruktur" &&
      existing.instructorId !== identity.id
    ) {
      throw new ApiError(403, "Forbidden", "FORBIDDEN");
    }

    const { rescheduleAt, rescheduleRoom, date, ...fields } = input;
    const updateData = {
      ...fields,
      ...(date ? { date: new Date(date) } : {}),
    };

    const schedule = await storage.updateSchedule(id, updateData);
    if (!schedule) {
      throw new ApiError(404, "Not found", "NOT_FOUND");
    }

    // Saat sesi ditandai TIDAK HADIR dan instruktur sekaligus memilih
    // jadwal ulang, buat sesi baru (isRepeat=true) + notifikasi mahasiswa.
    if (updateData.status === "no_show" && rescheduleAt) {
      try {
        const newSchedule = await storage.createSchedule({
          studentId: schedule.studentId,
          instructorId: schedule.instructorId,
          date: new Date(rescheduleAt),
          room: rescheduleRoom || schedule.room,
          location: schedule.location ?? null,
          status: "scheduled",
          isRepeat: true,
          parentScheduleId: schedule.id,
        });
        await notify(notifyTemplates.repeatScheduleCreated(schedule.studentId, new Date(newSchedule.date), newSchedule.room));
      } catch (err) {
        console.error("[schedules PATCH] gagal membuat jadwal ulang dari no_show:", err);
      }
    }

    await storage.createAuditEvent({
      actorId: identity.id,
      action: "schedule.updated",
      entityType: "schedule",
      entityId: schedule.id,
      details: { fields: Object.keys(input) },
    });

    // Beri tahu mahasiswa saat jadwal berubah waktu/tempat atau dibatalkan.
    if (updateData.status === "cancelled" && existing.status !== "cancelled") {
      await notify(
        notifyTemplates.scheduleCancelledForStudent(
          schedule.studentId,
          new Date(schedule.date),
        ),
      );
    } else if (
      (date && new Date(date).getTime() !== new Date(existing.date).getTime()) ||
      (fields.room && fields.room !== existing.room)
    ) {
      await notify(
        notifyTemplates.scheduleUpdatedForStudent(
          schedule.studentId,
          new Date(schedule.date),
          schedule.room,
        ),
      );
    }

    return NextResponse.json(schedule);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const identity = requireRole(getIdentity(await auth()), "admin");
    const { id } = await params;
    await storage.deleteSchedule(id);
    await storage.createAuditEvent({
      actorId: identity.id,
      action: "schedule.deleted",
      entityType: "schedule",
      entityId: id,
      details: null,
    });
    return NextResponse.json({ message: "Schedule deleted" });
  } catch (error) {
    return toErrorResponse(error);
  }
}
