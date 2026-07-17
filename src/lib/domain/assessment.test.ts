import { describe, expect, it } from "vitest";
import { calculateAssessmentResult } from "@/lib/domain/assessment";

describe("assessment result", () => {
  it("calculates the total and passing result from server-owned settings", () => {
    expect(
      calculateAssessmentResult({
        scores: {
          tajwid: 80,
          kelancaran: 70,
          makhorijulHuruf: 60,
          adab: 90,
        },
        passingScore: 76,
      }),
    ).toEqual({
      totalScore: 75,
      passed: false,
      overrideReason: null,
    });
  });

  it("allows a conflicting instructor outcome only with an audit reason", () => {
    expect(() =>
      calculateAssessmentResult({
        scores: {
          tajwid: 80,
          kelancaran: 80,
          makhorijulHuruf: 80,
          adab: 80,
        },
        passingScore: 70,
        requestedOutcome: "perlu_mengulang",
      }),
    ).toThrow("Alasan override wajib diisi");

    expect(
      calculateAssessmentResult({
        scores: {
          tajwid: 80,
          kelancaran: 80,
          makhorijulHuruf: 80,
          adab: 80,
        },
        passingScore: 70,
        requestedOutcome: "perlu_mengulang",
        overrideReason: "Makharij perlu diuji kembali pada sesi berikutnya.",
      }),
    ).toEqual({
      totalScore: 80,
      passed: false,
      overrideReason: "Makharij perlu diuji kembali pada sesi berikutnya.",
    });
  });

  it("rejects scores outside the supported integer range", () => {
    expect(() =>
      calculateAssessmentResult({
        scores: {
          tajwid: 101,
          kelancaran: 70,
          makhorijulHuruf: 70,
          adab: 70,
        },
        passingScore: 70,
      }),
    ).toThrow("Skor harus berupa bilangan bulat antara 0 dan 100");
  });
});
