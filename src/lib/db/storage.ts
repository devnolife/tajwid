import {
  type User, type InsertUser,
  type Payment, type InsertPayment,
  type Schedule, type InsertSchedule,
  type Assessment, type InsertAssessment,
  type Settings, type InsertSettings,
  users, payments, schedules, assessments, settings,
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
  getUsersByRole(role: string): Promise<User[]>;

  getPayment(id: string): Promise<Payment | undefined>;
  getPaymentsByStudent(studentId: string): Promise<Payment[]>;
  getAllPayments(): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: string, data: Partial<InsertPayment>): Promise<Payment | undefined>;

  getSchedule(id: string): Promise<Schedule | undefined>;
  getSchedulesByStudent(studentId: string): Promise<Schedule[]>;
  getSchedulesByInstructor(instructorId: string): Promise<Schedule[]>;
  getAllSchedules(): Promise<Schedule[]>;
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  updateSchedule(id: string, data: Partial<InsertSchedule>): Promise<Schedule | undefined>;
  deleteSchedule(id: string): Promise<void>;

  getAssessment(id: string): Promise<Assessment | undefined>;
  getAssessmentByStudent(studentId: string): Promise<Assessment | undefined>;
  getAssessmentsByInstructor(instructorId: string): Promise<Assessment[]>;
  getAllAssessments(): Promise<Assessment[]>;
  createAssessment(assessment: InsertAssessment): Promise<Assessment>;
  updateAssessment(id: string, data: Partial<InsertAssessment>): Promise<Assessment | undefined>;

  getSettings(): Promise<Settings | undefined>;
  updateSettings(data: Partial<InsertSettings>): Promise<Settings | undefined>;
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
    const [updated] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return updated;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return db.select().from(users).where(eq(users.role, role as any));
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment;
  }

  async getPaymentsByStudent(studentId: string): Promise<Payment[]> {
    return db.select().from(payments).where(eq(payments.studentId, studentId));
  }

  async getAllPayments(): Promise<Payment[]> {
    return db.select().from(payments);
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [created] = await db.insert(payments).values(payment).returning();
    return created;
  }

  async updatePayment(id: string, data: Partial<InsertPayment>): Promise<Payment | undefined> {
    const [updated] = await db.update(payments).set(data).where(eq(payments.id, id)).returning();
    return updated;
  }

  async getSchedule(id: string): Promise<Schedule | undefined> {
    const [schedule] = await db.select().from(schedules).where(eq(schedules.id, id));
    return schedule;
  }

  async getSchedulesByStudent(studentId: string): Promise<Schedule[]> {
    return db.select().from(schedules).where(eq(schedules.studentId, studentId));
  }

  async getSchedulesByInstructor(instructorId: string): Promise<Schedule[]> {
    return db.select().from(schedules).where(eq(schedules.instructorId, instructorId));
  }

  async getAllSchedules(): Promise<Schedule[]> {
    return db.select().from(schedules);
  }

  async createSchedule(schedule: InsertSchedule): Promise<Schedule> {
    const [created] = await db.insert(schedules).values(schedule).returning();
    return created;
  }

  async updateSchedule(id: string, data: Partial<InsertSchedule>): Promise<Schedule | undefined> {
    const [updated] = await db.update(schedules).set(data).where(eq(schedules.id, id)).returning();
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
    const [assessment] = await db.select().from(assessments).where(eq(assessments.studentId, studentId));
    return assessment;
  }

  async getAssessmentsByInstructor(instructorId: string): Promise<Assessment[]> {
    return db.select().from(assessments).where(eq(assessments.instructorId, instructorId));
  }

  async getAllAssessments(): Promise<Assessment[]> {
    return db.select().from(assessments);
  }

  async createAssessment(assessment: InsertAssessment): Promise<Assessment> {
    const [created] = await db.insert(assessments).values(assessment).returning();
    return created;
  }

  async updateAssessment(id: string, data: Partial<InsertAssessment>): Promise<Assessment | undefined> {
    const [updated] = await db.update(assessments).set(data).where(eq(assessments.id, id)).returning();
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
}

export const storage = new DatabaseStorage();
