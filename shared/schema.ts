import { sql } from "drizzle-orm";
import {
  boolean,
  decimal,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const roleEnum = pgEnum("role", ["mahasiswa", "instruktur", "admin"]);
export const paymentStatusEnum = pgEnum("payment_status", ["belum_bayar", "menunggu_verifikasi", "lunas", "ditolak"]);
export const testStatusEnum = pgEnum("test_status", ["belum_tes", "sudah_tes", "lulus", "tidak_lulus"]);
export const notificationTypeEnum = pgEnum("notification_type", ["info", "payment", "schedule", "result", "certificate", "system"]);
export const scheduleStatusEnum = pgEnum("schedule_status", ["scheduled", "completed", "no_show", "cancelled"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: roleEnum("role").notNull().default("mahasiswa"),
  name: text("name").notNull(),
  nim: text("nim").unique(),
  faculty: text("faculty"),
  program: text("program"),
  email: text("email"),
  phone: text("phone"),
  specialization: text("specialization"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const payments = pgTable(
  "payments",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    studentId: varchar("student_id").notNull().references(() => users.id),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    dueDate: timestamp("due_date").notNull(),
    description: text("description"),
    academicYear: text("academic_year").notNull().default("2025/2026"),
    billingKey: text("billing_key").notNull().default("certificate"),
    status: paymentStatusEnum("status").notNull().default("belum_bayar"),
    proofUrl: text("proof_url"),
    paidAt: timestamp("paid_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    studentBillingUnique: uniqueIndex("payments_student_billing_unique").on(
      table.studentId,
      table.academicYear,
      table.billingKey,
    ),
    studentStatusIndex: index("payments_student_status_idx").on(
      table.studentId,
      table.status,
    ),
  }),
);

export const schedules = pgTable(
  "schedules",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    studentId: varchar("student_id").notNull().references(() => users.id),
    instructorId: varchar("instructor_id").notNull().references(() => users.id),
    date: timestamp("date").notNull(),
    room: text("room").notNull(),
    location: text("location"),
    status: scheduleStatusEnum("status").notNull().default("scheduled"),
    isRepeat: boolean("is_repeat").notNull().default(false),
    parentScheduleId: varchar("parent_schedule_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    parentScheduleFk: foreignKey({
      columns: [table.parentScheduleId],
      foreignColumns: [table.id],
      name: "schedules_parent_schedule_fk",
    }).onDelete("set null"),
    instructorDateIndex: index("schedules_instructor_date_idx").on(
      table.instructorId,
      table.date,
    ),
    studentDateIndex: index("schedules_student_date_idx").on(
      table.studentId,
      table.date,
    ),
  }),
);

export const assessments = pgTable(
  "assessments",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    studentId: varchar("student_id").notNull().references(() => users.id),
    instructorId: varchar("instructor_id").notNull().references(() => users.id),
    scheduleId: varchar("schedule_id").references(() => schedules.id),
    tajwid: integer("tajwid").notNull().default(0),
    kelancaran: integer("kelancaran").notNull().default(0),
    makhorijulHuruf: integer("makhorijul_huruf").notNull().default(0),
    adab: integer("adab").notNull().default(0),
    totalScore: integer("total_score").notNull().default(0),
    passingScore: integer("passing_score").notNull().default(70),
    passed: boolean("passed").notNull().default(false),
    outcomeOverridden: boolean("outcome_overridden").notNull().default(false),
    overrideReason: text("override_reason"),
    notes: text("notes"),
    assessedAt: timestamp("assessed_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    scheduleUnique: uniqueIndex("assessments_schedule_unique").on(table.scheduleId),
    studentAssessedIndex: index("assessments_student_assessed_idx").on(
      table.studentId,
      table.assessedAt,
    ),
    instructorAssessedIndex: index("assessments_instructor_assessed_idx").on(
      table.instructorId,
      table.assessedAt,
    ),
  }),
);

export const certificates = pgTable("certificates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  certificateNumber: text("certificate_number").notNull().unique(),
  studentId: varchar("student_id").notNull().unique().references(() => users.id),
  assessmentId: varchar("assessment_id").notNull().references(() => assessments.id),
  studentName: text("student_name").notNull(),
  studentNim: text("student_nim"),
  studentFaculty: text("student_faculty"),
  studentProgram: text("student_program"),
  totalScore: integer("total_score").notNull(),
  academicYear: text("academic_year").notNull().default("2025/2026"),
  signerName: text("signer_name").notNull().default("Dr. Alamsyah, S.Pd.I., M.H."),
  signerTitle: text("signer_title").notNull().default("Wakil Dekan IV"),
  issuedAt: timestamp("issued_at").defaultNow(),
});

export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  appName: text("app_name").notNull().default("TajwidKu"),
  academicYear: text("academic_year").notNull().default("2025/2026"),
  passingScore: integer("passing_score").notNull().default(70),
  paymentAmount: decimal("payment_amount", { precision: 12, scale: 2 }).notNull().default("25000"),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull().default("info"),
  title: text("title").notNull(),
  message: text("message").notNull(),
  link: text("link"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditEvents = pgTable(
  "audit_events",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    actorId: varchar("actor_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: varchar("entity_id"),
    details: jsonb("details").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    entityIndex: index("audit_events_entity_idx").on(
      table.entityType,
      table.entityId,
    ),
    actorCreatedIndex: index("audit_events_actor_created_idx").on(
      table.actorId,
      table.createdAt,
    ),
  }),
);

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true });
export const insertScheduleSchema = createInsertSchema(schedules).omit({ id: true });
export const insertAssessmentSchema = createInsertSchema(assessments).omit({ id: true });
export const insertCertificateSchema = createInsertSchema(certificates).omit({ id: true });
export const insertSettingsSchema = createInsertSchema(settings).omit({ id: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export const insertAuditEventSchema = createInsertSchema(auditEvents).omit({ id: true, createdAt: true });

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
export type InsertCertificate = z.infer<typeof insertCertificateSchema>;
export type Certificate = typeof certificates.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertAuditEvent = z.infer<typeof insertAuditEventSchema>;
export type AuditEvent = typeof auditEvents.$inferSelect;
export type LoginData = z.infer<typeof loginSchema>;
