import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { storage } from "@/lib/db/storage";
import { notify, notifyTemplates } from "@/lib/notify";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }
  const role = (session.user as any).role;
  const userId = (session.user as any).id;
  const { id } = await params;

  try {
    const body = await request.json();
    if (body.date && typeof body.date === "string") {
      body.date = new Date(body.date);
    }
    const rescheduleAt: string | null = body.rescheduleAt ?? null;
    const rescheduleRoom: string | null = body.rescheduleRoom ?? null;
    delete body.rescheduleAt;
    delete body.rescheduleRoom;

    let updateData: any = body;
    if (role !== "admin") {
      const existing = await storage.getSchedule(id);
      if (!existing) {
        return NextResponse.json({ message: "Not found" }, { status: 404 });
      }
      if (role !== "instruktur" || existing.instructorId !== userId) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      }
      // Instruktur hanya boleh mengubah status sesinya sendiri
      updateData = {};
      if (body.status) updateData.status = body.status;
    }

    const schedule = await storage.updateSchedule(id, updateData);
    if (!schedule) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
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
          status: "scheduled" as any,
          isRepeat: true as any,
          parentScheduleId: schedule.id as any,
        } as any);
        await notify(notifyTemplates.repeatScheduleCreated(schedule.studentId, new Date(newSchedule.date), newSchedule.room));
      } catch (err) {
        console.error("[schedules PATCH] gagal membuat jadwal ulang dari no_show:", err);
      }
    }

    return NextResponse.json(schedule);
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }
  if ((session.user as any).role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    await storage.deleteSchedule(id);
    return NextResponse.json({ message: "Schedule deleted" });
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 400 });
  }
}
