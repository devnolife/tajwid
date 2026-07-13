import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { storage } from "@/lib/db/storage";
import { getIdentity, requireRole } from "@/lib/api/authz";
import { parseJson, toErrorResponse } from "@/lib/api/http";
import { settingsUpdateSchema } from "@/lib/api/schemas";

export async function GET() {
  try {
    requireRole(getIdentity(await auth()), "admin");
    const settings = await storage.getSettings();
    return NextResponse.json(settings ?? {});
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const identity = requireRole(getIdentity(await auth()), "admin");
    const input = await parseJson(request, settingsUpdateSchema);
    const settings = await storage.updateSettings(input);
    await storage.createAuditEvent({
      actorId: identity.id,
      action: "settings.updated",
      entityType: "settings",
      entityId: settings?.id ?? null,
      details: { fields: Object.keys(input) },
    });
    return NextResponse.json(settings);
  } catch (error) {
    return toErrorResponse(error);
  }
}
