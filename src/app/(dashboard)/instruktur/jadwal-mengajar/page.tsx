"use client";

import { useAuth } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
import { Calendar, MapPin, Clock, User } from "lucide-react";
import type { Schedule, User as UserType } from "@shared/schema";

export default function JadwalMengajar() {
  const { user } = useAuth();

  const { data: schedules, isLoading } = useQuery<Schedule[]>({
    queryKey: ["/api/schedules", `?instructorId=${user?.id}`],
  });

  const { data: students } = useQuery<Omit<UserType, "password">[]>({
    queryKey: ["/api/users", "?role=mahasiswa"],
  });

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl bg-gray-100" />)}
      </div>
    );
  }

  if (!schedules || schedules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
        <Calendar className="w-16 h-16 mb-4" style={{ color: "#ccc" }} />
        <h3 className="text-lg font-semibold mb-2" style={{ color: "#1A1A1A" }}>Belum Ada Jadwal</h3>
        <p className="text-sm" style={{ color: "#888" }}>Jadwal mengajar belum tersedia</p>
      </div>
    );
  }

  const sorted = [...schedules].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {sorted.map(schedule => {
        const student = students?.find(s => s.id === schedule.studentId);
        const schedDate = new Date(schedule.date);
        const isPast = schedDate < new Date();

        return (
          <div
            key={schedule.id}
            data-testid={`schedule-card-${schedule.id}`}
            className="rounded-2xl border p-5 transition-all duration-200"
            style={{
              background: isPast ? "#f8f6f0" : "#fff",
              borderColor: "#e8e4db",
              opacity: isPast ? 0.7 : 1,
            }}
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0" style={{ background: isPast ? "#e8e4db" : "#84B179" }}>
                <span className="text-lg font-bold" style={{ color: isPast ? "#888" : "#A2CB8B" }}>
                  {schedDate.getDate()}
                </span>
                <span className="text-[10px] font-medium uppercase" style={{ color: isPast ? "#aaa" : "#FAF7F0" }}>
                  {schedDate.toLocaleDateString("id-ID", { month: "short" })}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-4 h-4" style={{ color: "#84B179" }} />
                  <span className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>{student?.name || "Mahasiswa"}</span>
                </div>
                <div className="flex flex-wrap gap-4 mt-2">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" style={{ color: "#888" }} />
                    <span className="text-xs" style={{ color: "#888" }}>
                      {schedDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" style={{ color: "#888" }} />
                    <span className="text-xs" style={{ color: "#888" }}>{schedule.room} - {schedule.location}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
