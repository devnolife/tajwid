"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { StatusBadge } from "@/components/status-badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, Calendar as CalendarIcon, MapPin, Clock, Loader2, Pencil, CalendarX } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import type { User, Schedule } from "@shared/schema";

const emptyForm = {
  studentId: "",
  instructorId: "",
  date: undefined as Date | undefined,
  time: "08:00",
  room: "",
  location: "",
  status: "scheduled" as Schedule["status"],
};

export default function JadwalManagement() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Schedule | null>(null);
  const [statusFilter, setStatusFilter] = useState("semua");

  const { data: schedules, isLoading } = useQuery<Schedule[]>({ queryKey: ["/api/schedules"] });
  const { data: students } = useQuery<Omit<User, "password">[]>({ queryKey: ["/api/users", "?role=mahasiswa"] });
  const { data: instructors } = useQuery<Omit<User, "password">[]>({ queryKey: ["/api/users", "?role=instruktur"] });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!form.date) throw new Error("Tanggal belum dipilih");
      const [hours, minutes] = form.time.split(":").map(Number);
      const dateTime = new Date(form.date);
      dateTime.setHours(hours, minutes, 0, 0);
      if (editingId) {
        await apiRequest("PATCH", `/api/schedules/${editingId}`, {
          date: dateTime.toISOString(),
          room: form.room,
          location: form.location || null,
          status: form.status,
        });
      } else {
        await apiRequest("POST", "/api/schedules", {
          studentId: form.studentId,
          instructorId: form.instructorId,
          date: dateTime.toISOString(),
          room: form.room,
          location: form.location,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      toast({ title: "Berhasil", description: editingId ? "Jadwal berhasil diperbarui" : "Jadwal berhasil ditambahkan" });
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
    },
    onError: () => toast({ title: "Gagal", description: "Terjadi kesalahan", variant: "destructive" }),
  });

  const openEdit = (s: Schedule) => {
    const d = new Date(s.date);
    setEditingId(s.id);
    setForm({
      studentId: s.studentId,
      instructorId: s.instructorId,
      date: d,
      time: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
      room: s.room,
      location: s.location ?? "",
      status: s.status,
    });
    setShowForm(true);
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      setDeletingId(id);
      return apiRequest("DELETE", `/api/schedules/${id}`);
    },
    onSuccess: () => {
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      toast({ title: "Berhasil", description: "Jadwal dihapus" });
    },
    onError: () => {
      setDeletingId(null);
    },
  });

  const getStudentName = (id: string) => students?.find(s => s.id === id)?.name || "-";
  const getInstructorName = (id: string) => instructors?.find(s => s.id === id)?.name || "-";

  const filteredSchedules = (schedules || []).filter(
    s => statusFilter === "semua" || s.status === statusFilter,
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="rounded-xl h-10 text-xs w-44" style={{ background: "#fff", borderColor: "#e8e4db" }}>
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua Status</SelectItem>
            <SelectItem value="scheduled">Terjadwal</SelectItem>
            <SelectItem value="completed">Selesai</SelectItem>
            <SelectItem value="no_show">Tidak Hadir</SelectItem>
            <SelectItem value="cancelled">Dibatalkan</SelectItem>
          </SelectContent>
        </Select>
        <Button
          data-testid="button-tambah-jadwal"
          onClick={() => { setEditingId(null); setForm(emptyForm); setShowForm(true); }}
          className="rounded-xl h-10 text-xs"
          style={{ background: "#84B179", color: "#fff" }}
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Tambah Jadwal
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          [1, 2, 3].map(i => <div key={i} className="h-40 rounded-2xl bg-gray-100 animate-pulse" />)
        ) : filteredSchedules.map(s => {
          const schedDate = new Date(s.date);
          return (
            <div key={s.id} className="rounded-2xl border p-5" style={{ background: "#fff", borderColor: "#e8e4db" }}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center" style={{ background: "#84B179" }}>
                  <span className="text-base font-bold" style={{ color: "#A2CB8B" }}>{schedDate.getDate()}</span>
                  <span className="text-[9px] uppercase" style={{ color: "#fff" }}>{schedDate.toLocaleDateString("id-ID", { month: "short" })}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    data-testid={`edit-schedule-${s.id}`}
                    onClick={() => openEdit(s)}
                    className="p-1.5 rounded-lg hover:bg-green-50 transition-colors"
                    style={{ color: "#84B179" }}
                    title="Edit jadwal"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    data-testid={`delete-schedule-${s.id}`}
                    onClick={() => setDeleteTarget(s)}
                    disabled={deletingId === s.id}
                    className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-red-400 disabled:opacity-50"
                    title="Hapus jadwal"
                  >
                    {deletingId === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>{getStudentName(s.studentId)}</p>
                <StatusBadge status={s.status} />
              </div>
              <p className="text-xs mt-1" style={{ color: "#888" }}>Instruktur: {getInstructorName(s.instructorId)}</p>
              <div className="flex items-center gap-3 mt-3 pt-3 border-t" style={{ borderColor: "#f0ede6" }}>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" style={{ color: "#888" }} />
                  <span className="text-xs" style={{ color: "#888" }}>{schedDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" style={{ color: "#888" }} />
                  <span className="text-xs" style={{ color: "#888" }}>{s.room}</span>
                </div>
              </div>
            </div>
          );
        })}
        {!isLoading && filteredSchedules.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed py-14 flex flex-col items-center gap-2" style={{ borderColor: "#e8e4db", color: "#888" }}>
            <CalendarX className="w-8 h-8" style={{ color: "#c9c3b6" }} />
            <p className="text-sm">{statusFilter === "semua" ? "Belum ada jadwal" : "Tidak ada jadwal dengan status ini"}</p>
          </div>
        )}
      </div>

      <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) setEditingId(null); }}>
        <DialogContent className="rounded-2xl" style={{ background: "#fff" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "#1A1A1A" }}>{editingId ? "Edit Jadwal" : "Tambah Jadwal"}</DialogTitle>
            <DialogDescription style={{ color: "#888" }}>{editingId ? "Perbarui waktu, tempat, atau status jadwal" : "Atur jadwal ujian tajwid"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-medium" style={{ color: "#666" }}>Mahasiswa</Label>
              <Select value={form.studentId} onValueChange={(v) => setForm({ ...form, studentId: v })} disabled={!!editingId}>
                <SelectTrigger className="mt-1 rounded-xl h-10" style={{ background: "#faf8f3", borderColor: "#e8e4db" }}>
                  <SelectValue placeholder="Pilih mahasiswa" />
                </SelectTrigger>
                <SelectContent>
                  {students?.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.nim})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium" style={{ color: "#666" }}>Instruktur</Label>
              <Select value={form.instructorId} onValueChange={(v) => setForm({ ...form, instructorId: v })} disabled={!!editingId}>
                <SelectTrigger className="mt-1 rounded-xl h-10" style={{ background: "#faf8f3", borderColor: "#e8e4db" }}>
                  <SelectValue placeholder="Pilih instruktur" />
                </SelectTrigger>
                <SelectContent>
                  {instructors?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium" style={{ color: "#666" }}>Tanggal</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      data-testid="input-schedule-date"
                      variant="outline"
                      className="mt-1 w-full justify-start text-left font-normal rounded-xl h-10"
                      style={{ background: "#faf8f3", borderColor: "#e8e4db" }}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" style={{ color: "#888" }} />
                      {form.date ? format(form.date, "dd MMMM yyyy", { locale: localeId }) : <span style={{ color: "#999" }}>Pilih tanggal</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={form.date}
                      onSelect={(date) => setForm({ ...form, date: date || undefined })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label className="text-xs font-medium" style={{ color: "#666" }}>Waktu</Label>
                <Select value={form.time} onValueChange={(v) => setForm({ ...form, time: v })}>
                  <SelectTrigger data-testid="input-schedule-time" className="mt-1 rounded-xl h-10" style={{ background: "#faf8f3", borderColor: "#e8e4db" }}>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" style={{ color: "#888" }} />
                      <SelectValue placeholder="Pilih waktu" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 28 }, (_, i) => {
                      const h = Math.floor(i / 2) + 7;
                      const m = (i % 2) * 30;
                      if (h > 20) return null;
                      const val = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
                      return <SelectItem key={val} value={val}>{val}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium" style={{ color: "#666" }}>Ruangan</Label>
                <Input data-testid="input-schedule-room" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} className="mt-1 rounded-xl h-10" style={{ background: "#faf8f3", borderColor: "#e8e4db" }} />
              </div>
              <div>
                <Label className="text-xs font-medium" style={{ color: "#666" }}>Lokasi</Label>
                <Input data-testid="input-schedule-location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="mt-1 rounded-xl h-10" style={{ background: "#faf8f3", borderColor: "#e8e4db" }} />
              </div>
            </div>
            {editingId && (
              <div>
                <Label className="text-xs font-medium" style={{ color: "#666" }}>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Schedule["status"] })}>
                  <SelectTrigger data-testid="input-schedule-status" className="mt-1 rounded-xl h-10" style={{ background: "#faf8f3", borderColor: "#e8e4db" }}>
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Terjadwal</SelectItem>
                    <SelectItem value="completed">Selesai</SelectItem>
                    <SelectItem value="no_show">Tidak Hadir</SelectItem>
                    <SelectItem value="cancelled">Dibatalkan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => { setShowForm(false); setEditingId(null); }} className="rounded-xl">Batal</Button>
            <Button
              data-testid="button-save-jadwal"
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
              className="rounded-xl"
              style={{ background: "#84B179", color: "#fff" }}
            >
              {createMutation.isPending ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Jadwal</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && (
                <>
                  Hapus jadwal <span className="font-semibold">{getStudentName(deleteTarget.studentId)}</span> pada{" "}
                  <span className="font-semibold">
                    {new Date(deleteTarget.date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                  </span>{" "}
                  di {deleteTarget.room}? Tindakan ini tidak dapat dibatalkan.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction
              data-testid="confirm-delete-schedule"
              className="rounded-xl bg-red-500 hover:bg-red-600 text-white"
              onClick={() => {
                if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
