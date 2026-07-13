import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { storage } from "@/lib/db/storage";
import { notify, notifyTemplates } from "@/lib/notify";
import { getIdentity, resolveStudentResourceScope } from "@/lib/api/authz";
import { toErrorResponse } from "@/lib/api/http";

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
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }
  if ((session.user as any).role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    if (body.dueDate && typeof body.dueDate === "string") {
      body.dueDate = new Date(body.dueDate);
    }
    if (body.paidAt && typeof body.paidAt === "string") {
      body.paidAt = new Date(body.paidAt);
    }
    const payment = await storage.createPayment(body);
    if (payment.studentId) {
      await notify(notifyTemplates.paymentCreated(payment.studentId, payment.amount, payment.id));
    }
    return NextResponse.json(payment);
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 400 });
  }
}
