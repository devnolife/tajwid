import { z } from "zod";

const uuid = z.string().uuid();
const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();
const score = z.number().int().min(0).max(100);

export const userCreateSchema = z
  .object({
    username: z.string().trim().min(3).max(100),
    password: z.string().min(8).max(128),
    role: z.enum(["mahasiswa", "instruktur"]),
    name: z.string().trim().min(1).max(200),
    nim: optionalText(50),
    faculty: optionalText(200),
    program: optionalText(200),
    email: z.string().email().max(320).nullable().optional(),
    phone: optionalText(30),
    specialization: optionalText(200),
  })
  .strict();

export const userUpdateSchema = userCreateSchema
  .omit({ username: true, password: true, role: true })
  .partial()
  .strict();

export const paymentCreateSchema = z
  .object({
    studentId: uuid,
    amount: z.string().regex(/^\d{1,10}(?:\.\d{1,2})?$/),
    dueDate: z.string().datetime(),
    description: optionalText(500),
  })
  .strict();

export const paymentActionSchema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("submit_proof"),
      proofUrl: z.string().regex(/^\/api\/payments\/[0-9a-f-]{36}\/proof$/i),
    })
    .strict(),
  z.object({ action: z.literal("approve") }).strict(),
  z.object({ action: z.literal("reject") }).strict(),
  z.object({ action: z.literal("confirm_cash") }).strict(),
]);

export const scheduleCreateSchema = z
  .object({
    studentId: uuid,
    instructorId: uuid,
    date: z.string().datetime(),
    room: z.string().trim().min(1).max(200),
    location: optionalText(300),
  })
  .strict();

export const scheduleUpdateSchema = z
  .object({
    date: z.string().datetime().optional(),
    room: z.string().trim().min(1).max(200).optional(),
    location: optionalText(300),
    status: z.enum(["scheduled", "completed", "no_show", "cancelled"]).optional(),
    rescheduleAt: z.string().datetime().optional(),
    rescheduleRoom: z.string().trim().min(1).max(200).optional(),
  })
  .strict();

export const assessmentCreateSchema = z
  .object({
    scheduleId: uuid,
    tajwid: score,
    kelancaran: score,
    makhorijulHuruf: score,
    adab: score,
    requestedOutcome: z.enum(["lulus", "perlu_mengulang"]).optional(),
    overrideReason: optionalText(500),
    notes: optionalText(2_000),
    repeatScheduleAt: z.string().datetime().optional(),
    repeatRoom: z.string().trim().min(1).max(200).optional(),
  })
  .strict();

export const assessmentUpdateSchema = assessmentCreateSchema
  .omit({ scheduleId: true, repeatScheduleAt: true, repeatRoom: true })
  .partial()
  .strict();

export const settingsUpdateSchema = z
  .object({
    appName: z.string().trim().min(1).max(100).optional(),
    academicYear: z.string().trim().regex(/^\d{4}\/\d{4}$/).optional(),
    passingScore: z.number().int().min(0).max(100).optional(),
    paymentAmount: z.string().regex(/^\d{1,10}(?:\.\d{1,2})?$/).optional(),
  })
  .strict();

export const notificationCreateSchema = z
  .object({
    userId: uuid,
    type: z.enum(["info", "payment", "schedule", "result", "certificate", "system"]),
    title: z.string().trim().min(1).max(200),
    message: z.string().trim().min(1).max(2_000),
    link: optionalText(500),
  })
  .strict();

export const certificateBackfillSchema = z
  .object({
    studentId: uuid,
  })
  .strict();
