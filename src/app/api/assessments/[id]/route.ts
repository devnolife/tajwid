import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getIdentity, requireRole } from "@/lib/api/authz";
import { parseJson, toErrorResponse } from "@/lib/api/http";
import { assessmentUpdateSchema } from "@/lib/api/schemas";
import { updateAssessmentWorkflow } from "@/lib/services/assessment-service";
import { assessmentWorkflowDependencies } from "@/lib/services/assessment-db";

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
    const input = await parseJson(request, assessmentUpdateSchema);
    const assessment = await updateAssessmentWorkflow(
      identity,
      id,
      input,
      assessmentWorkflowDependencies,
    );
    return NextResponse.json(assessment);
  } catch (error) {
    return toErrorResponse(error);
  }
}
