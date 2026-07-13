import { describe, expect, it } from "vitest";
import {
  assessmentCreateSchema,
  paymentActionSchema,
  scheduleCreateSchema,
  userCreateSchema,
} from "@/lib/api/schemas";

describe("API input schemas", () => {
  it("does not allow the user API to create an administrator", () => {
    expect(
      userCreateSchema.safeParse({
        username: "attacker",
        password: "password123",
        role: "admin",
        name: "Attacker",
      }).success,
    ).toBe(false);
  });

  it("accepts payment actions but rejects client-owned payment state", () => {
    expect(paymentActionSchema.safeParse({ action: "approve" }).success).toBe(true);
    expect(
      paymentActionSchema.safeParse({
        action: "approve",
        status: "lunas",
        paidAt: new Date().toISOString(),
      }).success,
    ).toBe(false);
  });

  it("accepts assessment inputs without trusting derived identity or results", () => {
    const valid = {
      scheduleId: "b3919af3-f943-4cfa-856d-d53fdfdf7a8e",
      tajwid: 80,
      kelancaran: 75,
      makhorijulHuruf: 70,
      adab: 85,
      requestedOutcome: "lulus",
      notes: "Bacaan baik",
    };

    expect(assessmentCreateSchema.safeParse(valid).success).toBe(true);
    expect(
      assessmentCreateSchema.safeParse({
        ...valid,
        instructorId: "forged",
        totalScore: 100,
        passed: true,
      }).success,
    ).toBe(false);
  });

  it("allows schedule creation fields but rejects client-owned status", () => {
    expect(
      scheduleCreateSchema.safeParse({
        studentId: "b3919af3-f943-4cfa-856d-d53fdfdf7a8e",
        instructorId: "72bff73d-959f-4376-98cf-e10561a6eb85",
        date: "2026-07-20T09:00:00.000Z",
        room: "Ruang A",
      }).success,
    ).toBe(true);
    expect(
      scheduleCreateSchema.safeParse({
        studentId: "b3919af3-f943-4cfa-856d-d53fdfdf7a8e",
        instructorId: "72bff73d-959f-4376-98cf-e10561a6eb85",
        date: "2026-07-20T09:00:00.000Z",
        room: "Ruang A",
        status: "completed",
      }).success,
    ).toBe(false);
  });
});
