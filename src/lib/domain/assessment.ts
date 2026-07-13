export interface AssessmentScores {
  tajwid: number;
  kelancaran: number;
  makhorijulHuruf: number;
  adab: number;
}

export type AssessmentOutcome = "lulus" | "perlu_mengulang";

interface CalculateAssessmentInput {
  scores: AssessmentScores;
  passingScore: number;
  requestedOutcome?: AssessmentOutcome;
  overrideReason?: string | null;
}

export interface AssessmentResult {
  totalScore: number;
  passed: boolean;
  overrideReason: string | null;
}

function assertScore(value: number): void {
  if (!Number.isInteger(value) || value < 0 || value > 100) {
    throw new Error("Skor harus berupa bilangan bulat antara 0 dan 100");
  }
}

export function calculateAssessmentResult({
  scores,
  passingScore,
  requestedOutcome,
  overrideReason,
}: CalculateAssessmentInput): AssessmentResult {
  Object.values(scores).forEach(assertScore);
  assertScore(passingScore);

  const totalScore = Math.round(
    (scores.tajwid +
      scores.kelancaran +
      scores.makhorijulHuruf +
      scores.adab) /
    4,
  );
  const automaticPassed = totalScore >= passingScore;
  const requestedPassed = requestedOutcome
    ? requestedOutcome === "lulus"
    : automaticPassed;
  const normalizedReason = overrideReason?.trim() || null;

  if (
    requestedPassed !== automaticPassed &&
    (!normalizedReason || normalizedReason.length < 10)
  ) {
    throw new Error("Alasan override wajib diisi minimal 10 karakter");
  }

  return {
    totalScore,
    passed: requestedPassed,
    overrideReason:
      requestedPassed === automaticPassed ? null : normalizedReason,
  };
}
