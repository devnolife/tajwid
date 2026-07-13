export type AppRole = "mahasiswa" | "instruktur" | "admin";

export interface Identity {
  id: string;
  role: AppRole;
}

interface SessionLike {
  user?: {
    id?: unknown;
    role?: unknown;
  } | null;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function isAppRole(value: unknown): value is AppRole {
  return value === "mahasiswa" || value === "instruktur" || value === "admin";
}

export function getIdentity(session: SessionLike | null): Identity {
  const id = session?.user?.id;
  const role = session?.user?.role;
  if (typeof id !== "string" || id.length === 0 || !isAppRole(role)) {
    throw new ApiError(401, "Not authenticated", "UNAUTHENTICATED");
  }

  return { id, role };
}

export function requireRole(
  identity: Identity,
  ...allowedRoles: AppRole[]
): Identity {
  if (!allowedRoles.includes(identity.role)) {
    throw new ApiError(403, "Forbidden", "FORBIDDEN");
  }
  return identity;
}

export function assertStudentScope(
  identity: Identity,
  studentId: string,
): void {
  if (identity.role === "admin") {
    return;
  }
  if (identity.role !== "mahasiswa" || identity.id !== studentId) {
    throw new ApiError(403, "Forbidden", "FORBIDDEN");
  }
}

export function assertInstructorScope(
  identity: Identity,
  instructorId: string,
): void {
  if (identity.role === "admin") {
    return;
  }
  if (identity.role !== "instruktur" || identity.id !== instructorId) {
    throw new ApiError(403, "Forbidden", "FORBIDDEN");
  }
}
