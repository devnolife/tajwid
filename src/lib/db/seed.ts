import { db } from "@/lib/db";
import { users, payments, schedules, assessments, settings, certificates } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seedDatabase() {
  const existing = await db.select().from(users).limit(1);
  if (existing.length > 0) return;

  const studentData = [
    { username: "2024101001", password: "password123", role: "mahasiswa" as const, name: "Ahmad Fauzan Rizki", nim: "2024101001", faculty: "Fakultas Teknik", program: "Teknik Informatika", email: "ahmad.fauzan@univ.ac.id", phone: "081234567890" },
    { username: "2024101002", password: "password123", role: "mahasiswa" as const, name: "Siti Nurhaliza Putri", nim: "2024101002", faculty: "Fakultas Ekonomi", program: "Manajemen", email: "siti.nurhaliza@univ.ac.id", phone: "081234567891" },
    { username: "2024101003", password: "password123", role: "mahasiswa" as const, name: "Muhammad Rafli Hidayat", nim: "2024101003", faculty: "Fakultas Hukum", program: "Ilmu Hukum", email: "rafli.hidayat@univ.ac.id", phone: "081234567892" },
    { username: "2024101004", password: "password123", role: "mahasiswa" as const, name: "Aisyah Zahra Kamila", nim: "2024101004", faculty: "Fakultas Kedokteran", program: "Pendidikan Dokter", email: "aisyah.zahra@univ.ac.id", phone: "081234567893" },
    { username: "2024101005", password: "password123", role: "mahasiswa" as const, name: "Dimas Pratama Putra", nim: "2024101005", faculty: "Fakultas Teknik", program: "Teknik Sipil", email: "dimas.pratama@univ.ac.id", phone: "081234567894" },
  ];

  const instructorData = [
    { username: "ustadz_hamid", password: "password123", role: "instruktur" as const, name: "Ustadz Abdul Hamid, Lc.", specialization: "Tajwid & Qira'at", email: "hamid@univ.ac.id", phone: "081345678901" },
    { username: "ustadzah_maryam", password: "password123", role: "instruktur" as const, name: "Ustadzah Maryam Hasan, S.Ag.", specialization: "Tahsin Al-Quran", email: "maryam@univ.ac.id", phone: "081345678902" },
  ];

  const adminData = [
    { username: "admin", password: "admin123", role: "admin" as const, name: "Administrator Sistem", email: "admin@univ.ac.id", phone: "081456789012" },
  ];

  const insertedStudents = await db.insert(users).values(studentData).returning();
  const insertedInstructors = await db.insert(users).values(instructorData).returning();
  await db.insert(users).values(adminData).returning();

  const now = new Date();
  const dueDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const paymentData = [
    { studentId: insertedStudents[0].id, amount: "25000", dueDate, description: "Biaya Ujian Tajwid Semester Genap 2025/2026", status: "lunas" as const, paidAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000) },
    { studentId: insertedStudents[1].id, amount: "25000", dueDate, description: "Biaya Ujian Tajwid Semester Genap 2025/2026", status: "menunggu_verifikasi" as const, proofUrl: "/uploads/bukti_bayar_siti.jpg" },
    { studentId: insertedStudents[2].id, amount: "25000", dueDate, description: "Biaya Ujian Tajwid Semester Genap 2025/2026", status: "lunas" as const, paidAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) },
    { studentId: insertedStudents[3].id, amount: "25000", dueDate, description: "Biaya Ujian Tajwid Semester Genap 2025/2026", status: "belum_bayar" as const },
    { studentId: insertedStudents[4].id, amount: "25000", dueDate, description: "Biaya Ujian Tajwid Semester Genap 2025/2026", status: "lunas" as const, paidAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) },
  ];
  await db.insert(payments).values(paymentData);

  const scheduleDate1 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  scheduleDate1.setHours(9, 0, 0, 0);
  const scheduleDate2 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  scheduleDate2.setHours(10, 0, 0, 0);
  const scheduleDate3 = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000);
  scheduleDate3.setHours(9, 0, 0, 0);

  const scheduleData = [
    { studentId: insertedStudents[0].id, instructorId: insertedInstructors[0].id, date: scheduleDate1, room: "Ruang 101", location: "Gedung Dakwah Lt. 2" },
    { studentId: insertedStudents[2].id, instructorId: insertedInstructors[0].id, date: scheduleDate2, room: "Ruang 101", location: "Gedung Dakwah Lt. 2" },
    { studentId: insertedStudents[4].id, instructorId: insertedInstructors[1].id, date: scheduleDate3, room: "Ruang 203", location: "Gedung Dakwah Lt. 3" },
  ];
  await db.insert(schedules).values(scheduleData);

  const assessmentData = [
    { studentId: insertedStudents[0].id, instructorId: insertedInstructors[0].id, tajwid: 85, kelancaran: 80, makhorijulHuruf: 78, adab: 90, totalScore: 83, passed: true, notes: "Bacaan baik, tajwid sudah cukup benar. Perlu sedikit perbaikan pada hukum nun mati.", assessedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) },
  ];
  await db.insert(assessments).values(assessmentData);

  // Generate certificate for passed student
  await db.insert(certificates).values({
    certificateNumber: "TJW-2025-SAMPLE",
    studentId: insertedStudents[0].id,
    assessmentId: (await db.select().from(assessments).limit(1))[0].id,
    studentName: insertedStudents[0].name,
    studentNim: insertedStudents[0].nim,
    studentFaculty: insertedStudents[0].faculty,
    studentProgram: insertedStudents[0].program,
    totalScore: 83,
    academicYear: "2025/2026",
    signerName: "Dr. Alamsyah, S.Pd.I., M.H.",
    signerTitle: "Wakil Dekan IV",
  });

  await db.insert(settings).values({
    appName: "TajwidKu",
    academicYear: "2025/2026",
    passingScore: 70,
    paymentAmount: "25000",
  });

  console.log("Database seeded successfully!");
}
