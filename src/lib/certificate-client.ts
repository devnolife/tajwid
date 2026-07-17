interface AssessmentCandidate {
  id: string;
  studentId: string;
  passed: boolean;
}

interface PaymentCandidate {
  studentId: string;
  status: string;
}

interface CertificateCandidate {
  studentId: string;
}

type Fetcher = typeof fetch;

export function getCertificateBackfillCandidates<T extends AssessmentCandidate>(
  assessments: T[],
  payments: PaymentCandidate[],
  certificates: CertificateCandidate[],
): T[] {
  const paidStudents = new Set(
    payments
      .filter((payment) => payment.status === "lunas")
      .map((payment) => payment.studentId),
  );
  const issuedStudents = new Set(
    certificates.map((certificate) => certificate.studentId),
  );
  const seenStudents = new Set<string>();

  return assessments.filter((assessment) => {
    if (seenStudents.has(assessment.studentId)) return false;
    seenStudents.add(assessment.studentId);
    return (
      assessment.passed &&
      paidStudents.has(assessment.studentId) &&
      !issuedStudents.has(assessment.studentId)
    );
  });
}

export async function backfillCertificate<T>(
  studentId: string,
  fetcher: Fetcher = fetch,
): Promise<T> {
  const response = await fetcher("/api/certificates", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ studentId }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof data?.message === "string" ? data.message : "Backfill gagal",
    );
  }
  return data as T;
}
