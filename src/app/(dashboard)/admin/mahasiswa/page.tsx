"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Search, Plus, Pencil, Trash2, Download, Upload } from "lucide-react";
import type { User, Payment, Assessment } from "@shared/schema";
import { getMahasiswaPhotoUrl } from "@/lib/mahasiswa-photo";

export default function MahasiswaManagement() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", nim: "", username: "", password: "password123", faculty: "", program: "", email: "", phone: "" });

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
    mutationFn: (id: string) => apiRequest("DELETE", `/api/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Berhasil", description: "Mahasiswa dihapus" });
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
    if (a) return a.passed ? "lulus" : "tidak_lulus";
    return "belum_tes";
  };

  const filtered = students?.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.nim?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#888" }} />
          <Input
            data-testid="input-search-mahasiswa"
            placeholder="Cari mahasiswa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 rounded-xl"
            style={{ background: "#fff", borderColor: "#e8e4db" }}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl h-10 text-xs" onClick={() => toast({ title: "Info", description: "Fitur export akan segera tersedia" })}>
            <Download className="w-3.5 h-3.5 mr-1.5" /> Export
          </Button>
          <Button
            data-testid="button-tambah-mahasiswa"
            onClick={() => { resetForm(); setShowForm(true); }}
            className="rounded-xl h-10 text-xs"
            style={{ background: "#84B179", color: "#fff" }}
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Tambah Mahasiswa
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
                  <tr key={i}><td colSpan={6} className="py-4 px-4"><div className="h-8 bg-gray-100 rounded animate-pulse" /></td></tr>
                ))
              ) : filtered.map(s => (
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
                      <button data-testid={`delete-student-${s.id}`} onClick={() => deleteMutation.mutate(s.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={7} className="py-12 text-center" style={{ color: "#888" }}>Tidak ada data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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
    </div>
  );
}
