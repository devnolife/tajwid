"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, Users, CheckCircle2, XCircle, Clock, ChevronRight, LayoutGrid, List as ListIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getMahasiswaPhotoUrl } from "@/lib/mahasiswa-photo";
import type { User, Assessment, Schedule } from "@shared/schema";

const C = {
  emerald: "hsl(168 50% 22%)",
  emeraldSoft: "hsl(168 38% 42%)",
  gold: "hsl(38 55% 56%)",
  goldDeep: "hsl(38 55% 40%)",
  sage: "hsl(152 38% 42%)",
  cream: "hsl(44 45% 98%)",
  taupe: "hsl(40 22% 88%)",
  bgSoft: "hsl(42 38% 96%)",
  rose: "hsl(0 65% 55%)",
};

type StatusKey = "lulus" | "perlu_mengulang" | "belum_tes";

const statusMeta: Record<StatusKey, { label: string; bg: string; color: string }> = {
  lulus: { label: "Lulus", bg: `${C.sage}22`, color: C.sage },
  perlu_mengulang: { label: "Perlu Mengulang", bg: `${C.gold}1f`, color: C.goldDeep },
  belum_tes: { label: "Belum Diuji", bg: `${C.gold}1f`, color: C.goldDeep },
};

export default function DaftarMahasiswa() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"semua" | StatusKey>("semua");
  const [view, setView] = useState<"grid" | "table">("grid");

  const { data: students, isLoading } = useQuery<Omit<User, "password">[]>({
    queryKey: ["/api/users", "?role=mahasiswa"],
  });

  const { data: allAssessments } = useQuery<Assessment[]>({ queryKey: ["/api/assessments"] });
  const { data: allSchedules } = useQuery<Schedule[]>({ queryKey: ["/api/schedules"] });

  const getStudentStatus = (studentId: string): StatusKey => {
    const a = allAssessments?.find((x) => x.studentId === studentId);
    if (a) return a.passed ? "lulus" : "perlu_mengulang";
    return "belum_tes";
  };
  const getAssessment = (studentId: string) => allAssessments?.find((a) => a.studentId === studentId);
  const getNextSchedule = (studentId: string) => {
    const upcoming = allSchedules
      ?.filter((s) => s.studentId === studentId && s.status === "scheduled")
      .map((s) => ({ ...s, _d: new Date(s.date) }))
      .sort((a, b) => a._d.getTime() - b._d.getTime());
    return upcoming?.[0];
  };

  const filtered = useMemo(() => {
    return (students ?? []).filter((s) => {
      const q = search.toLowerCase();
      const matchSearch = !q || s.name.toLowerCase().includes(q) || (s.nim ?? "").toLowerCase().includes(q);
      if (!matchSearch) return false;
      if (statusFilter === "semua") return true;
      return getStudentStatus(s.id) === statusFilter;
    });
  }, [students, search, statusFilter, allAssessments]);

  const stats = useMemo(() => {
    const all = students ?? [];
    return {
      total: all.length,
      lulus: all.filter((s) => getStudentStatus(s.id) === "lulus").length,
      belum: all.filter((s) => getStudentStatus(s.id) === "belum_tes").length,
      perluMengulang: all.filter((s) => getStudentStatus(s.id) === "perlu_mengulang").length,
    };
  }, [students, allAssessments]);

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
        <svg className="absolute -right-10 -bottom-12 w-56 h-56 opacity-[0.08]" viewBox="0 0 100 100" fill="none" stroke="#E8D5A8" strokeWidth="0.5">
          <path d="M50 5 L70 30 L95 50 L70 70 L50 95 L30 70 L5 50 L30 30 Z" />
          <path d="M50 5 L70 30 L95 50 L70 70 L50 95 L30 70 L5 50 L30 30 Z" transform="rotate(45 50 50)" />
        </svg>
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] tracking-[0.28em] uppercase font-semibold text-[hsl(38_85%_88%)]">Mahasiswa Bimbingan</p>
            <h1 className="font-display italic text-3xl md:text-4xl mt-2 text-white leading-tight">Daftar Mahasiswa</h1>
            <p className="mt-2 text-sm text-white/65 max-w-md">
              Pilih mahasiswa untuk memulai pengujian tajwid dan kelancaran membaca Al-Qur'an.
            </p>
          </div>
          <div className="hidden md:block text-right">
            <p className="font-display italic text-5xl text-[hsl(38_65%_85%)]">{stats.total}</p>
            <p className="text-[11px] tracking-[0.18em] uppercase text-white/55 mt-1">total mahasiswa</p>
          </div>
        </div>
      </section>

      {/* === Stat strip === */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, icon: Users, color: C.emerald, bg: `${C.emerald}10` },
          { label: "Lulus", value: stats.lulus, icon: CheckCircle2, color: C.sage, bg: `${C.sage}1c` },
          { label: "Belum Diuji", value: stats.belum, icon: Clock, color: C.goldDeep, bg: `${C.gold}1f` },
          { label: "Perlu Mengulang", value: stats.perluMengulang, icon: XCircle, color: C.goldDeep, bg: `${C.gold}1a` },
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

      {/* === Toolbar === */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: C.emeraldSoft }} />
          <Input
            data-testid="input-search-student"
            placeholder="Cari nama atau NIM mahasiswa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 rounded-xl"
            style={{ background: "#fff", borderColor: C.taupe }}
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <SelectTrigger className="w-full lg:w-52 h-11 rounded-xl" style={{ background: "#fff", borderColor: C.taupe }}>
            <Filter className="w-4 h-4 mr-2" style={{ color: C.emeraldSoft }} />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua Status</SelectItem>
            <SelectItem value="belum_tes">Belum Diuji</SelectItem>
            <SelectItem value="lulus">Lulus</SelectItem>
            <SelectItem value="perlu_mengulang">Perlu Mengulang</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex rounded-xl border overflow-hidden" style={{ borderColor: C.taupe, background: "#fff" }}>
          {([
            { id: "grid", icon: LayoutGrid, label: "Kartu" },
            { id: "table", icon: ListIcon, label: "Tabel" },
          ] as const).map(({ id, icon: Icon, label }) => {
            const active = view === id;
            return (
              <button
                key={id}
                onClick={() => setView(id)}
                title={label}
                className="px-3.5 h-11 flex items-center gap-2 text-xs font-semibold transition-colors"
                style={{
                  background: active ? C.emerald : "transparent",
                  color: active ? C.cream : C.emerald,
                }}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* === Loading === */}
      {isLoading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 rounded-2xl animate-pulse" style={{ background: "hsl(40 22% 90%)" }} />
          ))}
        </div>
      )}

      {/* === Empty === */}
      {!isLoading && filtered.length === 0 && (
        <div
          className="relative rounded-3xl border p-14 text-center overflow-hidden"
          style={{ background: C.bgSoft, borderColor: C.taupe }}
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: `${C.gold}14`, color: C.goldDeep, border: `1px solid ${C.gold}33` }}>
            <Users className="w-7 h-7" />
          </div>
          <p className="font-display italic text-xl text-foreground">Mahasiswa tidak ditemukan</p>
          <p className="text-sm text-muted-foreground mt-1">Coba ubah kata kunci atau filter.</p>
        </div>
      )}

      {/* === Grid view === */}
      {!isLoading && filtered.length > 0 && view === "grid" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s, idx) => {
            const status = getStudentStatus(s.id);
            const a = getAssessment(s.id);
            const next = getNextSchedule(s.id);
            const sm = statusMeta[status];

            return (
              <button
                key={s.id}
                data-testid={`card-student-${s.id}`}
                onClick={() => router.push(next
                  ? `/instruktur/penilaian?studentId=${s.id}&scheduleId=${next.id}`
                  : `/instruktur/jadwal-mengajar?createFor=${s.id}`)}
                className="group relative text-left rounded-2xl border p-5 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 overflow-hidden"
                style={{
                  background: "#fff",
                  borderColor: C.taupe,
                  animationDelay: `${idx * 50}ms`,
                }}
              >
                {/* corner ornament */}
                <span className="absolute top-3 right-3 text-[hsl(38_55%_56%)] text-sm opacity-0 group-hover:opacity-100 transition-opacity">۞</span>

                <div className="flex items-start gap-3">
                  {s.nim ? (
                    <img
                      src={getMahasiswaPhotoUrl(s.nim)}
                      alt={s.name}
                      className="w-14 h-14 rounded-2xl object-cover border-2 flex-shrink-0"
                      style={{ borderColor: `${C.gold}55` }}
                      onError={(e) => {
                        const t = e.target as HTMLImageElement;
                        t.outerHTML = `<div class="w-14 h-14 rounded-2xl flex items-center justify-center text-base font-bold border-2 flex-shrink-0" style="background:${C.emerald};color:${C.cream};border-color:${C.gold}55">${s.name.charAt(0)}</div>`;
                      }}
                    />
                  ) : (
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-base font-bold border-2 flex-shrink-0"
                      style={{ background: C.emerald, color: C.cream, borderColor: `${C.gold}55` }}
                    >
                      {s.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: C.emerald }}>{s.name}</p>
                    {s.nim && <p className="text-[11px] font-mono mt-0.5" style={{ color: C.emeraldSoft }}>NIM {s.nim}</p>}
                    {s.faculty && <p className="text-xs text-muted-foreground mt-0.5 truncate">{s.faculty}</p>}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-4">
                  <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full" style={{ background: sm.bg, color: sm.color }}>
                    {sm.label}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t flex items-center justify-between text-[11px]" style={{ borderColor: `${C.taupe}88` }}>
                  {a ? (
                    <span className="font-semibold" style={{ color: a.passed ? C.sage : C.goldDeep }}>
                      Skor: {a.totalScore}/100
                    </span>
                  ) : next ? (
                    <span className="text-muted-foreground">
                      Jadwal: {new Date(next.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    </span>
                  ) : (
                    <span className="text-muted-foreground italic">Belum dijadwalkan</span>
                  )}
                  <span className="inline-flex items-center gap-1 font-semibold" style={{ color: C.emerald }}>
                    {next ? (a ? "Uji sesi" : "Mulai uji") : "Buat jadwal"} <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* === Table view === */}
      {!isLoading && filtered.length > 0 && view === "table" && (
        <div className="rounded-2xl border overflow-hidden" style={{ background: "#fff", borderColor: C.taupe }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: C.bgSoft, borderBottom: `1px solid ${C.taupe}` }}>
                  <th className="text-left py-3 px-4 font-semibold text-[11px] uppercase tracking-wider" style={{ color: C.emeraldSoft }}>Mahasiswa</th>
                  <th className="text-left py-3 px-4 font-semibold text-[11px] uppercase tracking-wider" style={{ color: C.emeraldSoft }}>NIM</th>
                  <th className="text-left py-3 px-4 font-semibold text-[11px] uppercase tracking-wider" style={{ color: C.emeraldSoft }}>Fakultas</th>
                  <th className="text-left py-3 px-4 font-semibold text-[11px] uppercase tracking-wider" style={{ color: C.emeraldSoft }}>Status</th>
                  <th className="text-right py-3 px-4 font-semibold text-[11px] uppercase tracking-wider" style={{ color: C.emeraldSoft }}>Skor</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const status = getStudentStatus(s.id);
                  const a = getAssessment(s.id);
                  const next = getNextSchedule(s.id);
                  const sm = statusMeta[status];
                  return (
                    <tr
                      key={s.id}
                      data-testid={`row-student-${s.id}`}
                      onClick={() => router.push(next
                        ? `/instruktur/penilaian?studentId=${s.id}&scheduleId=${next.id}`
                        : `/instruktur/jadwal-mengajar?createFor=${s.id}`)}
                      className="cursor-pointer transition-colors hover:bg-[hsl(42_38%_94%)]"
                      style={{ borderBottom: `1px solid ${C.taupe}55` }}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {s.nim ? (
                            <img
                              src={getMahasiswaPhotoUrl(s.nim)}
                              alt={s.name}
                              className="w-9 h-9 rounded-full object-cover border"
                              style={{ borderColor: C.taupe }}
                              onError={(e) => {
                                const t = e.target as HTMLImageElement;
                                t.outerHTML = `<div class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold" style="background:${C.emerald};color:${C.cream}">${s.name.charAt(0)}</div>`;
                              }}
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: C.emerald, color: C.cream }}>
                              {s.name.charAt(0)}
                            </div>
                          )}
                          <span className="font-medium" style={{ color: C.emerald }}>{s.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs" style={{ color: C.emeraldSoft }}>{s.nim ?? "—"}</td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">{s.faculty ?? "—"}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full" style={{ background: sm.bg, color: sm.color }}>
                          {sm.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold tabular-nums" style={{ color: a ? (a.passed ? C.sage : C.goldDeep) : C.emeraldSoft }}>
                        {a ? `${a.totalScore}/100` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
