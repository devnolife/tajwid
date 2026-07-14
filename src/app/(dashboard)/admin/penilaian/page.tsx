"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Download, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Pagination, usePagination } from "@/components/pagination";
import type { User, Assessment } from "@shared/schema";

const SCORE_FIELDS = [
  { key: "tajwid", label: "Tajwid" },
  { key: "kelancaran", label: "Kelancaran" },
  { key: "makhorijulHuruf", label: "Makhorijul Huruf" },
  { key: "adab", label: "Adab" },
] as const;

export default function PenilaianManagement() {
  const { toast } = useToast();
  const { data: assessments, isLoading } = useQuery<Assessment[]>({ queryKey: ["/api/assessments"] });
  const { data: students } = useQuery<Omit<User, "password">[]>({ queryKey: ["/api/users", "?role=mahasiswa"] });
  const { data: instructors } = useQuery<Omit<User, "password">[]>({ queryKey: ["/api/users", "?role=instruktur"] });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("semua");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editing, setEditing] = useState<Assessment | null>(null);
  const [editForm, setEditForm] = useState({ tajwid: 0, kelancaran: 0, makhorijulHuruf: 0, adab: 0, notes: "" });

  const openEdit = (a: Assessment) => {
    setEditing(a);
    setEditForm({
      tajwid: a.tajwid,
      kelancaran: a.kelancaran,
      makhorijulHuruf: a.makhorijulHuruf,
      adab: a.adab,
      notes: a.notes ?? "",
    });
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editing) throw new Error("Tidak ada penilaian dipilih");
      await apiRequest("PATCH", `/api/assessments/${editing.id}`, {
        tajwid: editForm.tajwid,
        kelancaran: editForm.kelancaran,
        makhorijulHuruf: editForm.makhorijulHuruf,
        adab: editForm.adab,
        notes: editForm.notes.trim() || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assessments"] });
      toast({ title: "Berhasil", description: "Penilaian diperbarui" });
      setEditing(null);
    },
    onError: (error: Error) => toast({ title: "Gagal", description: error.message, variant: "destructive" }),
  });

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
                <th className="text-left py-3 px-4 font-medium" style={{ color: "#888" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [1, 2].map(i => <tr key={i}><td colSpan={9} className="py-4 px-4"><div className="h-8 bg-gray-100 rounded animate-pulse" /></td></tr>)
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
                  <td className="py-3 px-4">
                    <button
                      data-testid={`edit-assessment-${a.id}`}
                      onClick={() => openEdit(a)}
                      className="p-1.5 rounded-lg hover:bg-green-50 transition-colors"
                      style={{ color: "#84B179" }}
                      title="Koreksi penilaian"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={9} className="py-12 text-center" style={{ color: "#888" }}>Belum ada data penilaian</td></tr>
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

      <Dialog open={!!editing} onOpenChange={(open) => { if (!open) setEditing(null); }}>
        <DialogContent className="rounded-2xl" style={{ background: "#fff" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "#1A1A1A" }}>Koreksi Penilaian</DialogTitle>
            <DialogDescription style={{ color: "#888" }}>
              {editing && `${getStudentName(editing.studentId)} — dinilai oleh ${getInstructorName(editing.instructorId)}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {SCORE_FIELDS.map(f => (
                <div key={f.key}>
                  <Label className="text-xs font-medium" style={{ color: "#666" }}>{f.label}</Label>
                  <Input
                    data-testid={`input-edit-${f.key}`}
                    type="number"
                    min={0}
                    max={100}
                    value={editForm[f.key]}
                    onChange={(e) => setEditForm({ ...editForm, [f.key]: Math.max(0, Math.min(100, Number(e.target.value))) })}
                    className="mt-1 rounded-xl h-10"
                    style={{ background: "#faf8f3", borderColor: "#e8e4db" }}
                  />
                </div>
              ))}
            </div>
            <div>
              <Label className="text-xs font-medium" style={{ color: "#666" }}>Catatan</Label>
              <Textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                className="mt-1 rounded-xl"
                rows={3}
                style={{ background: "#faf8f3", borderColor: "#e8e4db" }}
              />
            </div>
            <p className="text-xs" style={{ color: "#888" }}>
              Total skor dan status lulus dihitung ulang otomatis berdasarkan nilai baru.
            </p>
          </div>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setEditing(null)} className="rounded-xl">Batal</Button>
            <Button
              data-testid="button-save-assessment"
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
              className="rounded-xl"
              style={{ background: "#84B179", color: "#fff" }}
            >
              {updateMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
