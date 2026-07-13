import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

const HEADERS = { "Cache-Control": "no-store" } as const;

export async function GET() {
  try {
    await db.execute(sql`select 1 as ok`);
    return NextResponse.json({ status: "ok" }, { headers: HEADERS });
  } catch {
    return NextResponse.json(
      { status: "unavailable" },
      { status: 503, headers: HEADERS },
    );
  }
}
