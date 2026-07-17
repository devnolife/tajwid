import { describe, expect, it, vi } from "vitest";
import {
  backfillCertificate,
  getCertificateBackfillCandidates,
} from "@/lib/certificate-client";

describe("certificate admin client", () => {
  it("selects one latest passing, paid, and unissued candidate per student", () => {
    const assessments = [
      { id: "latest-1", studentId: "student-1", passed: true },
      { id: "old-1", studentId: "student-1", passed: true },
      { id: "latest-2", studentId: "student-2", passed: true },
      { id: "latest-3", studentId: "student-3", passed: true },
    ];
    const payments = [
      { studentId: "student-1", status: "lunas" },
      { studentId: "student-2", status: "menunggu_verifikasi" },
      { studentId: "student-3", status: "lunas" },
    ];
    const certificates = [{ studentId: "student-3" }];

    expect(
      getCertificateBackfillCandidates(
        assessments,
        payments,
        certificates,
      ).map((assessment) => assessment.id),
    ).toEqual(["latest-1"]);
  });

  it("calls the admin backfill endpoint with only the student identifier", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "certificate-1" }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await backfillCertificate("student-1", fetcher);

    expect(fetcher).toHaveBeenCalledWith("/api/certificates", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: "student-1" }),
    });
  });
});
