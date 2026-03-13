"use client";

import { useQuery } from "@tanstack/react-query";
import { StatusBadge } from "@/components/status-badge";
import type { User, Assessment } from "@shared/schema";

export default function PenilaianManagement() {
  const { data: assessments, isLoading } = useQuery<Assessment[]>({ queryKey: ["/api/assessments"] });
  const { data: students } = useQuery<Omit<User, "password">[]>({ queryKey: ["/api/users", "?role=mahasiswa"] });
  const { data: instructors } = useQuery<Omit<User, "password">[]>({ queryKey: ["/api/users", "?role=instruktur"] });

  const getStudentName = (id: string) => students?.find(s => s.id === id)?.name || "-";
  const getInstructorName = (id: string) => instructors?.find(s => s.id === id)?.name || "-";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="rounded-2xl border overflow-hidden" style={{ background: "#fff", borderColor: "#e8e4db" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#faf8f3", borderBottom: "1px solid #e8e4db" }}>
                <th className="text-left py-3 px-4 font-medium" style={{ color: "#888" }}>Mahasiswa</th>
                <th className="text-left py-3 px-4 font-medium" style={{ color: "#888" }}>Instruktur</th>
                <th className="text-left py-3 px-4 font-medium" style={{ color: "#888" }}>Tajwid</th>
                <th className="text-left py-3 px-4 font-medium" style={{ color: "#888" }}>Kelancaran</th>
                <th className="text-left py-3 px-4 font-medium" style={{ color: "#888" }}>Makhorijul</th>
                <th className="text-left py-3 px-4 font-medium" style={{ color: "#888" }}>Adab</th>
                <th className="text-left py-3 px-4 font-medium" style={{ color: "#888" }}>Total</th>
                <th className="text-left py-3 px-4 font-medium" style={{ color: "#888" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [1, 2].map(i => <tr key={i}><td colSpan={8} className="py-4 px-4"><div className="h-8 bg-gray-100 rounded animate-pulse" /></td></tr>)
              ) : assessments?.map(a => (
                <tr key={a.id} style={{ borderBottom: "1px solid #f0ede6" }} className="hover:bg-[#faf8f3] transition-colors">
                  <td className="py-3 px-4 font-medium" style={{ color: "#1A1A1A" }}>{getStudentName(a.studentId)}</td>
                  <td className="py-3 px-4" style={{ color: "#666" }}>{getInstructorName(a.instructorId)}</td>
                  <td className="py-3 px-4 font-mono" style={{ color: "#84B179" }}>{a.tajwid}</td>
                  <td className="py-3 px-4 font-mono" style={{ color: "#84B179" }}>{a.kelancaran}</td>
                  <td className="py-3 px-4 font-mono" style={{ color: "#84B179" }}>{a.makhorijulHuruf}</td>
                  <td className="py-3 px-4 font-mono" style={{ color: "#84B179" }}>{a.adab}</td>
                  <td className="py-3 px-4 font-bold" style={{ color: a.passed ? "#059669" : "#DC2626" }}>{a.totalScore}</td>
                  <td className="py-3 px-4"><StatusBadge status={a.passed ? "lulus" : "tidak_lulus"} /></td>
                </tr>
              ))}
              {!isLoading && (!assessments || assessments.length === 0) && (
                <tr><td colSpan={8} className="py-12 text-center" style={{ color: "#888" }}>Belum ada data penilaian</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
