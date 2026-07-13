import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { storage } from "@/lib/db/storage";
import { notify, notifyTemplates } from "@/lib/notify";
import {
  ApiError,
  getIdentity,
  requireRole,
  resolveStudentResourceScope,
} from "@/lib/api/authz";
import { parseJson, toErrorResponse } from "@/lib/api/http";
import { paymentCreateSchema } from "@/lib/api/schemas";

export async function GET(request: Request) {
  try {
    const identity = getIdentity(await auth());
    const requestedStudentId = new URL(request.url).searchParams.get("studentId");
    const scope = resolveStudentResourceScope(identity, requestedStudentId);
    if ("all" in scope) {
      return NextResponse.json(await storage.getAllPayments());
    }
    if (!scope.studentId) {
      throw new Error("Invalid payment scope");
    }
    const paymentList = await storage.getPaymentsByStudent(scope.studentId);
    return NextResponse.json(paymentList);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const identity = requireRole(getIdentity(await auth()), "admin");
    const input = await parseJson(request, paymentCreateSchema);
    const student = await storage.getUser(input.studentId);
    if (!student || student.role !== "mahasiswa") {
      throw new ApiError(400, "Mahasiswa tidak valid", "INVALID_INPUT");
    }

    const settings = await storage.getSettings();
    const academicYear = settings?.academicYear ?? "2025/2026";
    const payment = await storage.createPayment({
      ...input,
      dueDate: new Date(input.dueDate),
      academicYear,
      billingKey: "certificate",
      status: "belum_bayar",
    });
    await storage.createAuditEvent({
      actorId: identity.id,
      action: "payment.created",
      entityType: "payment",
      entityId: payment.id,
      details: { studentId: payment.studentId },
    });
    await notify(
      notifyTemplates.paymentCreated(
        payment.studentId,
        payment.amount,
        payment.id,
      ),
    );
    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
