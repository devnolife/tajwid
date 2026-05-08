"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
import { Calendar, MapPin, Clock, ClipboardList, CheckCircle2, History, ChevronRight } from "lucide-react";
import type { Schedule, User as UserType, Assessment } from "@shared/schema";
import { getMahasiswaPhotoUrl } from "@/lib/mahasiswa-photo";

const C = {
  emerald: "hsl(168 50% 22%)",
  emeraldDeep: "hsl(172 55% 14%)",
  emeraldSoft: "hsl(168 38% 42%)",
  gold: "hsl(38 55% 56%)",
  goldDeep: "hsl(38 55% 40%)",
  goldSoft: "hsl(38 60% 75%)",
  sage: "hsl(152 38% 42%)",
  cream: "hsl(44 45% 98%)",
  taupe: "hsl(40 22% 88%)",
  bgSoft: "hsl(42 38% 96%)",
  muted: "hsl(168 14% 50%)",
};

type Filter = "semua" | "hari-ini" | "akan-datang" | "selesai";

export default function JadwalUjianMengaji() {
  const router = useRouter();
  const { user } = useAuth();
  const [filter, setFilter] = useState<Filter>("semua");

  const { data: schedules, isLoading } = useQuery<Schedule[]>({
    queryKey: ["/api/schedules", `?instructorId=${user?.id}`],
  });

  const { data: students } = useQuery<Omit<UserType, "password">[]>({
    queryKey: ["/api/users", "?role=mahasiswa"],
  });

  const { data: assessments } = useQuery<Assessment[]>({
    queryKey: ["/api/assessments", `?instructorId=${user?.id}`],
  });

  const now = new Date();
  const startToday = new Date(now); startToday.setHours(0, 0, 0, 0);
  const startTomorrow = new Date(startToday); startTomorrow.setDate(startTomorrow.getDate() + 1);

  const list = useMemo(() => {
    const all = (schedules ?? [])
      .map((s) => ({ ...s, _date: new Date(s.date) }))
      .sort((a, b) => a._date.getTime() - b._date.getTime());

    switch (filter) {
      case "hari-ini":
        return all.filter((s) => s._date >= startToday && s._date < startTomorrow);
      case "akan-datang":
        return all.filter((s) => s._date >= startTomorrow);
      case "selesai":
        return all.filter((s) => s._date < startToday);
      default:
        return all;
    }
  }, [schedules, filter]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof list>();
    list.forEach((s) => {
      const key = s._date.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
      if (!map.has(key)) map.set(key, [] as any);
      (map.get(key) as any).push(s);
    });
    return Array.from(map.entries());
  }, [list]);

  const stats = useMemo(() => {
    const all = schedules ?? [];
    const today = all.filter((s) => {
      const d = new Date(s.date); return d >= startToday && d < startTomorrow;
    }).length;
    const upcoming = all.filter((s) => new Date(s.date) >= startTomorrow).length;
    const past = all.filter((s) => new Date(s.date) < startToday).length;
    return { total: all.length, today, upcoming, past };
  }, [schedules]);

  const isAssessed = (studentId: string) => assessments?.some((a) => a.studentId === studentId);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 rounded-3xl" style={{ background: "hsl(40 22% 90%)" }} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl" style={{ background: "hsl(40 22% 90%)" }} />
          ))}
        </div>
        {[1, 2, 3].map((i) => <div key={i} className="h-28 rounded-2xl" style={{ background: "hsl(40 22% 90%)" }} />)}
      </div>
    );
  }

  return (
    <div className="space-y-7 animate-in fade-in duration-500">
      {/* === Hero compact === */}
      <section
        className="relative rounded-3xl p-6 md:p-7 overflow-hidden border"
        style={{
          background:
            "radial-gradient(ellipse 60% 80% at 100% 0%, hsl(38 60% 60% / 0.18), transparent 60%)," +
            "linear-gradient(135deg, hsl(168 50% 18%) 0%, hsl(172 55% 14%) 100%)",
          borderColor: "hsl(168 30% 18%)",
        }}
      >
        <svg className="absolute -right-8 -bottom-12 w-56 h-56 opacity-[0.08]" viewBox="0 0 200 200" fill="none" stroke="#E8D5A8" strokeWidth="0.5">
          <path d="M100 10 C160 10 180 70 180 130 L180 195 L20 195 L20 130 C20 70 40 10 100 10 Z" />
          <path d="M100 30 C145 30 160 80 160 130 L160 175 L40 175 L40 130 C40 80 55 30 100 30 Z" />
        </svg>
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] tracking-[0.28em] uppercase font-semibold text-[hsl(38_85%_88%)]">Penjadwalan</p>
            <h1 className="font-display italic text-3xl md:text-4xl mt-2 text-white leading-tight">Jadwal Ujian Mengaji</h1>
            <p className="mt-2 text-sm text-white/65 max-w-md">
              Daftar mahasiswa yang dijadwalkan untuk diuji bacaan Al-Qur'an oleh Anda.
            </p>
          </div>
          <div className="text-right">
            <p className="font-arabic text-2xl text-[hsl(42_45%_94%)]" dir="rtl">إِنَّ مَعَ الْعُسْرِ يُسْرًا</p>
            <p className="text-[11px] text-[hsl(38_55%_75%)]/60 mt-1 tracking-wider">QS. Al-Insyirah: 6</p>
          </div>
        </div>
      </section>

      {/* === Stat strip === */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, icon: ClipboardList, color: C.emerald, bg: `${C.emerald}10` },
          { label: "Hari Ini", value: stats.today, icon: Calendar, color: C.goldDeep, bg: `${C.gold}1f` },
          { label: "Akan Datang", value: stats.upcoming, icon: Clock, color: C.emeraldSoft, bg: `${C.emeraldSoft}18` },
          { label: "Selesai", value: stats.past, icon: CheckCircle2, color: C.sage, bg: `${C.sage}18` },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-2xl border p-4 flex items-center gap-3" style={{ background: "#fff", borderColor: C.taupe }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.bg, color: s.color }}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] tracking-[0.18em] uppercase text-muted-foreground font-semibold">{s.label}</p>
                <p className="text-xl font-bold leading-tight" style={{ color: s.color }}>{s.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* === Filter chips === */}
      <div className="flex flex-wrap gap-2">
        {([
          { id: "semua", label: "Semua" },
          { id: "hari-ini", label: "Hari Ini" },
          { id: "akan-datang", label: "Akan Datang" },
          { id: "selesai", label: "Selesai" },
        ] as { id: Filter; label: string }[]).map((f) => {
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className="px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all border"
              style={{
                background: active ? C.emerald : "#fff",
                color: active ? C.cream : C.emerald,
                borderColor: active ? C.emerald : C.taupe,
                boxShadow: active ? "0 4px 12px hsl(168 50% 22% / 0.15)" : "none",
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* === Empty === */}
      {list.length === 0 && (
        <div
          className="relative rounded-3xl border p-14 text-center overflow-hidden"
          style={{ background: C.bgSoft, borderColor: C.taupe }}
        >
          <svg className="absolute -top-4 -right-4 w-32 h-32 opacity-[0.06]" viewBox="0 0 100 100" fill="none" stroke={C.emerald} strokeWidth="0.6">
            <path d="M50 5 L70 30 L95 50 L70 70 L50 95 L30 70 L5 50 L30 30 Z" />
          </svg>
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: `${C.gold}14`, color: C.goldDeep, border: `1px solid ${C.gold}33` }}
          >
            <Calendar className="w-7 h-7" />
          </div>
          <p className="font-display italic text-xl text-foreground">Belum ada jadwal</p>
          <p className="text-sm text-muted-foreground mt-1">
            {filter === "semua" ? "Belum ada jadwal pengujian yang ditugaskan." : "Tidak ada jadwal pada filter ini."}
          </p>
        </div>
      )}

      {/* === Grouped by date === */}
      {grouped.map(([dateLabel, items]) => (
        <section key={dateLabel}>
          <div className="flex items-center gap-3 mb-4 px-1">
            <span className="text-[hsl(38_55%_56%)] text-base">۞</span>
            <h3 className="font-display italic text-lg text-foreground">{dateLabel}</h3>
            <div className="flex-1 h-px" style={{ background: C.taupe }} />
            <span className="text-[11px] tracking-widest uppercase text-muted-foreground font-semibold">{items.length} sesi</span>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {items.map((s, idx) => {
              const student = students?.find((st) => st.id === s.studentId);
              const time = s._date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
              const isPast = s._date < now;
              const done = isAssessed(s.studentId);

              return (
                <button
                  key={s.id}
                  onClick={() => router.push(`/instruktur/penilaian?studentId=${s.studentId}`)}
                  data-testid={`schedule-card-${s.id}`}
                  className="group relative text-left rounded-2xl border p-4 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 overflow-hidden"
                  style={{
                    background: isPast ? C.bgSoft : "#fff",
                    borderColor: done ? `${C.sage}55` : C.taupe,
                    animationDelay: `${idx * 60}ms`,
                  }}
                >
                  {done && (
                    <span
                      className="absolute top-3 right-3 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{ background: `${C.sage}22`, color: C.sage }}
                    >
                      <CheckCircle2 className="w-3 h-3" /> Sudah Dinilai
                    </span>
                  )}

                  <div className="flex items-start gap-4">
                    {/* time block */}
                    <div
                      className="flex flex-col items-center justify-center min-w-[64px] py-2 rounded-xl border flex-shrink-0"
                      style={{ borderColor: `${C.gold}55`, background: `${C.gold}14` }}
                    >
                      <span className="font-display text-xl leading-none" style={{ color: C.emerald }}>{time.split(":")[0]}</span>
                      <span className="text-[10px] tracking-widest text-muted-foreground mt-1">:{time.split(":")[1]}</span>
                    </div>

                    {/* avatar */}
                    {student?.nim ? (
                      <img
                        src={getMahasiswaPhotoUrl(student.nim)}
                        alt={student.name}
                        className="w-12 h-12 rounded-full object-cover border-2 flex-shrink-0"
                        style={{ borderColor: `${C.gold}66` }}
                        onError={(e) => {
                          const t = e.target as HTMLImageElement;
                          t.outerHTML = `<div class="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold border-2 flex-shrink-0" style="background:${C.emerald};color:${C.cream};border-color:${C.gold}66">${student?.name?.charAt(0) ?? "?"}</div>`;
                        }}
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold border-2 flex-shrink-0"
                        style={{ background: C.emerald, color: C.cream, borderColor: `${C.gold}66` }}
                      >
                        {student?.name?.charAt(0) ?? "?"}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{student?.name ?? "Mahasiswa"}</p>
                      {student?.nim && (
                        <p className="text-[11px] font-mono mt-0.5" style={{ color: C.emeraldSoft }}>NIM {student.nim}</p>
                      )}
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1.5">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{s.room} · {s.location}</span>
                      </div>
                    </div>

                    <ChevronRight
                      className="w-5 h-5 flex-shrink-0 self-center text-muted-foreground transition-transform group-hover:translate-x-1"
                      style={{ color: C.emerald }}
                    />
                  </div>

                  {!done && !isPast && (
                    <div className="mt-3 pt-3 border-t flex items-center justify-between" style={{ borderColor: `${C.taupe}88` }}>
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: C.goldDeep }}>
                        <ClipboardList className="w-3.5 h-3.5" />
                        Tap untuk mulai menguji
                      </span>
                    </div>
                  )}
                  {isPast && !done && (
                    <div className="mt-3 pt-3 border-t flex items-center gap-1.5" style={{ borderColor: `${C.taupe}88` }}>
                      <History className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-[11px] text-muted-foreground">Sesi telah lewat — masih dapat dinilai</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
