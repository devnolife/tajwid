"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { StatusBadge } from "@/components/status-badge";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getMahasiswaPhotoUrl } from "@/lib/mahasiswa-photo";
import type { User, Payment, Assessment, Schedule } from "@shared/schema";

export default function DaftarMahasiswa() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("semua");

  const { data: students } = useQuery<Omit<User, "password">[]>({
    queryKey: ["/api/users", "?role=mahasiswa"],
  });

  const { data: allPayments } = useQuery<Payment[]>({
    queryKey: ["/api/payments"],
  });

  const { data: allAssessments } = useQuery<Assessment[]>({
    queryKey: ["/api/assessments"],
  });

  const { data: allSchedules } = useQuery<Schedule[]>({
    queryKey: ["/api/schedules"],
  });

  const getStudentStatus = (studentId: string) => {
    const assessment = allAssessments?.find(a => a.studentId === studentId);
    if (assessment) return assessment.passed ? "lulus" : "tidak_lulus";
    const schedule = allSchedules?.find(s => s.studentId === studentId);
    if (schedule) return "belum_tes";
    return "belum_tes";
  };

  const getPaymentStatus = (studentId: string) => {
    const payment = allPayments?.find(p => p.studentId === studentId);
    return payment?.status || "belum_bayar";
  };

  const filtered = students?.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.nim?.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (statusFilter === "semua") return true;
    return getStudentStatus(s.id) === statusFilter;
  }) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#888" }} />
          <Input
            data-testid="input-search-student"
            placeholder="Cari berdasarkan nama atau NIM..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 rounded-xl"
            style={{ background: "#fff", borderColor: "#e8e4db" }}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48 h-11 rounded-xl" style={{ background: "#fff", borderColor: "#e8e4db" }}>
            <Filter className="w-4 h-4 mr-2" style={{ color: "#888" }} />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua Status</SelectItem>
            <SelectItem value="belum_tes">Belum Tes</SelectItem>
            <SelectItem value="lulus">Lulus</SelectItem>
            <SelectItem value="tidak_lulus">Tidak Lulus</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ background: "#fff", borderColor: "#e8e4db" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#faf8f3", borderBottom: "1px solid #e8e4db" }}>
                <th className="text-left py-3 px-4 font-medium" style={{ color: "#888" }}>Foto</th>
                <th className="text-left py-3 px-4 font-medium" style={{ color: "#888" }}>NIM</th>
                <th className="text-left py-3 px-4 font-medium" style={{ color: "#888" }}>Nama</th>
                <th className="text-left py-3 px-4 font-medium" style={{ color: "#888" }}>Fakultas</th>
                <th className="text-left py-3 px-4 font-medium" style={{ color: "#888" }}>Pembayaran</th>
                <th className="text-left py-3 px-4 font-medium" style={{ color: "#888" }}>Status Tes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr
                  key={s.id}
                  data-testid={`row-student-${s.id}`}
                  onClick={() => router.push(`/instruktur/penilaian?studentId=${s.id}`)}
                  className="cursor-pointer transition-colors hover:bg-[#faf8f3]"
                  style={{ borderBottom: "1px solid #f0ede6" }}
                >
                  <td className="py-3 px-4">
                    <img
                      src={getMahasiswaPhotoUrl(s.nim || "")}
                      alt={s.name}
                      className="w-9 h-9 rounded-full object-cover border"
                      style={{ borderColor: "#e8e4db" }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.outerHTML = `<div class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold" style="background:#84B179;color:#fff">${s.name.charAt(0)}</div>`;
                      }}
                    />
                  </td>
                  <td className="py-3 px-4 font-mono text-xs" style={{ color: "#84B179" }}>{s.nim}</td>
                  <td className="py-3 px-4 font-medium" style={{ color: "#1A1A1A" }}>{s.name}</td>
                  <td className="py-3 px-4" style={{ color: "#666" }}>{s.faculty}</td>
                  <td className="py-3 px-4"><StatusBadge status={getPaymentStatus(s.id)} /></td>
                  <td className="py-3 px-4"><StatusBadge status={getStudentStatus(s.id)} /></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center" style={{ color: "#888" }}>
                    Tidak ada data mahasiswa ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
