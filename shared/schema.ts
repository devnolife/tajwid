import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, decimal, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const roleEnum = pgEnum("role", ["mahasiswa", "instruktur", "admin"]);
export const paymentStatusEnum = pgEnum("payment_status", ["belum_bayar", "menunggu_verifikasi", "lunas", "ditolak"]);
export const testStatusEnum = pgEnum("test_status", ["belum_tes", "sudah_tes", "lulus", "tidak_lulus"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: roleEnum("role").notNull().default("mahasiswa"),
  name: text("name").notNull(),
  nim: text("nim"),
  faculty: text("faculty"),
  program: text("program"),
  email: text("email"),
  phone: text("phone"),
  specialization: text("specialization"),
});

export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  dueDate: timestamp("due_date").notNull(),
  description: text("description"),
  status: paymentStatusEnum("status").notNull().default("belum_bayar"),
  proofUrl: text("proof_url"),
  paidAt: timestamp("paid_at"),
});

export const schedules = pgTable("schedules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => users.id),
  instructorId: varchar("instructor_id").notNull().references(() => users.id),
  date: timestamp("date").notNull(),
  room: text("room").notNull(),
  location: text("location"),
});

export const assessments = pgTable("assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => users.id),
  instructorId: varchar("instructor_id").notNull().references(() => users.id),
  tajwid: integer("tajwid").notNull().default(0),
  kelancaran: integer("kelancaran").notNull().default(0),
  makhorijulHuruf: integer("makhorijul_huruf").notNull().default(0),
  adab: integer("adab").notNull().default(0),
  totalScore: integer("total_score").notNull().default(0),
  passed: boolean("passed").notNull().default(false),
  notes: text("notes"),
  assessedAt: timestamp("assessed_at").defaultNow(),
});

export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  appName: text("app_name").notNull().default("TajwidKu"),
  academicYear: text("academic_year").notNull().default("2025/2026"),
  passingScore: integer("passing_score").notNull().default(70),
  paymentAmount: decimal("payment_amount", { precision: 12, scale: 2 }).notNull().default("150000"),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true });
export const insertScheduleSchema = createInsertSchema(schedules).omit({ id: true });
export const insertAssessmentSchema = createInsertSchema(assessments).omit({ id: true });
export const insertSettingsSchema = createInsertSchema(settings).omit({ id: true });

export const loginSchema = z.object({
  username: z.string().min(1, "Username wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
  role: z.enum(["mahasiswa", "instruktur", "admin"]).optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;
export type Schedule = typeof schedules.$inferSelect;
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type Assessment = typeof assessments.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;
export type LoginData = z.infer<typeof loginSchema>;
