import {
  type User, type InsertUser,
  type Payment, type InsertPayment,
  type Schedule, type InsertSchedule,
  type Assessment, type InsertAssessment,
  type Settings, type InsertSettings,
  type Certificate, type InsertCertificate,
  type Notification, type InsertNotification,
  type AuditEvent, type InsertAuditEvent,
  users, payments, schedules, assessments, settings, certificates, notifications, auditEvents,
} from "@shared/schema";
import { db } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByNim(nim: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;
  getUsersByRole(role: User["role"]): Promise<User[]>;

  getPayment(id: string): Promise<Payment | undefined>;
  getPaymentsByStudent(studentId: string): Promise<Payment[]>;
  getAllPayments(): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: string, data: Partial<InsertPayment>): Promise<Payment | undefined>;

  getSchedule(id: string): Promise<Schedule | undefined>;
  getSchedulesByStudent(studentId: string): Promise<Schedule[]>;
  getSchedulesByInstructor(instructorId: string): Promise<Schedule[]>;
  getSchedulesByInstructorAndStudent(instructorId: string, studentId: string): Promise<Schedule[]>;
  getAllSchedules(): Promise<Schedule[]>;
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  updateSchedule(id: string, data: Partial<InsertSchedule>): Promise<Schedule | undefined>;
  deleteSchedule(id: string): Promise<void>;

  getAssessment(id: string): Promise<Assessment | undefined>;
  getAssessmentByStudent(studentId: string): Promise<Assessment | undefined>;
  getAssessmentsByStudent(studentId: string): Promise<Assessment[]>;
  getAssessmentsByInstructor(instructorId: string): Promise<Assessment[]>;
  getAssessmentsByInstructorAndStudent(instructorId: string, studentId: string): Promise<Assessment[]>;
  getAllAssessments(): Promise<Assessment[]>;
  createAssessment(assessment: InsertAssessment): Promise<Assessment>;
  updateAssessment(id: string, data: Partial<InsertAssessment>): Promise<Assessment | undefined>;

  getSettings(): Promise<Settings | undefined>;
  updateSettings(data: Partial<InsertSettings>): Promise<Settings | undefined>;

  getCertificateByNumber(certificateNumber: string): Promise<Certificate | undefined>;
  getCertificateByStudent(studentId: string): Promise<Certificate | undefined>;
  getAllCertificates(): Promise<Certificate[]>;
  createCertificate(certificate: InsertCertificate): Promise<Certificate>;

  getNotificationsByUser(userId: string, limit?: number): Promise<Notification[]>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string, userId: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;
  deleteNotification(id: string, userId: string): Promise<void>;

  createAuditEvent(event: InsertAuditEvent): Promise<AuditEvent>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByNim(nim: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.nim, nim));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await db.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, id)).returning();
    return updated;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getUsersByRole(role: User["role"]): Promise<User[]> {
    return db.select().from(users).where(eq(users.role, role)).orderBy(users.name);
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment;
  }

  async getPaymentsByStudent(studentId: string): Promise<Payment[]> {
    return db.select().from(payments).where(eq(payments.studentId, studentId)).orderBy(desc(payments.createdAt));
  }

  async getAllPayments(): Promise<Payment[]> {
    return db.select().from(payments).orderBy(desc(payments.createdAt));
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [created] = await db.insert(payments).values(payment).returning();
    return created;
  }

  async updatePayment(id: string, data: Partial<InsertPayment>): Promise<Payment | undefined> {
    const [updated] = await db.update(payments).set({ ...data, updatedAt: new Date() }).where(eq(payments.id, id)).returning();
    return updated;
  }

  async getSchedule(id: string): Promise<Schedule | undefined> {
    const [schedule] = await db.select().from(schedules).where(eq(schedules.id, id));
    return schedule;
  }

  async getSchedulesByStudent(studentId: string): Promise<Schedule[]> {
    return db.select().from(schedules).where(eq(schedules.studentId, studentId)).orderBy(desc(schedules.date));
  }

  async getSchedulesByInstructor(instructorId: string): Promise<Schedule[]> {
    return db.select().from(schedules).where(eq(schedules.instructorId, instructorId)).orderBy(desc(schedules.date));
  }

  async getSchedulesByInstructorAndStudent(instructorId: string, studentId: string): Promise<Schedule[]> {
    return db
      .select()
      .from(schedules)
      .where(and(eq(schedules.instructorId, instructorId), eq(schedules.studentId, studentId)))
      .orderBy(desc(schedules.date));
  }

  async getAllSchedules(): Promise<Schedule[]> {
    return db.select().from(schedules).orderBy(desc(schedules.date));
  }

  async createSchedule(schedule: InsertSchedule): Promise<Schedule> {
    const [created] = await db.insert(schedules).values(schedule).returning();
    return created;
  }

  async updateSchedule(id: string, data: Partial<InsertSchedule>): Promise<Schedule | undefined> {
    const [updated] = await db.update(schedules).set({ ...data, updatedAt: new Date() }).where(eq(schedules.id, id)).returning();
    return updated;
  }

  async deleteSchedule(id: string): Promise<void> {
    await db.delete(schedules).where(eq(schedules.id, id));
  }

  async getAssessment(id: string): Promise<Assessment | undefined> {
    const [assessment] = await db.select().from(assessments).where(eq(assessments.id, id));
    return assessment;
  }

  async getAssessmentByStudent(studentId: string): Promise<Assessment | undefined> {
    const [assessment] = await db
      .select()
      .from(assessments)
      .where(eq(assessments.studentId, studentId))
      .orderBy(desc(assessments.assessedAt))
      .limit(1);
    return assessment;
  }

  async getAssessmentsByStudent(studentId: string): Promise<Assessment[]> {
    return db
      .select()
      .from(assessments)
      .where(eq(assessments.studentId, studentId))
      .orderBy(desc(assessments.assessedAt));
  }

  async getAssessmentsByInstructor(instructorId: string): Promise<Assessment[]> {
    return db.select().from(assessments).where(eq(assessments.instructorId, instructorId)).orderBy(desc(assessments.assessedAt));
  }

  async getAssessmentsByInstructorAndStudent(instructorId: string, studentId: string): Promise<Assessment[]> {
    return db
      .select()
      .from(assessments)
      .where(and(eq(assessments.instructorId, instructorId), eq(assessments.studentId, studentId)))
      .orderBy(desc(assessments.assessedAt));
  }

  async getAllAssessments(): Promise<Assessment[]> {
    return db.select().from(assessments).orderBy(desc(assessments.assessedAt));
  }

  async createAssessment(assessment: InsertAssessment): Promise<Assessment> {
    const [created] = await db.insert(assessments).values(assessment).returning();
    return created;
  }

  async updateAssessment(id: string, data: Partial<InsertAssessment>): Promise<Assessment | undefined> {
    const [updated] = await db.update(assessments).set({ ...data, updatedAt: new Date() }).where(eq(assessments.id, id)).returning();
    return updated;
  }

  async getSettings(): Promise<Settings | undefined> {
    const [s] = await db.select().from(settings);
    return s;
  }

  async updateSettings(data: Partial<InsertSettings>): Promise<Settings | undefined> {
    const existing = await this.getSettings();
    if (existing) {
      const [updated] = await db.update(settings).set(data).where(eq(settings.id, existing.id)).returning();
      return updated;
    }
    const [created] = await db.insert(settings).values(data as InsertSettings).returning();
    return created;
  }

  async getCertificateByNumber(certificateNumber: string): Promise<Certificate | undefined> {
    const [cert] = await db.select().from(certificates).where(eq(certificates.certificateNumber, certificateNumber));
    return cert;
  }

  async getCertificateByStudent(studentId: string): Promise<Certificate | undefined> {
    const [cert] = await db.select().from(certificates).where(eq(certificates.studentId, studentId));
    return cert;
  }

  async getAllCertificates(): Promise<Certificate[]> {
    return db.select().from(certificates).orderBy(desc(certificates.issuedAt));
  }

  async createCertificate(certificate: InsertCertificate): Promise<Certificate> {
    const [created] = await db.insert(certificates).values(certificate).returning();
    return created;
  }

  async getNotificationsByUser(userId: string, limit = 20): Promise<Notification[]> {
    return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(limit);
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const rows = await db.select().from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
    return rows.length;
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [created] = await db.insert(notifications).values(notification).returning();
    return created;
  }

  async markNotificationRead(id: string, userId: string): Promise<void> {
    await db.update(notifications).set({ read: true }).where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db.update(notifications).set({ read: true }).where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
  }

  async deleteNotification(id: string, userId: string): Promise<void> {
    await db.delete(notifications).where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
  }

  async createAuditEvent(event: InsertAuditEvent): Promise<AuditEvent> {
    const [created] = await db.insert(auditEvents).values(event).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
