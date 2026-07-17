import type { InsertNotification } from "@shared/schema";

export const notifyTemplates = {
  paymentCreated: (userId: string, amount: number | string): InsertNotification => ({
    userId,
    type: "payment",
    title: "Tagihan baru",
    message: `Anda memiliki tagihan baru sebesar Rp ${Number(amount).toLocaleString("id-ID")}. Klik untuk melihat detail.`,
    link: "/mahasiswa/pembayaran",
    read: false,
  }),
  paymentVerified: (userId: string, status: "lunas" | "ditolak"): InsertNotification => ({
    userId,
    type: "payment",
    title: status === "lunas" ? "Pembayaran disetujui" : "Pembayaran ditolak",
    message: status === "lunas"
      ? "Bukti pembayaran Anda telah diverifikasi. Sertifikat sudah dapat diunduh."
      : "Bukti pembayaran Anda ditolak. Silakan upload ulang dengan bukti yang valid.",
    link: status === "lunas" ? "/mahasiswa/sertifikat" : "/mahasiswa/pembayaran",
    read: false,
  }),
  paymentNeedsVerification: (adminId: string, studentName: string): InsertNotification => ({
    userId: adminId,
    type: "payment",
    title: "Bukti pembayaran masuk",
    message: `${studentName} mengirimkan bukti pembayaran. Mohon verifikasi.`,
    link: "/admin/pembayaran",
    read: false,
  }),
  scheduleCreatedForStudent: (userId: string, date: Date, room: string): InsertNotification => ({
    userId,
    type: "schedule",
    title: "Jadwal tes tersedia",
    message: `Jadwal tes tajwid Anda: ${date.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} di ${room}.`,
    link: "/mahasiswa/jadwal",
    read: false,
  }),
  scheduleCreatedForInstructor: (userId: string, studentName: string, date: Date): InsertNotification => ({
    userId,
    type: "schedule",
    title: "Jadwal pengujian baru",
    message: `${studentName} dijadwalkan untuk diuji mengaji pada ${date.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}.`,
    link: "/instruktur/jadwal-mengajar",
    read: false,
  }),
  scheduleUpdatedForStudent: (userId: string, date: Date, room: string): InsertNotification => ({
    userId,
    type: "schedule",
    title: "Jadwal diperbarui",
    message: `Jadwal tes tajwid Anda diperbarui: ${date.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} pukul ${date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} di ${room}.`,
    link: "/mahasiswa/jadwal",
    read: false,
  }),
  scheduleCancelledForStudent: (userId: string, date: Date): InsertNotification => ({
    userId,
    type: "schedule",
    title: "Jadwal dibatalkan",
    message: `Jadwal tes tajwid Anda pada ${date.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} dibatalkan. Silakan hubungi admin untuk jadwal pengganti.`,
    link: "/mahasiswa/jadwal",
    read: false,
  }),
  assessmentPublished: (userId: string, score: number, passed: boolean): InsertNotification => ({
    userId,
    type: "result",
    title: passed ? "Selamat, Anda LULUS!" : "Hasil tes: Perlu Mengulang",
    message: passed
      ? `Anda dinyatakan lulus dengan skor ${score}. Selesaikan pembayaran agar sertifikat dapat diterbitkan.`
      : `Skor Anda ${score}. Anda diminta mengulang mengaji pada jadwal berikutnya. Lihat catatan dari instruktur.`,
    link: passed ? "/mahasiswa/pembayaran" : "/mahasiswa/hasil",
    read: false,
  }),
  repeatScheduleCreated: (userId: string, date: Date, room: string): InsertNotification => ({
    userId,
    type: "schedule",
    title: "Jadwal mengaji ulang",
    message: `Anda diminta mengulang mengaji pada ${date.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} pukul ${date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} di ${room}.`,
    link: "/mahasiswa/jadwal",
    read: false,
  }),
};
