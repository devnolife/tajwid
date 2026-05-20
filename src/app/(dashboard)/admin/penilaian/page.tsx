"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Pagination, usePagination } from "@/components/pagination";
import type { User, Assessment } from "@shared/schema";

export default function PenilaianManagement() {
  const { toast } = useToast();
  const { data: assessments, isLoading } = useQuery<Assessment[]>({ queryKey: ["/api/assessments"] });
  const { data: students } = useQuery<Omit<User, "password">[]>({ queryKey: ["/api/users", "?role=mahasiswa"] });
  const { data: instructors } = useQuery<Omit<User, "password">[]>({ queryKey: ["/api/users", "?role=instruktur"] });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("semua");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const getStudentName = (id: string) => students?.find(s => s.id === id)?.name || "-";
  const getStudentNim = (id: string) => students?.find(s => s.id === id)?.nim || "-";
  const getInstructorName = (id: string) => instructors?.find(s => s.id === id)?.name || "-";

  const filtered = useMemo(() => {
    return (assessments || []).filter(a => {
      const matchStatus = statusFilter === "semua" ||
        (statusFilter === "lulus" && a.passed) ||
        (statusFilter === "perlu_mengulang" && !a.passed);
      if (!matchStatus) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return getStudentName(a.studentId).toLowerCase().includes(q) ||
        getStudentNim(a.studentId).toLowerCase().includes(q) ||
        getInstructorName(a.instructorId).toLowerCase().includes(q);
    });
  }, [assessments, students, instructors, statusFilter, search]);

  const paged = usePagination(filtered, pageSize, page);
  useEffect(() => { setPage(1); }, [statusFilter, search, pageSize]);

  const handleExport = async () => {
    const XLSX = await import("xlsx");
    const rows = filtered.map(a => ({
      NIM: getStudentNim(a.studentId),
      Mahasiswa: getStudentName(a.studentId),
      Instruktur: getInstructorName(a.instructorId),
      Tajwid: a.tajwid,
      Kelancaran: a.kelancaran,
      "Makhorijul Huruf": a.makhorijulHuruf,
      Adab: a.adab,
      "Total Skor": a.totalScore,
      Status: a.passed ? "Lulus" : "Perlu Mengulang",
      Catatan: a.notes || "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Penilaian");
    const filename = `penilaian-${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);
    toast({ title: "Berhasil", description: `${rows.length} data diekspor` });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:flex-1 lg:max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#888" }} />
            <Input
              placeholder="Cari mahasiswa, NIM, atau instruktur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 rounded-xl"
              style={{ background: "#fff", borderColor: "#e8e4db" }}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44 h-10 rounded-xl" style={{ background: "#fff", borderColor: "#e8e4db" }}>
              <Filter className="w-4 h-4 mr-2" style={{ color: "#888" }} />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua</SelectItem>
              <SelectItem value="lulus">Lulus</SelectItem>
              <SelectItem value="perlu_mengulang">Perlu Mengulang</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" className="rounded-xl h-10 text-xs" onClick={handleExport}>
          <Download className="w-3.5 h-3.5 mr-1.5" /> Export Excel
        </Button>
      </div>

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
              ) : paged.map(a => (
                <tr key={a.id} style={{ borderBottom: "1px solid #f0ede6" }} className="hover:bg-[#faf8f3] transition-colors">
                  <td className="py-3 px-4 font-medium" style={{ color: "#1A1A1A" }}>{getStudentName(a.studentId)}</td>
                  <td className="py-3 px-4" style={{ color: "#666" }}>{getInstructorName(a.instructorId)}</td>
                  <td className="py-3 px-4 font-mono" style={{ color: "#84B179" }}>{a.tajwid}</td>
                  <td className="py-3 px-4 font-mono" style={{ color: "#84B179" }}>{a.kelancaran}</td>
                  <td className="py-3 px-4 font-mono" style={{ color: "#84B179" }}>{a.makhorijulHuruf}</td>
                  <td className="py-3 px-4 font-mono" style={{ color: "#84B179" }}>{a.adab}</td>
                  <td className="py-3 px-4 font-bold" style={{ color: a.passed ? "#059669" : "#D97706" }}>{a.totalScore}</td>
                  <td className="py-3 px-4"><StatusBadge status={a.passed ? "lulus" : "tidak_lulus"} /></td>
                </tr>
              ))}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={8} className="py-12 text-center" style={{ color: "#888" }}>Belum ada data penilaian</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <Pagination
            page={page}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </div>
    </div>
  );
}
