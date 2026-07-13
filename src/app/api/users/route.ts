import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { storage } from "@/lib/db/storage";
import { ApiError, getIdentity, requireRole, type AppRole } from "@/lib/api/authz";
import {
  toInstructorDirectoryEntry,
  toPublicUser,
  toStudentDirectoryEntry,
} from "@/lib/api/dto";
import { parseJson, toErrorResponse } from "@/lib/api/http";
import { userCreateSchema } from "@/lib/api/schemas";
import { hashPassword } from "@/lib/security/password";

function isAppRole(value: string | null): value is AppRole {
  return value === "mahasiswa" || value === "instruktur" || value === "admin";
}

export async function GET(request: Request) {
  try {
    const identity = getIdentity(await auth());
    const roleParam = new URL(request.url).searchParams.get("role");
    if (roleParam && !isAppRole(roleParam)) {
      throw new ApiError(400, "Role tidak valid", "INVALID_INPUT");
    }

    if (identity.role === "admin") {
      if (roleParam) {
        const role = roleParam as AppRole;
        return NextResponse.json(
          (await storage.getUsersByRole(role)).map(toPublicUser),
        );
      }
      const [students, instructors] = await Promise.all([
        storage.getUsersByRole("mahasiswa"),
        storage.getUsersByRole("instruktur"),
      ]);
      return NextResponse.json([...students, ...instructors].map(toPublicUser));
    }

    if (identity.role === "instruktur" && roleParam === "mahasiswa") {
      return NextResponse.json(
        (await storage.getUsersByRole("mahasiswa")).map(toStudentDirectoryEntry),
      );
    }

    if (identity.role === "mahasiswa" && roleParam === "instruktur") {
      return NextResponse.json(
        (await storage.getUsersByRole("instruktur")).map(toInstructorDirectoryEntry),
      );
    }

    const user = await storage.getUser(identity.id);
    return NextResponse.json(user ? [toPublicUser(user)] : []);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const identity = requireRole(getIdentity(await auth()), "admin");
    const input = await parseJson(request, userCreateSchema);
    if (input.role === "mahasiswa" && !input.nim) {
      throw new ApiError(400, "NIM wajib diisi", "INVALID_INPUT");
    }

    const user = await storage.createUser({
      ...input,
      password: await hashPassword(input.password),
    });
    await storage.createAuditEvent({
      actorId: identity.id,
      action: "user.created",
      entityType: "user",
      entityId: user.id,
      details: { role: user.role },
    });
    return NextResponse.json(toPublicUser(user), { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
