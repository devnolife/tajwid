"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Search, Plus, Pencil, Trash2, Download, Upload, Loader2, Filter } from "lucide-react";
import type { User, Payment, Assessment } from "@shared/schema";
import { getMahasiswaPhotoUrl } from "@/lib/mahasiswa-photo";
import { Pagination, usePagination } from "@/components/pagination";

export default function MahasiswaManagement() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("semua");
  const [facultyFilter, setFacultyFilter] = useState("semua");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", nim: "", username: "", password: "password123", faculty: "", program: "", email: "", phone: "" });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  const { data: students, isLoading } = useQuery<Omit<User, "password">[]>({
    queryKey: ["/api/users", "?role=mahasiswa"],
  });

  const { data: allPayments } = useQuery<Payment[]>({ queryKey: ["/api/payments"] });
  const { data: allAssessments } = useQuery<Assessment[]>({ queryKey: ["/api/assessments"] });

  const createMutation = useMutation({
    mutationFn: async () => {
      const data: any = { ...form, role: "mahasiswa", username: form.nim || form.username };
      if (editingId) {
        const { password, ...updateData } = data;
        await apiRequest("PATCH", `/api/users/${editingId}`, updateData);
      } else {
        await apiRequest("POST", "/api/users", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Berhasil", description: editingId ? "Data mahasiswa diperbarui" : "Mahasiswa baru ditambahkan" });
      resetForm();
    },
    onError: () => toast({ title: "Gagal", description: "Terjadi kesalahan", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      setDeletingId(id);
      return apiRequest("DELETE", `/api/users/${id}`);
    },
    onSuccess: () => {
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Berhasil", description: "Mahasiswa dihapus" });
    },
    onError: () => {
      setDeletingId(null);
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ name: "", nim: "", username: "", password: "password123", faculty: "", program: "", email: "", phone: "" });
  };

  const openEdit = (s: Omit<User, "password">) => {
    setEditingId(s.id);
    setForm({ name: s.name, nim: s.nim || "", username: s.username, password: "", faculty: s.faculty || "", program: s.program || "", email: s.email || "", phone: s.phone || "" });
    setShowForm(true);
  };

  const getStatus = (id: string) => {
    const a = allAssessments?.find(a => a.studentId === id);
    if (a) return a.passed ? "lulus" : "perlu_mengulang";
    return "belum_tes";
  };

  const faculties = useMemo(() => {
    const set = new Set<string>();
    students?.forEach(s => s.faculty && set.add(s.faculty));
    return Array.from(set).sort();
  }, [students]);

  const filtered = useMemo(() => {
    return (students || []).filter(s => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        s.name.toLowerCase().includes(q) ||
        s.nim?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.program?.toLowerCase().includes(q);
      const matchStatus = statusFilter === "semua" || getStatus(s.id) === statusFilter;
      const matchFaculty = facultyFilter === "semua" || s.faculty === facultyFilter;
      return matchSearch && matchStatus && matchFaculty;
    });
  }, [students, search, statusFilter, facultyFilter, allAssessments]);

  const paged = usePagination(filtered, pageSize, page);
  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [search, statusFilter, facultyFilter, pageSize]);

  const handleExport = async () => {
    const XLSX = await import("xlsx");
    const rows = filtered.map(s => {
      const a = allAssessments?.find(a => a.studentId === s.id);
      const p = allPayments?.find(p => p.studentId === s.id);
      return {
        NIM: s.nim || "",
        Nama: s.name,
        Email: s.email || "",
        Telepon: s.phone || "",
        Fakultas: s.faculty || "",
        "Program Studi": s.program || "",
        "Status Tes": a ? (a.passed ? "Lulus" : "Perlu Mengulang") : "Belum Tes",
        "Total Skor": a?.totalScore ?? "",
        Tajwid: a?.tajwid ?? "",
        Kelancaran: a?.kelancaran ?? "",
        "Makhorijul Huruf": a?.makhorijulHuruf ?? "",
        Adab: a?.adab ?? "",
        "Status Pembayaran": p?.status || "belum_bayar",
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Mahasiswa");
    const filename = `mahasiswa-${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);
    toast({ title: "Berhasil", description: `${rows.length} data diekspor ke ${filename}` });
  };

  const downloadTemplate = async () => {
    const XLSX = await import("xlsx");
    const sample = [{ NIM: "2024999001", Nama: "Contoh Mahasiswa", Email: "contoh@unismuh.ac.id", Telepon: "08123456789", Fakultas: "Teknik", "Program Studi": "Informatika" }];
    const ws = XLSX.utils.json_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "template-import-mahasiswa.xlsx");
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImporting(true);
    setImportResult(null);
    try {
      const XLSX = await import("xlsx");
      const buffer = await importFile.arrayBuffer();
      const wb = XLSX.read(buffer);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(ws);

      let success = 0;
      let failed = 0;
      const errors: string[] = [];

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        try {
          const nim = String(r.NIM || r.nim || "").trim();
          const name = String(r.Nama || r.name || "").trim();
          if (!nim || !name) {
            failed++;
            errors.push(`Baris ${i + 2}: NIM dan Nama wajib diisi`);
            continue;
          }
          await apiRequest("POST", "/api/users", {
            username: nim,
            password: "password123",
            role: "mahasiswa",
            name,
            nim,
            email: String(r.Email || r.email || "").trim() || null,
            phone: String(r.Telepon || r.phone || "").trim() || null,
            faculty: String(r.Fakultas || r.faculty || "").trim() || null,
            program: String(r["Program Studi"] || r.program || "").trim() || null,
          });
          success++;
        } catch (e: any) {
          failed++;
          errors.push(`Baris ${i + 2}: ${e.message || "Gagal"}`);
        }
      }

      setImportResult({ success, failed, errors: errors.slice(0, 10) });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Selesai", description: `${success} berhasil, ${failed} gagal` });
    } catch (e: any) {
      toast({ title: "Gagal", description: e.message || "File tidak valid", variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto lg:flex-1 lg:max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#888" }} />
            <Input
              data-testid="input-search-mahasiswa"
              placeholder="Cari nama, NIM, email, atau program..."
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
              <SelectItem value="semua">Semua Status</SelectItem>
              <SelectItem value="lulus">Lulus</SelectItem>
              <SelectItem value="perlu_mengulang">Perlu Mengulang</SelectItem>
              <SelectItem value="belum_tes">Belum Tes</SelectItem>
            </SelectContent>
          </Select>
          <Select value={facultyFilter} onValueChange={setFacultyFilter}>
            <SelectTrigger className="w-full sm:w-44 h-10 rounded-xl" style={{ background: "#fff", borderColor: "#e8e4db" }}>
              <SelectValue placeholder="Fakultas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Fakultas</SelectItem>
              {faculties.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" className="rounded-xl h-10 text-xs" onClick={() => setShowImport(true)}>
            <Upload className="w-3.5 h-3.5 mr-1.5" /> Import Excel
          </Button>
          <Button variant="outline" className="rounded-xl h-10 text-xs" onClick={handleExport}>
            <Download className="w-3.5 h-3.5 mr-1.5" /> Export Excel
          </Button>
          <Button
            data-testid="button-tambah-mahasiswa"
            onClick={() => { resetForm(); setShowForm(true); }}
            className="rounded-xl h-10 text-xs"
            style={{ background: "#84B179", color: "#fff" }}
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Tambah
          </Button>
        </div>
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
                <th className="text-left py-3 px-4 font-medium" style={{ color: "#888" }}>Program</th>
                <th className="text-left py-3 px-4 font-medium" style={{ color: "#888" }}>Status</th>
                <th className="text-left py-3 px-4 font-medium" style={{ color: "#888" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [1, 2, 3].map(i => (
                  <tr key={i}><td colSpan={7} className="py-4 px-4"><div className="h-8 bg-gray-100 rounded animate-pulse" /></td></tr>
                ))
              ) : paged.map(s => (
                <tr key={s.id} style={{ borderBottom: "1px solid #f0ede6" }} className="hover:bg-[#faf8f3] transition-colors">
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
                  <td className="py-3 px-4" style={{ color: "#666" }}>{s.program}</td>
                  <td className="py-3 px-4"><StatusBadge status={getStatus(s.id)} /></td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1">
                      <button data-testid={`edit-student-${s.id}`} onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" style={{ color: "#84B179" }}>
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button data-testid={`delete-student-${s.id}`} onClick={() => deleteMutation.mutate(s.id)} disabled={deletingId === s.id} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-red-500 disabled:opacity-50">
                        {deletingId === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={7} className="py-12 text-center" style={{ color: "#888" }}>
                  {search || statusFilter !== "semua" || facultyFilter !== "semua" ? "Tidak ada hasil yang cocok dengan filter" : "Belum ada mahasiswa"}
                </td></tr>
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

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent className="rounded-2xl max-w-lg" style={{ background: "#fff" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "#1A1A1A" }}>{editingId ? "Edit Mahasiswa" : "Tambah Mahasiswa"}</DialogTitle>
            <DialogDescription style={{ color: "#888" }}>
              {editingId ? "Perbarui data mahasiswa" : "Masukkan data mahasiswa baru"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: "name", label: "Nama Lengkap", span: 2 },
              { key: "nim", label: "NIM" },
              { key: "email", label: "Email" },
              { key: "faculty", label: "Fakultas" },
              { key: "program", label: "Program Studi" },
              { key: "phone", label: "No. Telepon", span: 2 },
            ].map(field => (
              <div key={field.key} className={field.span === 2 ? "col-span-2" : ""}>
                <Label className="text-xs font-medium" style={{ color: "#666" }}>{field.label}</Label>
                <Input
                  data-testid={`input-form-${field.key}`}
                  value={(form as any)[field.key]}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  className="mt-1 rounded-xl h-10"
                  style={{ background: "#faf8f3", borderColor: "#e8e4db" }}
                />
              </div>
            ))}
          </div>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={resetForm} className="rounded-xl">Batal</Button>
            <Button
              data-testid="button-save-mahasiswa"
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
              className="rounded-xl"
              style={{ background: "#84B179", color: "#fff" }}
            >
              {createMutation.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImport} onOpenChange={(open) => { if (!open) { setShowImport(false); setImportFile(null); setImportResult(null); } }}>
        <DialogContent className="rounded-2xl max-w-md" style={{ background: "#fff" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "#1A1A1A" }}>Import Mahasiswa dari Excel</DialogTitle>
            <DialogDescription style={{ color: "#888" }}>
              Upload file Excel (.xlsx) berisi data mahasiswa. Kolom wajib: NIM, Nama.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <button
              type="button"
              onClick={downloadTemplate}
              className="w-full text-xs px-3 py-2 rounded-lg border inline-flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
              style={{ borderColor: "#e8e4db", color: "#84B179" }}
            >
              <Download className="w-3.5 h-3.5" /> Unduh Template Excel
            </button>

            <div>
              <Label className="text-xs font-medium" style={{ color: "#666" }}>Pilih File Excel</Label>
              <Input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => { setImportFile(e.target.files?.[0] || null); setImportResult(null); }}
                className="mt-1 h-10 rounded-xl"
                style={{ background: "#faf8f3", borderColor: "#e8e4db" }}
              />
              {importFile && (
                <p className="text-[11px] mt-1" style={{ color: "#666" }}>{importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)</p>
              )}
            </div>

            {importResult && (
              <div className="rounded-xl p-3 text-xs" style={{ background: importResult.failed === 0 ? "#F0FDF4" : "#FEF3C7" }}>
                <p className="font-semibold mb-1" style={{ color: "#1A1A1A" }}>Hasil Import:</p>
                <p style={{ color: "#059669" }}>✓ {importResult.success} berhasil ditambahkan</p>
                {importResult.failed > 0 && (
                  <>
                    <p style={{ color: "#D97706" }}>✗ {importResult.failed} gagal</p>
                    {importResult.errors.length > 0 && (
                      <ul className="mt-2 space-y-0.5" style={{ color: "#666" }}>
                        {importResult.errors.map((e, i) => <li key={i}>• {e}</li>)}
                      </ul>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => { setShowImport(false); setImportFile(null); setImportResult(null); }} className="rounded-xl">Tutup</Button>
            <Button
              onClick={handleImport}
              disabled={!importFile || importing}
              className="rounded-xl"
              style={{ background: "#84B179", color: "#fff" }}
            >
              {importing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              {importing ? "Mengimpor..." : "Mulai Import"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

