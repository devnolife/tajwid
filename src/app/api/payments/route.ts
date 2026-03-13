import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { storage } from "@/lib/db/storage";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId");

  if (studentId) {
    const payments = await storage.getPaymentsByStudent(studentId);
    return NextResponse.json(payments);
  }

  const payments = await storage.getAllPayments();
  return NextResponse.json(payments);
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
    const payment = await storage.createPayment(body);
    return NextResponse.json(payment);
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 400 });
  }
}
