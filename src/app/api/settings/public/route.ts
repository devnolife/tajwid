import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { storage } from "@/lib/db/storage";
import { getIdentity } from "@/lib/api/authz";
import { toErrorResponse } from "@/lib/api/http";

export async function GET() {
  try {
    getIdentity(await auth());
    const settings = await storage.getSettings();
    return NextResponse.json({
      appName: settings?.appName ?? "TajwidKu",
      academicYear: settings?.academicYear ?? "2025/2026",
      passingScore: settings?.passingScore ?? 70,
      paymentAmount: settings?.paymentAmount ?? "25000",
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
