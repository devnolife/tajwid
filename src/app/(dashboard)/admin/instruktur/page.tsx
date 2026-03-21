"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2 } from "lucide-react";
import type { User, Schedule } from "@shared/schema";

export default function InstrukturManagement() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", username: "", password: "password123", email: "", phone: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: instructors, isLoading } = useQuery<Omit<User, "password">[]>({
    queryKey: ["/api/users", "?role=instruktur"],
  });

  const { data: allSchedules } = useQuery<Schedule[]>({ queryKey: ["/api/schedules"] });

  const createMutation = useMutation({
    mutationFn: async () => {
      const data: any = { ...form, role: "instruktur" };
      if (editingId) {
        const { password, ...updateData } = data;
        const payload = password ? { ...updateData, password } : updateData;
        await apiRequest("PATCH", `/api/users/${editingId}`, payload);
      } else {
        await apiRequest("POST", "/api/users", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Berhasil", description: editingId ? "Data instruktur diperbarui" : "Instruktur baru ditambahkan" });
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
      toast({ title: "Berhasil", description: "Instruktur dihapus" });
    },
    onError: () => {
      setDeletingId(null);
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ name: "", username: "", password: "password123", email: "", phone: "" });
  };

  const openEdit = (s: Omit<User, "password">) => {
    setEditingId(s.id);
    setForm({ name: s.name, username: s.username, password: "", email: s.email || "", phone: s.phone || "" });
    setShowForm(true);
  };

  const getAssignedCount = (id: string) => allSchedules?.filter(s => s.instructorId === id).length || 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-end">
        <Button
          data-testid="button-tambah-instruktur"
          onClick={() => { resetForm(); setShowForm(true); }}
          className="rounded-xl h-10 text-xs"
          style={{ background: "#84B179", color: "#fff" }}
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Tambah Instruktur
        </Button>
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ background: "#fff", borderColor: "#e8e4db" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#faf8f3", borderBottom: "1px solid #e8e4db" }}>
                <th className="text-left py-3 px-4 font-medium" style={{ color: "#888" }}>Nama</th>
                <th className="text-left py-3 px-4 font-medium" style={{ color: "#888" }}>No. Telepon</th>
                <th className="text-left py-3 px-4 font-medium" style={{ color: "#888" }}>Mahasiswa</th>
                <th className="text-left py-3 px-4 font-medium" style={{ color: "#888" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [1, 2].map(i => <tr key={i}><td colSpan={4} className="py-4 px-4"><div className="h-8 bg-gray-100 rounded animate-pulse" /></td></tr>)
              ) : instructors?.map(s => (
                <tr key={s.id} style={{ borderBottom: "1px solid #f0ede6" }} className="hover:bg-[#faf8f3] transition-colors">
                  <td className="py-3 px-4 font-medium" style={{ color: "#1A1A1A" }}>{s.name}</td>
                  <td className="py-3 px-4" style={{ color: "#666" }}>{s.phone || "-"}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: "#E0E7FF", color: "#4F46E5" }}>
                      {getAssignedCount(s.id)} mahasiswa
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1">
                      <button data-testid={`edit-instruktur-${s.id}`} onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" style={{ color: "#84B179" }}>
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button data-testid={`delete-instruktur-${s.id}`} onClick={() => deleteMutation.mutate(s.id)} disabled={deletingId === s.id} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-red-500 disabled:opacity-50">
                        {deletingId === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={showForm} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent className="rounded-2xl" style={{ background: "#fff" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "#1A1A1A" }}>{editingId ? "Edit Instruktur" : "Tambah Instruktur"}</DialogTitle>
            <DialogDescription style={{ color: "#888" }}>
              {editingId ? "Perbarui data instruktur" : "Masukkan data instruktur baru"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {[
              { key: "name", label: "Nama Lengkap", type: "text" },
              { key: "username", label: "Username", type: "text" },
              { key: "password", label: editingId ? "Password (kosongkan jika tidak diubah)" : "Password", type: "password" },
              { key: "email", label: "Email", type: "email" },
              { key: "phone", label: "No. Telepon", type: "tel" },
            ].map(field => (
              <div key={field.key}>
                <Label className="text-xs font-medium" style={{ color: "#666" }}>{field.label}</Label>
                <div className="relative">
                  <Input
                    data-testid={`input-instruktur-${field.key}`}
                    type={field.key === "password" ? (showPassword ? "text" : "password") : field.type}
                    value={(form as any)[field.key]}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                    className="mt-1 rounded-xl h-10"
                    style={{ background: "#faf8f3", borderColor: "#e8e4db" }}
                    placeholder={field.key === "password" && editingId ? "••••••••" : ""}
                  />
                  {field.key === "password" && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5 p-0.5 rounded hover:bg-gray-100 transition-colors"
                      style={{ color: "#888" }}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={resetForm} className="rounded-xl">Batal</Button>
            <Button
              data-testid="button-save-instruktur"
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
