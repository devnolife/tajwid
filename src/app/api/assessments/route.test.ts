import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getAllAssessments: vi.fn(),
  getAssessmentsByStudent: vi.fn(),
  getAssessmentsByInstructor: vi.fn(),
  getAssessmentsByInstructorAndStudent: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db/storage", () => ({
  storage: {
    getAllAssessments: mocks.getAllAssessments,
    getAssessmentsByStudent: mocks.getAssessmentsByStudent,
    getAssessmentsByInstructor: mocks.getAssessmentsByInstructor,
    getAssessmentsByInstructorAndStudent:
      mocks.getAssessmentsByInstructorAndStudent,
  },
}));
vi.mock("@/lib/notify", () => ({
  notify: vi.fn(),
  notifyTemplates: {},
}));

import { GET } from "@/app/api/assessments/route";

function session(id: string, role: "mahasiswa" | "instruktur" | "admin") {
  return { user: { id, role } };
}

describe("assessment collection authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAllAssessments.mockResolvedValue([]);
    mocks.getAssessmentsByStudent.mockResolvedValue([]);
    mocks.getAssessmentsByInstructor.mockResolvedValue([]);
    mocks.getAssessmentsByInstructorAndStudent.mockResolvedValue([]);
  });

  it("does not let a student read another student's assessment", async () => {
    mocks.auth.mockResolvedValue(session("student-1", "mahasiswa"));

    expect(
      (await GET(new Request("http://localhost/api/assessments"))).status,
    ).toBe(200);
    expect(mocks.getAssessmentsByStudent).toHaveBeenCalledWith("student-1");

    const response = await GET(
      new Request("http://localhost/api/assessments?studentId=student-2"),
    );
    expect(response.status).toBe(403);
  });

  it("limits an instructor to assessments they authored", async () => {
    mocks.auth.mockResolvedValue(session("instructor-1", "instruktur"));

    expect(
      (await GET(new Request("http://localhost/api/assessments"))).status,
    ).toBe(200);
    expect(mocks.getAssessmentsByInstructor).toHaveBeenCalledWith(
      "instructor-1",
    );

    const filtered = await GET(
      new Request("http://localhost/api/assessments?studentId=student-2"),
    );
    expect(filtered.status).toBe(200);
    expect(mocks.getAssessmentsByInstructorAndStudent).toHaveBeenCalledWith(
      "instructor-1",
      "student-2",
    );

    const crossResponse = await GET(
      new Request(
        "http://localhost/api/assessments?instructorId=instructor-2",
      ),
    );
    expect(crossResponse.status).toBe(403);
  });

  it("allows an administrator to list all assessments", async () => {
    mocks.auth.mockResolvedValue(session("admin-1", "admin"));

    const response = await GET(
      new Request("http://localhost/api/assessments"),
    );
    expect(response.status).toBe(200);
    expect(mocks.getAllAssessments).toHaveBeenCalledOnce();
  });
});
