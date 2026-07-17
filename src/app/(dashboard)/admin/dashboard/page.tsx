"use client";

import { useAuth } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
import { ScoreCard } from "@/components/score-card";
import { Users, CreditCard, CheckCircle, XCircle, Clock, TrendingUp, GraduationCap, Activity } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import type { User, Payment, Assessment } from "@shared/schema";

/* === Sajadah Subuh palette anchors === */
const C = {
  emerald: "hsl(168 50% 22%)",
  emeraldDeep: "hsl(172 55% 14%)",
  emeraldSoft: "hsl(168 38% 42%)",
  gold: "hsl(38 55% 56%)",
  goldDeep: "hsl(38 55% 40%)",
  sage: "hsl(152 38% 42%)",
  rust: "hsl(0 58% 42%)",
  cream: "hsl(44 45% 98%)",
  taupe: "hsl(40 22% 88%)",
  ink: "hsl(190 28% 12%)",
  muted: "hsl(168 14% 50%)",
};

export default function AdminDashboard() {
  const { user } = useAuth();

  const { data: students, isLoading: isLoadingStudents } = useQuery<Omit<User, "password">[]>({
    queryKey: ["/api/users", "?role=mahasiswa"],
  });

  const { data: instructors, isLoading: isLoadingInstructors } = useQuery<Omit<User, "password">[]>({
    queryKey: ["/api/users", "?role=instruktur"],
  });

  const { data: payments, isLoading: isLoadingPayments } = useQuery<Payment[]>({
    queryKey: ["/api/payments"],
  });

  const { data: assessments, isLoading: isLoadingAssessments } = useQuery<Assessment[]>({
    queryKey: ["/api/assessments"],
  });

  const isLoading = isLoadingStudents || isLoadingInstructors || isLoadingPayments || isLoadingAssessments;

  const totalStudents = students?.length || 0;
  const totalInstructors = instructors?.length || 0;
  const lunas = payments?.filter(p => p.status === "lunas").length || 0;
  const menunggu = payments?.filter(p => p.status === "menunggu_verifikasi").length || 0;
  const passedCount = assessments?.filter(a => a.passed).length || 0;
  const failedCount = assessments?.filter(a => !a.passed).length || 0;
  const notTested = Math.max(0, totalStudents - (assessments?.length || 0));
  const passRate = (passedCount + failedCount) > 0
    ? Math.round((passedCount / (passedCount + failedCount)) * 100)
    : 0;

  const pieData = [
    { name: "Lulus", value: passedCount, color: C.sage },
    { name: "Belum Lulus", value: failedCount, color: C.rust },
    { name: "Belum Tes", value: notTested, color: C.gold },
  ].filter(d => d.value > 0);

  // Pembayaran lunas per bulan (6 bulan terakhir) berdasarkan paidAt nyata.
  const barData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (5 - i));
    const count = payments?.filter(p => {
      if (p.status !== "lunas" || !p.paidAt) return false;
      const paid = new Date(p.paidAt);
      return paid.getFullYear() === d.getFullYear() && paid.getMonth() === d.getMonth();
    }).length || 0;
    return { month: d.toLocaleDateString("id-ID", { month: "short" }), count };
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse rounded-3xl h-44" style={{ background: "hsl(40 22% 90%)" }} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl h-32" style={{ background: "hsl(40 22% 90%)" }} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="animate-pulse rounded-3xl h-80" style={{ background: "hsl(40 22% 90%)" }} />
          <div className="animate-pulse rounded-3xl h-80" style={{ background: "hsl(40 22% 90%)" }} />
        </div>
      </div>
    );
  }

  const hour = new Date().getHours();
  const salam = hour < 11 ? "Selamat pagi" : hour < 15 ? "Selamat siang" : hour < 18 ? "Selamat sore" : "Selamat malam";

  return (
    <div className="space-y-8 animate-ascend">
      {/* === Hero === */}
      <section
        className="relative rounded-3xl p-6 md:p-9 overflow-hidden border"
        style={{
          background:
            "radial-gradient(ellipse 60% 80% at 100% 0%, hsl(38 60% 60% / 0.20), transparent 60%)," +
            "radial-gradient(ellipse 80% 70% at 0% 100%, hsl(172 55% 14% / 0.95), transparent 70%)," +
            "linear-gradient(135deg, hsl(168 50% 18%) 0%, hsl(172 55% 14%) 60%, hsl(180 60% 10%) 100%)",
          borderColor: "hsl(168 30% 18%)",
        }}
      >
        <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="adm-pat" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <g fill="none" stroke="#E8D5A8" strokeWidth="0.5">
                <path d="M50 8 L72 30 L92 50 L72 70 L50 92 L28 70 L8 50 L28 30 Z" />
                <path d="M50 8 L72 30 L92 50 L72 70 L50 92 L28 70 L8 50 L28 30 Z" transform="rotate(45 50 50)" />
              </g>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#adm-pat)" />
        </svg>

        <div className="relative z-10 grid md:grid-cols-[1fr_auto] gap-8 items-end">
          <div>
            <p className="text-[11px] tracking-[0.28em] uppercase font-semibold text-[hsl(38_85%_88%)]">
              Konsol Administrator · {salam}
            </p>
            <h1 className="font-display italic text-4xl md:text-5xl lg:text-6xl mt-2 text-white leading-[1.05]">
              {user?.name || "Administrator"}
            </h1>
            <p className="text-sm text-white/65 mt-3 max-w-md">
              Pantau alur penilaian tajwid Universitas Muhammadiyah Makassar — mahasiswa,
              instruktur, pembayaran, hasil, dan sertifikat dalam satu pandang.
            </p>
          </div>

          {/* Pass-rate gauge */}
          <div className="flex items-center gap-5">
            <div className="relative w-28 h-28">
              <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(168 30% 22%)" strokeWidth="6" />
                <circle
                  cx="50" cy="50" r="42" fill="none"
                  stroke="hsl(38 60% 60%)" strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${(passRate / 100) * 264} 264`}
                  style={{ transition: "stroke-dasharray 1s ease" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-3xl text-white leading-none">{passRate}<span className="text-[hsl(38_60%_72%)] text-lg">%</span></span>
                <span className="text-[9px] tracking-[0.2em] uppercase text-white/55 mt-1">Lulus</span>
              </div>
            </div>
            <div className="hidden sm:block text-right space-y-1">
              <p className="text-[10px] tracking-[0.22em] uppercase text-white/45">Total Penilaian</p>
              <p className="font-display text-2xl text-white">{passedCount + failedCount}</p>
              <p className="text-[10px] text-[hsl(38_60%_72%)]/80">dari {totalStudents} mahasiswa</p>
            </div>
          </div>
        </div>
      </section>

      {/* === KPI grid === */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <ScoreCard title="Mahasiswa" value={totalStudents} icon={<Users className="w-5 h-5" />} color={C.emerald} accent={C.emeraldSoft} />
        <ScoreCard title="Instruktur" value={totalInstructors} icon={<GraduationCap className="w-5 h-5" />} color={C.emerald} accent={C.gold} />
        <ScoreCard title="Pembayaran Lunas" value={lunas} icon={<CreditCard className="w-5 h-5" />} color={C.sage} accent={C.sage} />
        <ScoreCard title="Menunggu Verifikasi" value={menunggu} icon={<Clock className="w-5 h-5" />} color={C.goldDeep} accent={C.gold} />
        <ScoreCard title="Lulus" value={passedCount} icon={<CheckCircle className="w-5 h-5" />} color={C.sage} accent={C.sage} />
        <ScoreCard title="Belum Lulus" value={failedCount} icon={<XCircle className="w-5 h-5" />} color={C.rust} accent={C.rust} />
      </div>

      {/* === Charts === */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Bar chart */}
        <div className="lg:col-span-3 relative rounded-3xl border bg-card p-6 md:p-7 overflow-hidden" style={{ borderColor: C.taupe }}>
          <svg className="absolute -bottom-6 -right-6 w-32 h-32 opacity-[0.05]" viewBox="0 0 100 100" fill="none" stroke={C.emerald} strokeWidth="0.6">
            <path d="M50 5 L70 30 L95 50 L70 70 L50 95 L30 70 L5 50 L30 30 Z" />
            <path d="M50 5 L70 30 L95 50 L70 70 L50 95 L30 70 L5 50 L30 30 Z" transform="rotate(45 50 50)" />
          </svg>

          <div className="flex items-center justify-between mb-6 relative">
            <div>
              <p className="text-[11px] tracking-[0.22em] uppercase font-semibold text-[hsl(38_55%_46%)]">Statistik</p>
              <h3 className="font-display italic text-2xl text-foreground mt-1">Pembayaran per Bulan</h3>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full">
              <Activity className="w-3.5 h-3.5 text-[hsl(38_55%_46%)]" />
              <span>5 bulan terakhir</span>
            </div>
          </div>

          <div className="h-64 relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="bar-emerald" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.gold} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={C.emerald} stopOpacity={0.95} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke={C.taupe} vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: C.muted, fontSize: 11, fontWeight: 600, letterSpacing: 1 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "hsl(168 50% 22% / 0.06)" }}
                  contentStyle={{
                    background: C.cream,
                    border: `1px solid ${C.taupe}`,
                    borderRadius: 12,
                    fontFamily: "var(--font-sans)",
                    fontSize: 12,
                    boxShadow: "0 12px 28px -12px hsl(168 50% 14% / 0.25)",
                  }}
                  labelStyle={{ color: C.emerald, fontWeight: 600 }}
                />
                <Bar dataKey="count" fill="url(#bar-emerald)" radius={[8, 8, 0, 0]} name="Pembayaran" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie / status */}
        <div className="lg:col-span-2 relative rounded-3xl border bg-card p-6 md:p-7 overflow-hidden" style={{ borderColor: C.taupe }}>
          <div className="flex items-start justify-between mb-4 relative">
            <div>
              <p className="text-[11px] tracking-[0.22em] uppercase font-semibold text-[hsl(38_55%_46%)]">Distribusi</p>
              <h3 className="font-display italic text-2xl text-foreground mt-1">Status Kelulusan</h3>
            </div>
            <span className="text-[hsl(38_55%_56%)] text-lg">۞</span>
          </div>

          {pieData.length > 0 ? (
            <>
              <div className="h-44 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={78}
                      paddingAngle={3}
                      dataKey="value"
                      stroke={C.cream}
                      strokeWidth={3}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: C.cream,
                        border: `1px solid ${C.taupe}`,
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="font-display text-3xl text-foreground leading-none">{pieData.reduce((s, d) => s + d.value, 0)}</span>
                  <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mt-0.5">Total</span>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {pieData.map(d => {
                  const total = pieData.reduce((s, x) => s + x.value, 0);
                  const pct = Math.round((d.value / total) * 100);
                  return (
                    <div key={d.name} className="flex items-center gap-3 text-sm">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                      <span className="flex-1 text-foreground/80">{d.name}</span>
                      <span className="text-muted-foreground tabular-nums">{d.value}</span>
                      <span className="font-display text-base tabular-nums" style={{ color: d.color }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="h-44 flex flex-col items-center justify-center text-center">
              <span className="text-[hsl(38_55%_56%)] text-3xl mb-2">۞</span>
              <p className="text-sm text-muted-foreground italic font-display">Belum ada data penilaian</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
