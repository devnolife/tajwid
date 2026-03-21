"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeft, Save, User, CheckCircle, AlertTriangle } from "lucide-react";
import type { User as UserType, Assessment, Payment } from "@shared/schema";
import { getMahasiswaPhotoUrl } from "@/lib/mahasiswa-photo";

export default function Penilaian() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentId = searchParams.get("studentId");
  const { user } = useAuth();
  const { toast } = useToast();
  const [showConfirm, setShowConfirm] = useState(false);

  const [tajwid, setTajwid] = useState(70);
  const [kelancaran, setKelancaran] = useState(70);
  const [makhorijul, setMakhorijul] = useState(70);
  const [adab, setAdab] = useState(70);
  const [notes, setNotes] = useState("");

  const { data: students, isLoading: isLoadingStudents } = useQuery<Omit<UserType, "password">[]>({
    queryKey: ["/api/users", "?role=mahasiswa"],
  });

  const { data: existingAssessments } = useQuery<Assessment[]>({
    queryKey: ["/api/assessments", `?studentId=${studentId}`],
    enabled: !!studentId,
  });

  const { data: payments } = useQuery<Payment[]>({
    queryKey: ["/api/payments"],
  });

  const student = students?.find(s => s.id === studentId);
  const existing = existingAssessments?.[0];
  const studentPayment = payments?.find(p => p.studentId === studentId);
  const isPaid = studentPayment?.status === "lunas";

  useEffect(() => {
    if (existing) {
      setTajwid(existing.tajwid);
      setKelancaran(existing.kelancaran);
      setMakhorijul(existing.makhorijulHuruf);
      setAdab(existing.adab);
      setNotes(existing.notes || "");
    }
  }, [existing]);

  const totalScore = Math.round((tajwid + kelancaran + makhorijul + adab) / 4);
  const passed = totalScore >= 70;

  const mutation = useMutation({
    mutationFn: async () => {
      const data = {
        studentId,
        instructorId: user?.id,
        tajwid,
        kelancaran,
        makhorijulHuruf: makhorijul,
        adab,
        totalScore,
        passed,
        notes,
      };
      if (existing) {
        await apiRequest("PATCH", `/api/assessments/${existing.id}`, data);
      } else {
        await apiRequest("POST", "/api/assessments", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assessments"] });
      toast({ title: "Berhasil", description: "Penilaian berhasil disimpan" });
      setShowConfirm(false);
      router.push("/instruktur/mahasiswa-list");
    },
    onError: () => {
      toast({ title: "Gagal", description: "Terjadi kesalahan saat menyimpan", variant: "destructive" });
    },
  });

  if (studentId && isLoadingStudents) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500 animate-pulse">
        <div className="h-5 w-36 rounded bg-gray-100" />
        <div className="rounded-2xl border p-6" style={{ borderColor: "#e8e4db" }}>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-gray-100" />
            <div className="space-y-2">
              <div className="h-5 w-40 rounded bg-gray-100" />
              <div className="h-4 w-56 rounded bg-gray-100" />
            </div>
          </div>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="space-y-3 mb-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="h-4 w-32 rounded bg-gray-100" />
                  <div className="h-3 w-48 rounded bg-gray-100" />
                </div>
                <div className="h-6 w-10 rounded bg-gray-100" />
              </div>
              <div className="h-4 w-full rounded bg-gray-100" />
            </div>
          ))}
          <div className="h-20 rounded-xl bg-gray-100 mt-6" />
          <div className="h-24 rounded-xl bg-gray-100 mt-6" />
          <div className="h-11 w-40 rounded-xl bg-gray-100 mt-6" />
        </div>
      </div>
    );
  }

  if (!studentId || !student) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
        <User className="w-12 h-12 mb-4" style={{ color: "#ccc" }} />
        <p className="text-sm" style={{ color: "#888" }}>Pilih mahasiswa dari daftar untuk melakukan penilaian</p>
      </div>
    );
  }

  const scoreCategories = [
    { label: "Tajwid", value: tajwid, setter: setTajwid, desc: "Ketepatan hukum bacaan Al-Quran" },
    { label: "Kelancaran", value: kelancaran, setter: setKelancaran, desc: "Kelancaran dan kefasihan membaca" },
    { label: "Makhorijul Huruf", value: makhorijul, setter: setMakhorijul, desc: "Ketepatan tempat keluarnya huruf" },
    { label: "Adab / Sopan Santun", value: adab, setter: setAdab, desc: "Adab dan etika saat membaca" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <button data-testid="button-back" onClick={() => router.push("/instruktur/mahasiswa-list")} className="flex items-center gap-2 text-sm font-medium" style={{ color: "#84B179" }}>
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Daftar
      </button>

      <div className="rounded-2xl border p-6" style={{ background: "#fff", borderColor: "#e8e4db" }}>
        <div className="flex items-center gap-4 mb-6">
          <img
            src={getMahasiswaPhotoUrl(student.nim || "")}
            alt={student.name}
            className="w-14 h-14 rounded-full object-cover border-2"
            style={{ borderColor: "#e8e4db" }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
              target.nextElementSibling?.classList.remove("hidden");
            }}
          />
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold hidden" style={{ background: "#84B179", color: "#fff" }}>
            {student.name.charAt(0)}
          </div>
          <div>
            <h3 className="text-lg font-semibold" style={{ color: "#1A1A1A" }}>{student.name}</h3>
            <p className="text-sm" style={{ color: "#888" }}>NIM: {student.nim} · {student.faculty}</p>
          </div>
        </div>

        {!isPaid && (
          <div className="rounded-xl p-4 flex items-center gap-3 mb-6" style={{ background: "#FEF2F2" }}>
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-700">Pembayaran Belum Lunas</p>
              <p className="text-xs text-red-600 mt-0.5">
                Mahasiswa ini belum menyelesaikan pembayaran. Penilaian tidak dapat disimpan sampai pembayaran lunas.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {scoreCategories.map((cat) => (
            <div key={cat.label} className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>{cat.label}</p>
                  <p className="text-xs" style={{ color: "#888" }}>{cat.desc}</p>
                </div>
                <span className="text-lg font-bold tabular-nums" style={{ color: "#84B179" }}>{cat.value}</span>
              </div>
              <Slider
                data-testid={`slider-${cat.label.toLowerCase().replace(/\s+/g, "-")}`}
                value={[cat.value]}
                onValueChange={([v]) => cat.setter(v)}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 rounded-xl flex items-center justify-between" style={{ background: passed ? "#D1FAE5" : "#FEE2E2" }}>
          <div>
            <p className="text-sm font-medium" style={{ color: "#888" }}>Total Skor</p>
            <p className="text-2xl font-bold" style={{ color: passed ? "#059669" : "#DC2626" }}>{totalScore}/100</p>
          </div>
          <span className="px-4 py-2 rounded-full text-sm font-bold" style={{ background: passed ? "#059669" : "#DC2626", color: "#fff" }}>
            {passed ? "LULUS" : "TIDAK LULUS"}
          </span>
        </div>

        <div className="mt-6 space-y-2">
          <label className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>Catatan Instruktur</label>
          <Textarea
            data-testid="textarea-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Tambahkan catatan atau saran untuk mahasiswa..."
            className="rounded-xl min-h-[100px]"
            style={{ background: "#faf8f3", borderColor: "#e8e4db" }}
          />
        </div>

        <div className="mt-6">
          <Button
            data-testid="button-simpan-penilaian"
            onClick={() => {
              if (!isPaid) {
                toast({ title: "Tidak dapat menyimpan", description: "Pembayaran mahasiswa belum lunas", variant: "destructive" });
                return;
              }
              setShowConfirm(true);
            }}
            className="rounded-xl h-11 px-8"
            style={{ background: isPaid ? "#84B179" : "#9CA3AF", color: "#fff" }}
          >
            <Save className="w-4 h-4 mr-2" />
            Simpan Penilaian
          </Button>
        </div>
      </div>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="rounded-2xl" style={{ background: "#fff" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "#1A1A1A" }}>Konfirmasi Penilaian</DialogTitle>
            <DialogDescription style={{ color: "#888" }}>
              Apakah Anda yakin ingin menyimpan penilaian untuk {student.name}?
              Skor total: {totalScore}/100 ({passed ? "Lulus" : "Tidak Lulus"})
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirm(false)} className="rounded-xl">
              Batal
            </Button>
            <Button
              data-testid="button-confirm-save"
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="rounded-xl"
              style={{ background: "#84B179", color: "#fff" }}
            >
              {mutation.isPending ? "Menyimpan..." : "Ya, Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
