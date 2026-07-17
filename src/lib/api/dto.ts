import type { User } from "@shared/schema";

export type PublicUser = Omit<User, "password">;

export interface StudentDirectoryEntry {
  id: string;
  name: string;
  nim: string | null;
  faculty: string | null;
  program: string | null;
}

export interface InstructorDirectoryEntry {
  id: string;
  name: string;
  specialization: string | null;
}

export function toPublicUser(user: User): PublicUser {
  const { password, ...publicUser } = user;
  void password;
  return publicUser;
}

export function toStudentDirectoryEntry(user: User): StudentDirectoryEntry {
  return {
    id: user.id,
    name: user.name,
    nim: user.nim,
    faculty: user.faculty,
    program: user.program,
  };
}

export function toInstructorDirectoryEntry(user: User): InstructorDirectoryEntry {
  return {
    id: user.id,
    name: user.name,
    specialization: user.specialization,
  };
}
