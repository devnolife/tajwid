import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { storage } from "@/lib/db/storage";
import { notify, notifyTemplates } from "@/lib/notify";
import {
  ApiError,
  getIdentity,
  requireRole,
  resolveAssignedResourceScope,
} from "@/lib/api/authz";
import { parseJson, toErrorResponse } from "@/lib/api/http";
import { scheduleCreateSchema } from "@/lib/api/schemas";

export async function GET(request: Request) {
  try {
    const identity = getIdentity(await auth());
    const { searchParams } = new URL(request.url);
    const scope = resolveAssignedResourceScope(
      identity,
      searchParams.get("studentId"),
      searchParams.get("instructorId"),
    );

    if ("all" in scope) {
      return NextResponse.json(await storage.getAllSchedules());
    }
    if (scope.studentId && scope.instructorId) {
      return NextResponse.json(
        await storage.getSchedulesByInstructorAndStudent(
          scope.instructorId,
          scope.studentId,
        ),
      );
    }
    if (scope.studentId) {
      return NextResponse.json(
        await storage.getSchedulesByStudent(scope.studentId),
      );
    }
    if (!scope.instructorId) {
      throw new Error("Invalid schedule scope");
    }
    return NextResponse.json(
      await storage.getSchedulesByInstructor(scope.instructorId),
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const identity = requireRole(
      getIdentity(await auth()),
      "admin",
      "instruktur",
    );
    const input = await parseJson(request, scheduleCreateSchema);
    if (
      identity.role === "instruktur" &&
      input.instructorId !== identity.id
    ) {
      throw new ApiError(403, "Forbidden", "FORBIDDEN");
    }

    const student = await storage.getUser(input.studentId);
    if (!student || student.role !== "mahasiswa") {
      throw new ApiError(400, "Mahasiswa tidak valid", "INVALID_INPUT");
    }
    if (identity.role === "admin") {
      const instructor = await storage.getUser(input.instructorId);
      if (!instructor || instructor.role !== "instruktur") {
        throw new ApiError(400, "Instruktur tidak valid", "INVALID_INPUT");
      }
    }

    const schedule = await storage.createSchedule({
      ...input,
      date: new Date(input.date),
    });
    await storage.createAuditEvent({
      actorId: identity.id,
      action: "schedule.created",
      entityType: "schedule",
      entityId: schedule.id,
      details: {
        studentId: schedule.studentId,
        instructorId: schedule.instructorId,
      },
    });
    await notify(
      notifyTemplates.scheduleCreatedForStudent(
        schedule.studentId,
        new Date(schedule.date),
        schedule.room,
      ),
    );
    await notify(
      notifyTemplates.scheduleCreatedForInstructor(
        schedule.instructorId,
        student.name,
        new Date(schedule.date),
      ),
    );
    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
