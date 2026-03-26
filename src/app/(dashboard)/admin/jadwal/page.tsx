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
import { Plus, Trash2, Calendar as CalendarIcon, MapPin, Clock, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import type { User, Schedule } from "@shared/schema";

export default function JadwalManagement() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ studentId: "", instructorId: "", date: undefined as Date | undefined, time: "08:00", room: "", location: "" });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: schedules, isLoading } = useQuery<Schedule[]>({ queryKey: ["/api/schedules"] });
  const { data: students } = useQuery<Omit<User, "password">[]>({ queryKey: ["/api/users", "?role=mahasiswa"] });
  const { data: instructors } = useQuery<Omit<User, "password">[]>({ queryKey: ["/api/users", "?role=instruktur"] });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!form.date) throw new Error("Tanggal belum dipilih");
      const [hours, minutes] = form.time.split(":").map(Number);
      const dateTime = new Date(form.date);
      dateTime.setHours(hours, minutes, 0, 0);
      await apiRequest("POST", "/api/schedules", {
        studentId: form.studentId,
        instructorId: form.instructorId,
        date: dateTime.toISOString(),
        room: form.room,
        location: form.location,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      toast({ title: "Berhasil", description: "Jadwal berhasil ditambahkan" });
      setShowForm(false);
      setForm({ studentId: "", instructorId: "", date: undefined, time: "08:00", room: "", location: "" });
    },
    onError: () => toast({ title: "Gagal", description: "Terjadi kesalahan", variant: "destructive" }),
  });

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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-end">
        <Button
          data-testid="button-tambah-jadwal"
          onClick={() => setShowForm(true)}
          className="rounded-xl h-10 text-xs"
          style={{ background: "#84B179", color: "#fff" }}
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Tambah Jadwal
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          [1, 2, 3].map(i => <div key={i} className="h-40 rounded-2xl bg-gray-100 animate-pulse" />)
        ) : schedules?.map(s => {
          const schedDate = new Date(s.date);
          return (
            <div key={s.id} className="rounded-2xl border p-5" style={{ background: "#fff", borderColor: "#e8e4db" }}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center" style={{ background: "#84B179" }}>
                  <span className="text-base font-bold" style={{ color: "#A2CB8B" }}>{schedDate.getDate()}</span>
                  <span className="text-[9px] uppercase" style={{ color: "#fff" }}>{schedDate.toLocaleDateString("id-ID", { month: "short" })}</span>
                </div>
                <button
                  data-testid={`delete-schedule-${s.id}`}
                  onClick={() => deleteMutation.mutate(s.id)}
                  disabled={deletingId === s.id}
                  className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-red-400 disabled:opacity-50"
                >
                  {deletingId === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>{getStudentName(s.studentId)}</p>
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
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="rounded-2xl" style={{ background: "#fff" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "#1A1A1A" }}>Tambah Jadwal</DialogTitle>
            <DialogDescription style={{ color: "#888" }}>Atur jadwal ujian tajwid</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-medium" style={{ color: "#666" }}>Mahasiswa</Label>
              <Select value={form.studentId} onValueChange={(v) => setForm({ ...form, studentId: v })}>
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
              <Select value={form.instructorId} onValueChange={(v) => setForm({ ...form, instructorId: v })}>
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
          </div>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowForm(false)} className="rounded-xl">Batal</Button>
            <Button
              data-testid="button-save-jadwal"
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
