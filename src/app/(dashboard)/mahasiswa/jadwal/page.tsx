"use client";

import { useAuth } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
import { Calendar, MapPin, Clock, User } from "lucide-react";
import type { Schedule, User as UserType } from "@shared/schema";

export default function JadwalSaya() {
  const { user } = useAuth();

  const { data: schedules, isLoading } = useQuery<Schedule[]>({
    queryKey: ["/api/schedules", `?studentId=${user?.id}`],
  });

  const { data: allUsers } = useQuery<Omit<UserType, "password">[]>({
    queryKey: ["/api/users", "?role=instruktur"],
  });

  // Ambil jadwal mendatang yang masih aktif (belum selesai, belum dibatalkan, dan belum lewat);
  // fallback ke yang paling baru bila tidak ada.
  const now = Date.now();
  const sorted = (schedules ?? [])
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const schedule =
    sorted.find((s: any) => {
      const active = !s.status || s.status === "scheduled";
      return active && new Date(s.date).getTime() >= now;
    }) ?? sorted[sorted.length - 1];

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-64 rounded-2xl bg-gray-100" />
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ background: "#E0E7FF" }}>
          <Calendar className="w-10 h-10 text-indigo-600" />
        </div>
        <h3 className="text-lg font-semibold mb-2" style={{ color: "#1A1A1A" }}>Menunggu Jadwal</h3>
        <p className="text-sm text-center max-w-md" style={{ color: "#888" }}>
          Admin akan menjadwalkan sesi mengaji Anda. Mohon ditunggu — Anda akan
          mendapat notifikasi begitu jadwal tersedia.
        </p>
      </div>
    );
  }

  const instructor = allUsers?.find(u => u.id === schedule.instructorId);
  const schedDate = new Date(schedule.date);
  const diffMs = schedDate.getTime() - now;
  const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  const diffHours = Math.max(0, Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="rounded-2xl border p-6 md:p-8" style={{ background: "#fff", borderColor: "#e8e4db" }}>
        <h3 className="text-lg font-semibold mb-6" style={{ color: "#1A1A1A" }}>Jadwal Sesi Mengaji</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl p-5" style={{ background: "linear-gradient(135deg, #84B179 0%, #A2CB8B 100%)" }}>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-white/80" />
              <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>Tanggal & Waktu</span>
            </div>
            <p className="text-2xl font-bold font-serif" style={{ color: "#fff" }}>
              {schedDate.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
            <p className="text-lg mt-1" style={{ color: "rgba(255,255,255,0.85)" }}>
              {schedDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: "#faf8f3" }}>
              <MapPin className="w-5 h-5" style={{ color: "#84B179" }} />
              <div>
                <p className="text-xs font-medium" style={{ color: "#888" }}>Lokasi</p>
                <p className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>{schedule.room} - {schedule.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: "#faf8f3" }}>
              <User className="w-5 h-5" style={{ color: "#84B179" }} />
              <div>
                <p className="text-xs font-medium" style={{ color: "#888" }}>Instruktur</p>
                <p className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>{instructor?.name || "Belum ditentukan"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {diffMs > 0 && (
        <div className="rounded-2xl border p-6" style={{ background: "#fff", borderColor: "#e8e4db" }}>
          <h3 className="text-base font-semibold mb-4" style={{ color: "#1A1A1A" }}>Hitung Mundur</h3>
          <div className="flex gap-4">
            <div className="flex-1 rounded-xl p-4 text-center" style={{ background: "#faf8f3" }}>
              <p className="text-3xl font-bold" style={{ color: "#84B179" }}>{diffDays}</p>
              <p className="text-xs font-medium mt-1" style={{ color: "#888" }}>Hari</p>
            </div>
            <div className="flex-1 rounded-xl p-4 text-center" style={{ background: "#faf8f3" }}>
              <p className="text-3xl font-bold" style={{ color: "#84B179" }}>{diffHours}</p>
              <p className="text-xs font-medium mt-1" style={{ color: "#888" }}>Jam</p>
            </div>
          </div>
        </div>
      )}

      {sorted.length > 1 && (
        <div className="rounded-2xl border p-6" style={{ background: "#fff", borderColor: "#e8e4db" }}>
          <h3 className="text-base font-semibold mb-4" style={{ color: "#1A1A1A" }}>Semua Jadwal Sesi</h3>
          <ul className="space-y-2">
            {sorted.map((s: any) => {
              const d = new Date(s.date);
              const past = d.getTime() < now;
              const status = s.status as "scheduled" | "completed" | "no_show" | "cancelled" | undefined;
              const isRepeat = !!s.isRepeat;
              let badgeBg = past ? "#E5E7EB" : "#D1FAE5";
              let badgeColor = past ? "#6B7280" : "#059669";
              let badgeText = past ? "Lewat" : "Mendatang";
              if (status === "completed") { badgeBg = "#D1FAE5"; badgeColor = "#059669"; badgeText = "Selesai"; }
              else if (status === "no_show") { badgeBg = "#FEE2E2"; badgeColor = "#991B1B"; badgeText = "Tidak Hadir"; }
              else if (status === "cancelled") { badgeBg = "#E5E7EB"; badgeColor = "#6B7280"; badgeText = "Dibatalkan"; }
              return (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-3 rounded-xl px-4 py-3"
                  style={{ background: "#faf8f3", opacity: past && status !== "completed" && status !== "no_show" ? 0.65 : 1 }}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium flex items-center gap-2" style={{ color: "#1A1A1A" }}>
                      {d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                      {isRepeat && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full" style={{ background: "#FEF3C7", color: "#92400E" }}>
                          Ulangan
                        </span>
                      )}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#888" }}>
                      {d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB · {s.room}
                      {s.location ? ` · ${s.location}` : ""}
                    </p>
                  </div>
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full shrink-0"
                    style={{ background: badgeBg, color: badgeColor }}
                  >
                    {badgeText}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
