import { describe, expect, it } from "vitest";
import {
  toInstructorDirectoryEntry,
  toPublicUser,
  toStudentDirectoryEntry,
} from "@/lib/api/dto";

const user = {
  id: "student-1",
  username: "2024101001",
  password: "scrypt$secret",
  role: "mahasiswa" as const,
  name: "Mahasiswa Test",
  nim: "2024101001",
  faculty: "Teknik",
  program: "Informatika",
  email: "private@example.com",
  phone: "08123456789",
  specialization: null,
  createdAt: new Date("2026-07-13T00:00:00.000Z"),
  updatedAt: new Date("2026-07-13T00:00:00.000Z"),
};

describe("API user DTOs", () => {
  it("never exposes password hashes", () => {
    expect(toPublicUser(user)).not.toHaveProperty("password");
    expect(toPublicUser(user)).toMatchObject({
      id: "student-1",
      email: "private@example.com",
      phone: "08123456789",
    });
  });

  it("exposes only minimal fields in the instructor student directory", () => {
    expect(toStudentDirectoryEntry(user)).toEqual({
      id: "student-1",
      name: "Mahasiswa Test",
      nim: "2024101001",
      faculty: "Teknik",
      program: "Informatika",
    });
  });

  it("exposes only public staff fields to students", () => {
    expect(
      toInstructorDirectoryEntry({
        ...user,
        id: "instructor-1",
        role: "instruktur",
        name: "Ustadz Test",
        specialization: "Tahsin",
      }),
    ).toEqual({
      id: "instructor-1",
      name: "Ustadz Test",
      specialization: "Tahsin",
    });
  });
});
