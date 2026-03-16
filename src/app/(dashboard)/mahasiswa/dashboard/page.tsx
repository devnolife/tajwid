"use client";

import { useAuth } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
import { ScoreCard } from "@/components/score-card";
import { CreditCard, Calendar, FileText, Award, CheckCircle2, Clock, ArrowRight } from "lucide-react";
import type { Payment, Schedule, Assessment } from "@shared/schema";

export default function MahasiswaDashboard() {
  const { user } = useAuth();

  const { data: payments } = useQuery<Payment[]>({
    queryKey: ["/api/payments", `?studentId=${user?.id}`],
  });

  const { data: schedules } = useQuery<Schedule[]>({
    queryKey: ["/api/schedules", `?studentId=${user?.id}`],
  });

  const { data: assessments } = useQuery<Assessment[]>({
    queryKey: ["/api/assessments", `?studentId=${user?.id}`],
  });

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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="rounded-2xl p-6 md:p-8 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #84B179 0%, #A2CB8B 100%)" }}>
        <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="pat1" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M30 0 L60 30 L30 60 L0 30Z" fill="none" stroke="#E8F5BD" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pat1)" />
        </svg>
        <div className="relative z-10">
          <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.8)" }}>Assalamu'alaikum,</p>
          <h1 className="text-2xl md:text-3xl font-bold mt-1 font-serif text-white">{user?.name}</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.7)" }}>NIM: {user?.nim} · {user?.faculty}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ScoreCard
          title="Status Pembayaran"
          value={statusLabels[paymentStatus] || paymentStatus}
          icon={<CreditCard className="w-5 h-5" />}
          color={paymentStatus === "lunas" ? "#059669" : "#D97706"}
          accent="#84B179"
        />
        <ScoreCard
          title="Jadwal Tes"
          value={hasSchedule ? "Terjadwal" : "Belum Ada"}
          subtitle={schedule ? new Date(schedule.date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : undefined}
          icon={<Calendar className="w-5 h-5" />}
          color={hasSchedule ? "#059669" : "#888"}
        />
        <ScoreCard
          title="Hasil Tes"
          value={hasResult ? `${assessment.totalScore}/100` : "Belum Tes"}
          subtitle={hasResult ? (passed ? "Lulus" : "Tidak Lulus") : undefined}
          icon={<FileText className="w-5 h-5" />}
          color={hasResult ? (passed ? "#059669" : "#DC2626") : "#888"}
        />
        <ScoreCard
          title="Sertifikat"
          value={passed ? "Tersedia" : "Belum"}
          icon={<Award className="w-5 h-5" />}
          color={passed ? "#059669" : "#888"}
          accent="#84B179"
        />
      </div>

      <div className="rounded-2xl border p-6" style={{ background: "#fff", borderColor: "#e8e4db" }}>
        <h3 className="text-base font-semibold mb-6" style={{ color: "#1A1A1A" }}>Progres Anda</h3>
        <div className="flex items-center justify-between relative">
          <div className="absolute top-5 left-8 right-8 h-0.5" style={{ background: "#e8e4db" }}>
            <div
              className="h-full transition-all duration-500"
              style={{
                background: "linear-gradient(90deg, #84B179, #C7EABB)",
                width: `${(steps.filter(s => s.done).length / steps.length) * 100}%`,
              }}
            />
          </div>
          {steps.map((step, i) => (
            <div key={step.label} className="flex flex-col items-center relative z-10" style={{ flex: 1 }}>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mb-2 transition-all duration-300"
                style={{
                  background: step.done ? "#84B179" : step.active ? "#A2CB8B" : "#e8e4db",
                  color: step.done || step.active ? "#fff" : "#999",
                }}
              >
                {step.done ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
              </div>
              <span className="text-xs text-center font-medium max-w-[80px]" style={{ color: step.done ? "#84B179" : step.active ? "#A2CB8B" : "#999" }}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
