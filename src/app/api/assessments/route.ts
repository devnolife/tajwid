import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { storage } from "@/lib/db/storage";
import {
  getIdentity,
  requireRole,
  resolveAssignedResourceScope,
} from "@/lib/api/authz";
import { parseJson, toErrorResponse } from "@/lib/api/http";
import { assessmentCreateSchema } from "@/lib/api/schemas";
import { createAssessmentWorkflow } from "@/lib/services/assessment-service";
import { assessmentWorkflowDependencies } from "@/lib/services/assessment-db";

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
      return NextResponse.json(await storage.getAllAssessments());
    }
    if (scope.studentId && scope.instructorId) {
      return NextResponse.json(
        await storage.getAssessmentsByInstructorAndStudent(
          scope.instructorId,
          scope.studentId,
        ),
      );
    }
    if (scope.studentId) {
      return NextResponse.json(
        await storage.getAssessmentsByStudent(scope.studentId),
      );
    }
    if (!scope.instructorId) {
      throw new Error("Invalid assessment scope");
    }
    return NextResponse.json(
      await storage.getAssessmentsByInstructor(scope.instructorId),
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
    const input = await parseJson(request, assessmentCreateSchema);
    const assessment = await createAssessmentWorkflow(
      identity,
      input,
      assessmentWorkflowDependencies,
    );
    return NextResponse.json(assessment, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}

