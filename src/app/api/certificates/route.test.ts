import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getCertificateByStudent: vi.fn(),
  issueCertificateForStudent: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db/storage", () => ({
  storage: { getCertificateByStudent: mocks.getCertificateByStudent },
}));
vi.mock("@/lib/services/certificate-service", () => ({
  issueCertificateForStudent: mocks.issueCertificateForStudent,
}));

import { GET, POST } from "@/app/api/certificates/route";

function session(id: string, role: "mahasiswa" | "instruktur" | "admin") {
  return { user: { id, role } };
}

function post(body: unknown) {
  return POST(
    new Request("http://localhost/api/certificates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

describe("certificate API authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCertificateByStudent.mockResolvedValue(null);
    mocks.issueCertificateForStudent.mockResolvedValue({
      id: "certificate-1",
      studentId: "b3919af3-f943-4cfa-856d-d53fdfdf7a8e",
    });
  });

  it("lets a student read only their own certificate", async () => {
    const studentId = "b3919af3-f943-4cfa-856d-d53fdfdf7a8e";
    mocks.auth.mockResolvedValue(session(studentId, "mahasiswa"));

    expect(
      (await GET(new Request("http://localhost/api/certificates"))).status,
    ).toBe(200);
    expect(mocks.getCertificateByStudent).toHaveBeenCalledWith(studentId);

    const cross = await GET(
      new Request(
        "http://localhost/api/certificates?studentId=72bff73d-959f-4376-98cf-e10561a6eb85",
      ),
    );
    expect(cross.status).toBe(403);
  });

  it("does not expose certificates to instructors", async () => {
    mocks.auth.mockResolvedValue(session("instructor-1", "instruktur"));

    expect(
      (await GET(new Request("http://localhost/api/certificates"))).status,
    ).toBe(403);
  });

  it("reserves manual issuance for admin backfill", async () => {
    const studentId = "b3919af3-f943-4cfa-856d-d53fdfdf7a8e";
    mocks.auth.mockResolvedValue(session(studentId, "mahasiswa"));
    expect((await post({ studentId })).status).toBe(403);

    mocks.auth.mockResolvedValue(session("admin-1", "admin"));
    const response = await post({ studentId });
    expect(response.status).toBe(201);
    expect(mocks.issueCertificateForStudent).toHaveBeenCalledWith(
      studentId,
      "admin-1",
    );

    const injected = await post({ studentId, totalScore: 100 });
    expect(injected.status).toBe(400);
  });
});
