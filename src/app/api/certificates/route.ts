import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { storage } from "@/lib/db/storage";
import {
  ApiError,
  getIdentity,
  requireRole,
  resolveStudentResourceScope,
} from "@/lib/api/authz";
import { parseJson, toErrorResponse } from "@/lib/api/http";
import { certificateBackfillSchema } from "@/lib/api/schemas";
import { issueCertificateForStudent } from "@/lib/services/certificate-service";

export async function GET(request: Request) {
  try {
    const identity = getIdentity(await auth());
    const requestedStudentId = new URL(request.url).searchParams.get("studentId");
    const scope = resolveStudentResourceScope(identity, requestedStudentId);
    if ("all" in scope || !scope.studentId) {
      throw new ApiError(400, "studentId required", "INVALID_INPUT");
    }
    const cert = await storage.getCertificateByStudent(scope.studentId);
    return NextResponse.json(cert ?? null);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const identity = requireRole(getIdentity(await auth()), "admin");
    const input = await parseJson(request, certificateBackfillSchema);
    const certificate = await issueCertificateForStudent(
      input.studentId,
      identity.id,
    );
    return NextResponse.json(certificate, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
