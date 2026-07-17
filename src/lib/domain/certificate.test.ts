import { describe, expect, it } from "vitest";
import {
  assertCertificateEligible,
  generateCertificateNumber,
} from "@/lib/domain/certificate";

describe("certificate issuance", () => {
  it("requires a passing assessment and a paid certificate invoice", () => {
    expect(() =>
      assertCertificateEligible({
        assessment: null,
        payments: [],
      }),
    ).toThrow("Student has not passed");

    expect(() =>
      assertCertificateEligible({
        assessment: { passed: true },
        payments: [{ status: "menunggu_verifikasi", billingKey: "certificate" }],
      }),
    ).toThrow("Payment not completed");

    expect(() =>
      assertCertificateEligible({
        assessment: { passed: true },
        payments: [{ status: "lunas", billingKey: "certificate" }],
      }),
    ).not.toThrow();
  });

  it("generates a cryptographically sourced, year-scoped certificate number", () => {
    expect(
      generateCertificateNumber(
        new Date("2026-07-13T00:00:00.000Z"),
        () => Buffer.from("0123456789abcdef", "hex"),
      ),
    ).toBe("TJW-2026-0123456789ABCDEF");
  });
});
