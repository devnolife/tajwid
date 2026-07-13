import { NextResponse } from "next/server";
import { seedDatabase } from "@/lib/db/seed";
import { auth } from "@/lib/auth";
import { getIdentity, requireRole } from "@/lib/api/authz";
import { toErrorResponse } from "@/lib/api/http";

export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    requireRole(getIdentity(await auth()), "admin");
    await seedDatabase();
    return NextResponse.json({ message: "Database seeded" });
  } catch (error) {
    return toErrorResponse(error);
  }
}
