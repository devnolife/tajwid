"use client";

import { useAuth } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ScoreCard } from "@/components/score-card";
import { CreditCard, Calendar, FileText, Award, CheckCircle2, Clock, ArrowRight } from "lucide-react";
import type { Payment, Schedule, Assessment } from "@shared/schema";

export default function MahasiswaDashboard() {
  const { user } = useAuth();

  const { data: payments, isLoading: isLoadingPayments } = useQuery<Payment[]>({
    queryKey: ["/api/payments", `?studentId=${user?.id}`],
  });

  const { data: schedules, isLoading: isLoadingSchedules } = useQuery<Schedule[]>({
    queryKey: ["/api/schedules", `?studentId=${user?.id}`],
  });

  const { data: assessments, isLoading: isLoadingAssessments } = useQuery<Assessment[]>({
    queryKey: ["/api/assessments", `?studentId=${user?.id}`],
  });

  const isLoading = isLoadingPayments || isLoadingSchedules || isLoadingAssessments;

  const payment = payments?.[0];
  const schedule = schedules?.[0];
  const assessment = assessments?.[0];

  const paymentStatus = payment?.status || "belum_bayar";
  const hasSchedule = !!schedule;
  const hasResult = !!assessment;
  const passed = assessment?.passed;

  const steps = [
    { label: "Pembayaran", done: paymentStatus === "lunas", active: paymentStatus !== "lunas" },
    { label: "Menunggu Jadwal", done: hasSchedule, active: paymentStatus === "lunas" && !hasSchedule },
    { label: "Tes Tajwid", done: hasResult, active: hasSchedule && !hasResult },
    { label: "Penilaian", done: hasResult, active: false },
    { label: "Sertifikat", done: !!passed, active: hasResult && !passed },
  ];

  const statusLabels: Record<string, string> = {
    belum_bayar: "Belum Bayar",
    menunggu_verifikasi: "Menunggu Verifikasi",
    lunas: "Lunas",
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="animate-pulse rounded-2xl h-40" style={{ background: "hsl(40 22% 90%)" }} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl h-32" style={{ background: "hsl(40 22% 90%)" }} />
          ))}
        </div>
        <div className="animate-pulse rounded-2xl h-56" style={{ background: "hsl(40 22% 90%)" }} />
      </div>
    );
  }

  // Time-based salam — adem kalo waktunya pas
  const hour = new Date().getHours();
  const salam =
    hour < 11 ? "Selamat pagi" : hour < 15 ? "Selamat siang" : hour < 18 ? "Selamat sore" : "Selamat malam";

  // Determine the next actionable step
  const nextAction = (() => {
    if (paymentStatus === "belum_bayar") {
      return { label: "Lakukan Pembayaran", desc: "Selesaikan biaya ujian tajwid sebagai langkah pertama.", href: "/mahasiswa/pembayaran", icon: CreditCard };
    }
    if (paymentStatus === "menunggu_verifikasi") {
      return { label: "Tunggu Verifikasi", desc: "Bukti pembayaran Anda sedang diverifikasi admin.", href: "/mahasiswa/pembayaran", icon: Clock };
    }
    if (!hasSchedule) {
      return { label: "Menunggu Jadwal", desc: "Admin akan menjadwalkan tes tajwid Anda dalam waktu dekat.", href: "/mahasiswa/jadwal", icon: Calendar };
    }
    if (!hasResult) {
      return { label: "Hadiri Tes Tajwid", desc: "Datanglah tepat waktu sesuai jadwal yang telah ditentukan.", href: "/mahasiswa/jadwal", icon: FileText };
    }
    if (passed) {
      return { label: "Unduh Sertifikat", desc: "Selamat! Sertifikat tartil Anda sudah dapat diunduh.", href: "/mahasiswa/sertifikat", icon: Award };
    }
    return { label: "Lihat Hasil Tes", desc: "Pelajari catatan dari instruktur dan ikuti tes ulang.", href: "/mahasiswa/hasil", icon: FileText };
  })();
  const NextIcon = nextAction.icon;

  return (
    <div className="space-y-8 animate-ascend">
      {/* === Hero — emerald sanctuary card === */}
      <section
        className="relative rounded-3xl p-6 md:p-10 overflow-hidden border"
        style={{
          background:
            "radial-gradient(ellipse 60% 80% at 0% 0%, hsl(38 60% 60% / 0.22), transparent 60%)," +
            "radial-gradient(ellipse 80% 70% at 100% 100%, hsl(172 55% 14% / 0.95), transparent 70%)," +
            "linear-gradient(135deg, hsl(168 50% 18%) 0%, hsl(172 55% 14%) 60%, hsl(180 60% 10%) 100%)",
          borderColor: "hsl(168 30% 18%)",
        }}
      >
        {/* arabesque texture */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hero-pat" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <g fill="none" stroke="#E8D5A8" strokeWidth="0.6">
                <path d="M50 8 L72 30 L92 50 L72 70 L50 92 L28 70 L8 50 L28 30 Z" />
                <path d="M50 8 L72 30 L92 50 L72 70 L50 92 L28 70 L8 50 L28 30 Z" transform="rotate(45 50 50)" />
                <circle cx="50" cy="50" r="4" />
              </g>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-pat)" />
        </svg>

        {/* Floating mihrab */}
        <svg
          className="absolute -right-8 -top-12 w-72 h-72 opacity-[0.10]"
          viewBox="0 0 200 200" fill="none" stroke="#E8D5A8" strokeWidth="0.5"
        >
          <path d="M100 10 C160 10 180 70 180 130 L180 195 L20 195 L20 130 C20 70 40 10 100 10 Z" />
          <path d="M100 30 C145 30 160 80 160 130 L160 175 L40 175 L40 130 C40 80 55 30 100 30 Z" />
        </svg>

        <div className="relative z-10 grid md:grid-cols-[1fr_auto] gap-6 items-end">
          <div>
            <p className="text-[11px] tracking-[0.28em] uppercase font-semibold text-[hsl(38_85%_88%)]">
              Assalamu'alaikum · {salam}
            </p>
            <h1 className="font-display italic text-4xl md:text-5xl lg:text-6xl mt-2 text-white leading-[1.05]">
              {user?.name}
            </h1>
            <div className="flex items-center gap-2 mt-3 text-sm text-white/65">
              <span className="font-arabic text-[hsl(38_60%_72%)]">۞</span>
              <span>NIM {user?.nim}</span>
              <span className="text-white/30">·</span>
              <span>{user?.faculty}</span>
            </div>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-white/70 italic font-display">
              "Sebaik-baik kalian adalah yang mempelajari Al-Qur'an dan mengajarkannya."
              <span className="block text-xs not-italic font-sans tracking-wide text-white/45 mt-1">
                — HR. Bukhari
              </span>
            </p>
          </div>

          {/* Arabic ayah block */}
          <div className="hidden md:block text-right max-w-xs">
            <p
              className="font-arabic text-3xl leading-[1.9] text-[hsl(42_45%_94%)]"
              dir="rtl"
            >
              وَرَتِّلِ ٱلْقُرْءَانَ تَرْتِيلًا
            </p>
            <p className="text-[11px] text-[hsl(38_55%_75%)]/60 mt-1 tracking-wider">
              QS. Al-Muzzammil : 4
            </p>
          </div>
        </div>
      </section>

      {/* === Stat cards === */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ScoreCard
          title="Status Pembayaran"
          value={statusLabels[paymentStatus] || paymentStatus}
          icon={<CreditCard className="w-5 h-5" />}
          color={paymentStatus === "lunas" ? "hsl(152 38% 32%)" : "hsl(28 75% 42%)"}
          accent={paymentStatus === "lunas" ? "hsl(152 38% 42%)" : "hsl(38 55% 56%)"}
        />
        <ScoreCard
          title="Jadwal Tes"
          value={hasSchedule ? "Terjadwal" : "Belum Ada"}
          subtitle={schedule ? new Date(schedule.date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "Menunggu penjadwalan"}
          icon={<Calendar className="w-5 h-5" />}
          color={hasSchedule ? "hsl(168 50% 22%)" : "hsl(168 14% 45%)"}
          accent="hsl(168 45% 35%)"
        />
        <ScoreCard
          title="Hasil Tes"
          value={hasResult ? `${assessment.totalScore}/100` : "Belum Tes"}
          subtitle={hasResult ? (passed ? "Lulus dengan baik" : "Belum lulus") : "Menanti penilaian"}
          icon={<FileText className="w-5 h-5" />}
          color={hasResult ? (passed ? "hsl(152 38% 32%)" : "hsl(0 58% 42%)") : "hsl(168 14% 45%)"}
          accent={hasResult && passed ? "hsl(152 38% 42%)" : "hsl(38 55% 56%)"}
        />
        <ScoreCard
          title="Sertifikat"
          value={passed ? "Tersedia" : "Belum"}
          subtitle={passed ? "Siap diunduh" : "Selesaikan tes dahulu"}
          icon={<Award className="w-5 h-5" />}
          color={passed ? "hsl(38 55% 40%)" : "hsl(168 14% 45%)"}
          accent="hsl(38 55% 56%)"
        />
      </div>

      {/* === Progress timeline === */}
      <section
        className="relative rounded-3xl border bg-card p-6 md:p-8 overflow-hidden"
        style={{ borderColor: "hsl(40 22% 88%)" }}
      >
        {/* corner watermark */}
        <svg className="absolute -bottom-8 -right-8 w-44 h-44 opacity-[0.05]" viewBox="0 0 100 100" fill="none" stroke="hsl(168 50% 22%)" strokeWidth="0.6">
          <path d="M50 5 L70 30 L95 50 L70 70 L50 95 L30 70 L5 50 L30 30 Z" />
          <path d="M50 5 L70 30 L95 50 L70 70 L50 95 L30 70 L5 50 L30 30 Z" transform="rotate(45 50 50)" />
          <circle cx="50" cy="50" r="3" fill="hsl(168 50% 22%)" />
        </svg>

        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-[11px] tracking-[0.22em] uppercase font-semibold text-[hsl(38_55%_46%)]">Perjalanan Anda</p>
            <h3 className="font-display italic text-2xl text-foreground mt-1">Progres Tartil</h3>
          </div>
          <div className="text-right">
            <p className="text-[11px] tracking-wide text-muted-foreground">Tahap Selesai</p>
            <p className="font-display text-2xl text-primary">
              {steps.filter(s => s.done).length}<span className="text-muted-foreground/50">/{steps.length}</span>
            </p>
          </div>
        </div>

        <div className="flex items-start justify-between relative">
          {/* track */}
          <div className="absolute top-6 left-10 right-10 h-[3px] rounded-full" style={{ background: "hsl(40 22% 88%)" }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                background: "linear-gradient(90deg, hsl(168 50% 22%), hsl(38 55% 56%))",
                width: `${(steps.filter(s => s.done).length / steps.length) * 100}%`,
                boxShadow: "0 0 12px hsl(38 55% 56% / 0.5)",
              }}
            />
          </div>
          {steps.map((step, i) => (
            <div key={step.label} className="flex flex-col items-center relative z-10" style={{ flex: 1 }}>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold mb-3 transition-all duration-300 border-2"
                style={{
                  background: step.done
                    ? "hsl(168 50% 22%)"
                    : step.active
                      ? "hsl(44 45% 98%)"
                      : "hsl(40 22% 92%)",
                  color: step.done ? "hsl(44 45% 96%)" : step.active ? "hsl(38 55% 46%)" : "hsl(168 14% 55%)",
                  borderColor: step.done
                    ? "hsl(38 55% 56%)"
                    : step.active
                      ? "hsl(38 55% 56%)"
                      : "hsl(40 22% 88%)",
                  boxShadow: step.active ? "0 0 0 4px hsl(38 55% 56% / 0.15)" : "none",
                }}
              >
                {step.done ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
              </div>
              <span
                className={`text-[11px] text-center max-w-[90px] tracking-wide ${step.done || step.active ? "font-semibold" : "font-normal"}`}
                style={{
                  color: step.done
                    ? "hsl(168 50% 22%)"
                    : step.active
                      ? "hsl(38 55% 40%)"
                      : "hsl(168 14% 50%)",
                }}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>

        <div className="ornament-divider mt-8 max-w-md mx-auto">
          <span className="text-[hsl(38_55%_56%)] text-base">۞</span>
        </div>
      </section>

      {/* === Next Action CTA === */}
      <Link
        href={nextAction.href}
        data-testid="next-action-cta"
        className="group relative block rounded-3xl p-6 md:p-7 border overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-20px_hsl(168_50%_22%/0.4)]"
        style={{
          borderColor: "hsl(168 30% 18%)",
          background:
            "radial-gradient(ellipse 70% 100% at 100% 50%, hsl(38 60% 60% / 0.18), transparent 60%)," +
            "linear-gradient(135deg, hsl(168 50% 18%) 0%, hsl(172 55% 14%) 100%)",
        }}
      >
        {/* Arabesque texture */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.06] group-hover:opacity-[0.10] transition-opacity" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="cta-pat" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <g fill="none" stroke="#E8D5A8" strokeWidth="0.5">
                <path d="M30 5 L45 20 L55 30 L45 40 L30 55 L15 40 L5 30 L15 20 Z" />
              </g>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#cta-pat)" />
        </svg>

        <div className="relative z-10 flex items-center gap-5">
          <div
            className="flex items-center justify-center w-14 h-14 rounded-2xl border flex-shrink-0 transition-transform duration-500 group-hover:rotate-[8deg]"
            style={{
              background: "linear-gradient(135deg, hsl(38 60% 60% / 0.25), hsl(38 60% 60% / 0.05))",
              borderColor: "hsl(38 60% 60% / 0.4)",
              color: "hsl(38 65% 78%)",
            }}
          >
            <NextIcon className="w-6 h-6" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[10px] tracking-[0.28em] uppercase font-semibold text-[hsl(38_85%_88%)]">
              Aksi Selanjutnya
            </p>
            <h4 className="font-display italic text-2xl md:text-3xl text-white mt-1 leading-tight">
              {nextAction.label}
            </h4>
            <p className="text-sm text-white/65 mt-1 max-w-md">
              {nextAction.desc}
            </p>
          </div>

          <div
            className="hidden sm:flex items-center justify-center w-11 h-11 rounded-full border transition-all duration-300 group-hover:translate-x-1"
            style={{
              borderColor: "hsl(38 60% 60% / 0.4)",
              color: "hsl(38 65% 78%)",
              background: "hsl(38 60% 60% / 0.08)",
            }}
          >
            <ArrowRight className="w-5 h-5" />
          </div>
        </div>
      </Link>
    </div>
  );
}
