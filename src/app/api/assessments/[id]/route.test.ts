import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  updateAssessmentWorkflow: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/services/assessment-service", () => ({
  updateAssessmentWorkflow: mocks.updateAssessmentWorkflow,
}));
vi.mock("@/lib/services/assessment-db", () => ({
  assessmentWorkflowDependencies: { transaction: vi.fn() },
}));
vi.mock("@/lib/db/storage", () => ({ storage: {} }));
vi.mock("@/lib/notify", () => ({ notify: vi.fn(), notifyTemplates: {} }));

import { PATCH } from "@/app/api/assessments/[id]/route";

function params() {
  return { params: Promise.resolve({ id: "assessment-1" }) };
}

function request(body: unknown) {
  return new Request("http://localhost/api/assessments/assessment-1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("assessment correction API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.updateAssessmentWorkflow.mockResolvedValue({
      id: "assessment-1",
      totalScore: 80,
      passed: true,
    });
  });

  it("passes strict corrections and session identity to the workflow", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "instructor-1", role: "instruktur" },
    });
    const correction = {
      tajwid: 80,
      kelancaran: 80,
      makhorijulHuruf: 80,
      adab: 80,
      notes: "Koreksi hasil",
    };

    const response = await PATCH(request(correction), params());
    expect(response.status).toBe(200);
    expect(mocks.updateAssessmentWorkflow).toHaveBeenCalledWith(
      { id: "instructor-1", role: "instruktur" },
      "assessment-1",
      correction,
      expect.any(Object),
    );

    const forged = await PATCH(
      request({ ...correction, studentId: "student-2", passed: true }),
      params(),
    );
    expect(forged.status).toBe(400);
    expect(mocks.updateAssessmentWorkflow).toHaveBeenCalledTimes(1);
  });

  it("rejects corrections from students", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "student-1", role: "mahasiswa" },
    });

    expect((await PATCH(request({ notes: "Forged" }), params())).status).toBe(
      403,
    );
    expect(mocks.updateAssessmentWorkflow).not.toHaveBeenCalled();
  });
});
