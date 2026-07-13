import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { storage } from "@/lib/db/storage";
import { ApiError, getIdentity } from "@/lib/api/authz";
import { toPublicUser } from "@/lib/api/dto";
import { parseJson, toErrorResponse } from "@/lib/api/http";
import { userUpdateSchema } from "@/lib/api/schemas";

export async function GET() {
  try {
    const identity = getIdentity(await auth());
    const user = await storage.getUser(identity.id);
    if (!user) {
      throw new ApiError(404, "User not found", "NOT_FOUND");
    }
    return NextResponse.json(toPublicUser(user));
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const identity = getIdentity(await auth());
    const input = await parseJson(request, userUpdateSchema);
    const user = await storage.updateUser(identity.id, input);
    if (!user) {
      throw new ApiError(404, "User not found", "NOT_FOUND");
    }
    return NextResponse.json(toPublicUser(user));
  } catch (error) {
    return toErrorResponse(error);
  }
}
