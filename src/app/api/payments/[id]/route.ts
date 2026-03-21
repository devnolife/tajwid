import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { storage } from "@/lib/db/storage";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    if (body.dueDate && typeof body.dueDate === "string") {
      body.dueDate = new Date(body.dueDate);
    }
    if (body.paidAt && typeof body.paidAt === "string") {
      body.paidAt = new Date(body.paidAt);
    }
    const payment = await storage.updatePayment(id, body);
    if (!payment) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    return NextResponse.json(payment);
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 400 });
  }
}
