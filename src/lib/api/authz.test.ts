import { describe, expect, it } from "vitest";
import {
  ApiError,
  assertInstructorScope,
  assertStudentScope,
  getIdentity,
  requireRole,
  resolveAssignedResourceScope,
  resolveStudentResourceScope,
} from "@/lib/api/authz";

describe("API authorization policy", () => {
  const admin = { id: "admin-1", role: "admin" as const };
  const instructor = { id: "instructor-1", role: "instruktur" as const };
  const student = { id: "student-1", role: "mahasiswa" as const };

  it("rejects missing or malformed sessions", () => {
    expect(() => getIdentity(null)).toThrow(ApiError);
    expect(() =>
      getIdentity({ user: { id: "student-1", role: "superuser" } }),
    ).toThrow("Not authenticated");
  });

  it("enforces role requirements", () => {
    expect(requireRole(admin, "admin")).toBe(admin);
    expect(() => requireRole(student, "admin")).toThrow("Forbidden");
  });

  it("limits student-owned resources to the student or an admin", () => {
    expect(() => assertStudentScope(student, "student-1")).not.toThrow();
    expect(() => assertStudentScope(admin, "student-2")).not.toThrow();
    expect(() => assertStudentScope(student, "student-2")).toThrow("Forbidden");
    expect(() => assertStudentScope(instructor, "student-1")).toThrow("Forbidden");
  });

  it("limits instructor-owned resources to the instructor or an admin", () => {
    expect(() => assertInstructorScope(instructor, "instructor-1")).not.toThrow();
    expect(() => assertInstructorScope(admin, "instructor-2")).not.toThrow();
    expect(() => assertInstructorScope(instructor, "instructor-2")).toThrow("Forbidden");
    expect(() => assertInstructorScope(student, "instructor-1")).toThrow("Forbidden");
  });

  it("scopes student-only resources to their owner while preserving admin filters", () => {
    expect(resolveStudentResourceScope(student, null)).toEqual({
      studentId: "student-1",
    });
    expect(resolveStudentResourceScope(admin, "student-2")).toEqual({
      studentId: "student-2",
    });
    expect(resolveStudentResourceScope(admin, null)).toEqual({ all: true });
    expect(() => resolveStudentResourceScope(student, "student-2")).toThrow(
      "Forbidden",
    );
    expect(() => resolveStudentResourceScope(instructor, null)).toThrow(
      "Forbidden",
    );
  });

  it("scopes assigned resources to the current student or instructor", () => {
    expect(resolveAssignedResourceScope(student, null, null)).toEqual({
      studentId: "student-1",
    });
    expect(resolveAssignedResourceScope(instructor, "student-2", null)).toEqual({
      studentId: "student-2",
      instructorId: "instructor-1",
    });
    expect(resolveAssignedResourceScope(admin, null, "instructor-2")).toEqual({
      instructorId: "instructor-2",
    });
    expect(() =>
      resolveAssignedResourceScope(instructor, null, "instructor-2"),
    ).toThrow("Forbidden");
    expect(() =>
      resolveAssignedResourceScope(student, "student-2", null),
    ).toThrow("Forbidden");
  });
});
