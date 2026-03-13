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
  const role = (session.user as any).role;
  if (role !== "instruktur" && role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const assessment = await storage.updateAssessment(id, body);
    if (!assessment) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    return NextResponse.json(assessment);
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 400 });
  }
}
