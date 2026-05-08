"use client";

import { useAuth } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
import { ScoreCard } from "@/components/score-card";
import { Users, CheckCircle, Clock, Calendar, MapPin, BookOpen } from "lucide-react";
import type { Schedule, Assessment, User } from "@shared/schema";

const C = {
  emerald: "hsl(168 50% 22%)",
  emeraldSoft: "hsl(168 38% 42%)",
  gold: "hsl(38 55% 56%)",
  goldDeep: "hsl(38 55% 40%)",
  sage: "hsl(152 38% 42%)",
  cream: "hsl(44 45% 98%)",
  taupe: "hsl(40 22% 88%)",
  muted: "hsl(168 14% 50%)",
};

export default function InstrukturDashboard() {
  const { user } = useAuth();

  const { data: schedules, isLoading: isLoadingSchedules } = useQuery<Schedule[]>({
    queryKey: ["/api/schedules", `?instructorId=${user?.id}`],
  });

  const { data: assessments, isLoading: isLoadingAssessments } = useQuery<Assessment[]>({
    queryKey: ["/api/assessments", `?instructorId=${user?.id}`],
  });

  const { data: allStudents, isLoading: isLoadingStudents } = useQuery<Omit<User, "password">[]>({
    queryKey: ["/api/users", "?role=mahasiswa"],
  });

  const isLoading = isLoadingSchedules || isLoadingAssessments || isLoadingStudents;

  const totalAssigned = schedules?.length || 0;
  const tested = assessments?.length || 0;
  const passed = assessments?.filter(a => a.passed).length || 0;
  const notTested = Math.max(0, totalAssigned - tested);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todaySchedules = schedules?.filter(s => {
    const d = new Date(s.date);
    return d >= today && d < tomorrow;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) || [];

  const upcoming = schedules?.filter(s => new Date(s.date) >= tomorrow)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3) || [];

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse rounded-3xl h-44" style={{ background: "hsl(40 22% 90%)" }} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl h-32" style={{ background: "hsl(40 22% 90%)" }} />
          ))}
        </div>
        <div className="animate-pulse rounded-3xl h-64" style={{ background: "hsl(40 22% 90%)" }} />
      </div>
    );
  }

  const hour = new Date().getHours();
  const salam = hour < 11 ? "Selamat pagi" : hour < 15 ? "Selamat siang" : hour < 18 ? "Selamat sore" : "Selamat malam";
  const todayLabel = new Date().toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="space-y-8 animate-ascend">
      {/* === Hero === */}
      <section
        className="relative rounded-3xl p-6 md:p-9 overflow-hidden border"
        style={{
          background:
            "radial-gradient(ellipse 50% 70% at 0% 0%, hsl(38 60% 60% / 0.18), transparent 60%)," +
            "radial-gradient(ellipse 80% 70% at 100% 100%, hsl(172 55% 14% / 0.95), transparent 70%)," +
            "linear-gradient(135deg, hsl(168 50% 18%) 0%, hsl(172 55% 14%) 60%, hsl(180 60% 10%) 100%)",
          borderColor: "hsl(168 30% 18%)",
        }}
      >
        <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="ins-pat" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <g fill="none" stroke="#E8D5A8" strokeWidth="0.5">
                <path d="M50 8 L72 30 L92 50 L72 70 L50 92 L28 70 L8 50 L28 30 Z" />
                <path d="M50 8 L72 30 L92 50 L72 70 L50 92 L28 70 L8 50 L28 30 Z" transform="rotate(45 50 50)" />
                <circle cx="50" cy="50" r="3" />
              </g>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#ins-pat)" />
        </svg>

        {/* mihrab silhouette */}
        <svg
          className="absolute -right-12 -bottom-16 w-72 h-72 opacity-[0.08]"
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
            {user?.specialization && (
              <div className="flex items-center gap-2 mt-3 text-sm text-white/65">
                <BookOpen className="w-4 h-4 text-[hsl(38_60%_72%)]" />
                <span>{user.specialization}</span>
              </div>
            )}
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-white/70 italic font-display">
              "Sebaik-baik kalian adalah yang mempelajari Al-Qur'an dan mengajarkannya."
              <span className="block text-xs not-italic font-sans tracking-wide text-white/45 mt-1">
                — HR. Bukhari
              </span>
            </p>
          </div>

          <div className="text-right">
            <p
              className="font-arabic text-2xl text-[hsl(42_45%_94%)] leading-relaxed"
              dir="rtl"
            >
              ٱلسَّلَامُ عَلَيْكُمْ
            </p>
            <p className="text-[11px] text-[hsl(38_55%_75%)]/60 mt-2 tracking-wider">
              {todayLabel}
            </p>
          </div>
        </div>
      </section>

      {/* === Stat cards === */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ScoreCard title="Mahasiswa Diampu" value={totalAssigned} icon={<Users className="w-5 h-5" />} color={C.emerald} accent={C.emeraldSoft} />
        <ScoreCard title="Sudah Dinilai" value={tested} icon={<CheckCircle className="w-5 h-5" />} color={C.emerald} accent={C.gold} />
        <ScoreCard title="Lulus" value={passed} icon={<CheckCircle className="w-5 h-5" />} color={C.sage} accent={C.sage} />
        <ScoreCard title="Belum Dinilai" value={notTested} icon={<Clock className="w-5 h-5" />} color={C.goldDeep} accent={C.gold} />
      </div>

      {/* === Today's schedule === */}
      <section
        className="relative rounded-3xl border bg-card p-6 md:p-8 overflow-hidden"
        style={{ borderColor: C.taupe }}
      >
        <svg className="absolute -top-6 -right-6 w-32 h-32 opacity-[0.05]" viewBox="0 0 100 100" fill="none" stroke={C.emerald} strokeWidth="0.6">
          <path d="M50 5 L70 30 L95 50 L70 70 L50 95 L30 70 L5 50 L30 30 Z" />
          <path d="M50 5 L70 30 L95 50 L70 70 L50 95 L30 70 L5 50 L30 30 Z" transform="rotate(45 50 50)" />
          <circle cx="50" cy="50" r="3" fill={C.emerald} />
        </svg>

        <div className="flex items-center justify-between mb-6 relative">
          <div>
            <p className="text-[11px] tracking-[0.22em] uppercase font-semibold text-[hsl(38_55%_46%)]">Agenda</p>
            <h3 className="font-display italic text-2xl text-foreground mt-1">Jadwal Hari Ini</h3>
          </div>
          <span
            className="text-xs font-medium px-3 py-1.5 rounded-full"
            style={{ background: `${C.gold}1f`, color: C.goldDeep }}
          >
            {todaySchedules.length} sesi
          </span>
        </div>

        {todaySchedules.length === 0 ? (
          <div className="text-center py-12 relative">
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
              style={{ background: `${C.gold}14`, color: C.goldDeep, border: `1px solid ${C.gold}33` }}
            >
              <Calendar className="w-7 h-7" />
            </div>
            <p className="font-display italic text-lg text-foreground">Tidak ada jadwal hari ini</p>
            <p className="text-sm text-muted-foreground mt-1">Manfaatkan waktu untuk muraja'ah & persiapan.</p>
          </div>
        ) : (
          <div className="space-y-3 relative">
            {todaySchedules.map((s, idx) => {
              const student = allStudents?.find(st => st.id === s.studentId);
              const time = new Date(s.date).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
              return (
                <div
                  key={s.id}
                  className="group flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                  style={{
                    background: "hsl(42 38% 96%)",
                    borderColor: C.taupe,
                    animationDelay: `${idx * 80}ms`,
                  }}
                >
                  {/* Time block */}
                  <div className="flex flex-col items-center justify-center min-w-[64px] py-1.5 rounded-xl border" style={{ borderColor: `${C.gold}55`, background: `${C.gold}14` }}>
                    <span className="font-display text-xl leading-none" style={{ color: C.emerald }}>{time.split(":")[0]}</span>
                    <span className="text-[10px] tracking-widest text-muted-foreground mt-0.5">:{time.split(":")[1]}</span>
                  </div>

                  {/* Avatar */}
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold border-2 flex-shrink-0"
                    style={{ background: C.emerald, color: C.cream, borderColor: `${C.gold}66` }}
                  >
                    {student?.name?.charAt(0) || "?"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{student?.name || "Mahasiswa"}</p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{s.room} · {s.location}</span>
                    </div>
                  </div>

                  <span className="text-[hsl(38_55%_56%)] text-base opacity-0 group-hover:opacity-100 transition-opacity">۞</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Upcoming preview */}
        {upcoming.length > 0 && (
          <>
            <div className="ornament-divider mt-8 mb-5">
              <span className="text-[hsl(38_55%_56%)] text-sm">۞</span>
            </div>
            <div>
              <p className="text-[11px] tracking-[0.22em] uppercase font-semibold text-muted-foreground mb-3">
                Yang akan datang
              </p>
              <div className="grid sm:grid-cols-3 gap-3">
                {upcoming.map(s => {
                  const student = allStudents?.find(st => st.id === s.studentId);
                  const d = new Date(s.date);
                  return (
                    <div
                      key={s.id}
                      className="p-3 rounded-xl border text-sm"
                      style={{ background: C.cream, borderColor: C.taupe }}
                    >
                      <p className="font-semibold text-foreground truncate">{student?.name || "—"}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" })}
                        {" · "}
                        {d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
