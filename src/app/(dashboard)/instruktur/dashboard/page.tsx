"use client";

import { useAuth } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
import { ScoreCard } from "@/components/score-card";
import { Users, CheckCircle, XCircle, Clock, Calendar } from "lucide-react";
import type { Schedule, Assessment, User } from "@shared/schema";

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
  const notTested = totalAssigned - tested;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todaySchedules = schedules?.filter(s => {
    const d = new Date(s.date);
    return d >= today && d < tomorrow;
  }) || [];

  if (isLoading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="animate-pulse bg-gray-100 rounded-2xl h-32" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-100 rounded-2xl h-28" />
          ))}
        </div>
        <div className="animate-pulse bg-gray-100 rounded-2xl h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="rounded-2xl p-6 md:p-8 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #84B179 0%, #A2CB8B 100%)" }}>
        <div className="relative z-10">
          <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.8)" }}>Assalamu'alaikum,</p>
          <h1 className="text-2xl md:text-3xl font-bold mt-1 font-serif text-white">{user?.name}</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.7)" }}>{user?.specialization}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ScoreCard title="Total Mahasiswa" value={totalAssigned} icon={<Users className="w-5 h-5" />} />
        <ScoreCard title="Sudah Dinilai" value={tested} icon={<CheckCircle className="w-5 h-5" />} color="#059669" />
        <ScoreCard title="Lulus" value={passed} icon={<CheckCircle className="w-5 h-5" />} color="#059669" accent="#059669" />
        <ScoreCard title="Belum Tes" value={notTested} icon={<Clock className="w-5 h-5" />} color="#D97706" accent="#D97706" />
      </div>

      <div className="rounded-2xl border p-6" style={{ background: "#fff", borderColor: "#e8e4db" }}>
        <h3 className="text-base font-semibold mb-4" style={{ color: "#1A1A1A" }}>Jadwal Hari Ini</h3>
        {todaySchedules.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-10 h-10 mx-auto mb-3" style={{ color: "#ccc" }} />
            <p className="text-sm" style={{ color: "#888" }}>Tidak ada jadwal hari ini</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todaySchedules.map(s => {
              const student = allStudents?.find(st => st.id === s.studentId);
              return (
                <div key={s.id} className="flex items-center gap-4 p-4 rounded-xl" style={{ background: "#faf8f3" }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: "#84B179", color: "#A2CB8B" }}>
                    {student?.name?.charAt(0) || "?"}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>{student?.name || "Mahasiswa"}</p>
                    <p className="text-xs" style={{ color: "#888" }}>{s.room} - {s.location}</p>
                  </div>
                  <p className="text-sm font-medium" style={{ color: "#84B179" }}>
                    {new Date(s.date).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
