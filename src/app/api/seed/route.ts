import { NextResponse } from "next/server";
import { seedDatabase } from "@/lib/db/seed";

export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    await seedDatabase();
    return NextResponse.json({ message: "Database seeded" });
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 });
  }
}
