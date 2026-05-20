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
import {
  ArrowLeft, Save, Users, BookOpen, Mic2, Sparkles, Heart, NotebookPen, RotateCcw, CheckCircle2,
} from "lucide-react";
import type { User as UserType, Assessment } from "@shared/schema";
import { getMahasiswaPhotoUrl } from "@/lib/mahasiswa-photo";

const C = {
  emerald: "hsl(168 50% 22%)",
  emeraldDeep: "hsl(172 55% 14%)",
  emeraldSoft: "hsl(168 38% 42%)",
  gold: "hsl(38 55% 56%)",
  goldDeep: "hsl(38 55% 40%)",
  goldSoft: "hsl(38 65% 78%)",
  sage: "hsl(152 38% 42%)",
  cream: "hsl(44 45% 98%)",
  taupe: "hsl(40 22% 88%)",
  bgSoft: "hsl(42 38% 96%)",
  rose: "hsl(0 65% 55%)",
  roseSoft: "hsl(0 70% 95%)",
};

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
  // Outcome dipilih manual oleh instruktur: LULUS atau PERLU MENGULANG.
  // Default: mengikuti ambang otomatis (≥70 → lulus), tapi bisa dioverride.
  const [outcome, setOutcome] = useState<"lulus" | "perlu_mengulang" | null>(null);

  const { data: students, isLoading: isLoadingStudents } = useQuery<Omit<UserType, "password">[]>({
    queryKey: ["/api/users", "?role=mahasiswa"],
  });
  const { data: existingAssessments } = useQuery<Assessment[]>({
    queryKey: ["/api/assessments", `?studentId=${studentId}`],
    enabled: !!studentId,
  });

  const student = students?.find((s) => s.id === studentId);
  // API mengembalikan riwayat terbaru → ambil yang paling baru sebagai dasar edit.
  const existing = existingAssessments?.[0];

  useEffect(() => {
    if (existing) {
      setTajwid(existing.tajwid);
      setKelancaran(existing.kelancaran);
      setMakhorijul(existing.makhorijulHuruf);
      setAdab(existing.adab);
      setNotes(existing.notes || "");
      setOutcome(existing.passed ? "lulus" : "perlu_mengulang");
    }
  }, [existing]);

  const totalScore = Math.round((tajwid + kelancaran + makhorijul + adab) / 4);
  const autoPassed = totalScore >= 70;
  const effectiveOutcome: "lulus" | "perlu_mengulang" = outcome ?? (autoPassed ? "lulus" : "perlu_mengulang");
  const passed = effectiveOutcome === "lulus";

  const mutation = useMutation({
    mutationFn: async () => {
      const data = {
        studentId, instructorId: user?.id,
        tajwid, kelancaran, makhorijulHuruf: makhorijul, adab,
        totalScore, passed, notes,
      };
      // Selalu POST attempt baru agar riwayat tersimpan (mahasiswa bisa diminta
      // mengulang berkali-kali). Untuk koreksi data lama, gunakan halaman admin.
      await apiRequest("POST", "/api/assessments", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assessments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      toast({
        title: "Berhasil",
        description: passed
          ? "Penilaian disimpan. Tagihan biaya sertifikat dibuat otomatis."
          : "Penilaian disimpan. Mahasiswa diminta mengulang pada sesi berikutnya.",
      });
      setShowConfirm(false);
      router.push("/instruktur/mahasiswa-list");
    },
    onError: () => {
      toast({ title: "Gagal", description: "Terjadi kesalahan saat menyimpan", variant: "destructive" });
    },
  });

  // === Empty: choose student ===
  if (!studentId && !isLoadingStudents) {
    return (
      <div className="space-y-7 animate-in fade-in duration-500">
        <section
          className="relative rounded-3xl p-8 md:p-10 overflow-hidden border text-center"
          style={{
            background:
              "radial-gradient(ellipse 60% 80% at 50% 0%, hsl(38 60% 60% / 0.18), transparent 60%)," +
              "linear-gradient(135deg, hsl(168 50% 18%) 0%, hsl(172 55% 14%) 100%)",
            borderColor: "hsl(168 30% 18%)",
          }}
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(232,213,168,0.25)" }}>
            <Users className="w-7 h-7 text-[hsl(38_65%_85%)]" />
          </div>
          <p className="text-[11px] tracking-[0.28em] uppercase font-semibold text-[hsl(38_85%_88%)]">Penilaian</p>
          <h1 className="font-display italic text-3xl md:text-4xl mt-2 text-white">Pilih Mahasiswa Dahulu</h1>
          <p className="mt-3 text-sm text-white/65 max-w-md mx-auto">
            Penilaian dimulai dari halaman daftar mahasiswa atau jadwal ujian.
          </p>
          <div className="flex items-center justify-center gap-3 mt-6">
            <Button onClick={() => router.push("/instruktur/mahasiswa-list")} className="rounded-xl h-11 px-6" style={{ background: C.gold, color: C.emeraldDeep }}>
              <Users className="w-4 h-4 mr-2" /> Daftar Mahasiswa
            </Button>
            <Button onClick={() => router.push("/instruktur/jadwal-mengajar")} variant="outline" className="rounded-xl h-11 px-6 border-white/20 bg-white/5 text-white hover:bg-white/10">
              Jadwal Tes
            </Button>
          </div>
        </section>
      </div>
    );
  }

  // === Loading ===
  if (isLoadingStudents) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 rounded-3xl" style={{ background: "hsl(40 22% 90%)" }} />
        <div className="h-96 rounded-3xl" style={{ background: "hsl(40 22% 90%)" }} />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="rounded-3xl border p-12 text-center" style={{ background: C.bgSoft, borderColor: C.taupe }}>
        <p className="font-display italic text-xl text-foreground">Mahasiswa tidak ditemukan</p>
        <Button onClick={() => router.push("/instruktur/mahasiswa-list")} className="mt-4 rounded-xl" style={{ background: C.emerald, color: C.cream }}>
          Kembali ke daftar
        </Button>
      </div>
    );
  }

  const scoreCategories = [
    { label: "Tajwid", value: tajwid, setter: setTajwid, desc: "Ketepatan hukum bacaan Al-Qur'an", icon: BookOpen },
    { label: "Kelancaran", value: kelancaran, setter: setKelancaran, desc: "Kefasihan dan kelancaran membaca", icon: Sparkles },
    { label: "Makhorijul Huruf", value: makhorijul, setter: setMakhorijul, desc: "Ketepatan tempat keluarnya huruf", icon: Mic2 },
    { label: "Adab", value: adab, setter: setAdab, desc: "Adab dan etika saat membaca", icon: Heart },
  ];

  const scoreColor = (v: number) => (v >= 80 ? C.sage : v >= 70 ? C.emeraldSoft : v >= 60 ? C.goldDeep : C.rose);
  const grade = totalScore >= 90 ? "Mumtaz" : totalScore >= 80 ? "Jayyid Jiddan" : totalScore >= 70 ? "Jayyid" : totalScore >= 60 ? "Maqbul" : "Rasib";

  return (
    <div className="space-y-7 animate-in fade-in duration-500">
      <button
        data-testid="button-back"
        onClick={() => router.push("/instruktur/mahasiswa-list")}
        className="inline-flex items-center gap-2 text-sm font-semibold transition-colors hover:underline"
        style={{ color: C.emerald }}
      >
        <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Mahasiswa
      </button>

      {/* === Student hero === */}
      <section
        className="relative rounded-3xl p-6 md:p-7 overflow-hidden border"
        style={{
          background:
            "radial-gradient(ellipse 60% 80% at 100% 0%, hsl(38 60% 60% / 0.18), transparent 60%)," +
            "linear-gradient(135deg, hsl(168 50% 18%) 0%, hsl(172 55% 14%) 100%)",
          borderColor: "hsl(168 30% 18%)",
        }}
      >
        <svg className="absolute -right-10 -bottom-12 w-56 h-56 opacity-[0.07]" viewBox="0 0 100 100" fill="none" stroke="#E8D5A8" strokeWidth="0.5">
          <path d="M50 5 L70 30 L95 50 L70 70 L50 95 L30 70 L5 50 L30 30 Z" />
        </svg>
        <div className="relative z-10 flex flex-wrap items-center gap-5">
          {student.nim ? (
            <img
              src={getMahasiswaPhotoUrl(student.nim)}
              alt={student.name}
              className="w-20 h-20 rounded-2xl object-cover border-2 flex-shrink-0"
              style={{ borderColor: `${C.gold}88` }}
              onError={(e) => {
                const t = e.target as HTMLImageElement;
                t.outerHTML = `<div class="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold border-2 flex-shrink-0" style="background:${C.gold};color:${C.emeraldDeep};border-color:${C.gold}88">${student.name.charAt(0)}</div>`;
              }}
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold border-2" style={{ background: C.gold, color: C.emeraldDeep, borderColor: `${C.gold}88` }}>
              {student.name.charAt(0)}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="text-[11px] tracking-[0.28em] uppercase font-semibold text-[hsl(38_85%_88%)]">{existing ? "Sesi Penilaian Baru" : "Penilaian Pertama"}</p>
            <h1 className="font-display italic text-3xl md:text-4xl mt-1 text-white truncate">{student.name}</h1>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-white/65">
              {student.nim && <span>NIM <span className="font-mono">{student.nim}</span></span>}
              {student.faculty && <span>· {student.faculty}</span>}
              {student.program && <span>· {student.program}</span>}
            </div>
          </div>

          {existing && (
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-widest text-white/50">Sesi Sebelumnya</p>
              <p className="font-display italic text-3xl text-[hsl(38_65%_85%)]">{existing.totalScore}/100</p>
              <p className="text-[11px] mt-0.5" style={{ color: existing.passed ? C.goldSoft : "#fde68a" }}>
                {existing.passed ? "Lulus" : "Perlu Mengulang"}
              </p>
            </div>
          )}
        </div>
      </section>

      {existing && !existing.passed && (
        <div className="rounded-2xl p-4 flex items-start gap-3 border" style={{ background: "#FEF3C7", borderColor: "#FBBF24" }}>
          <RotateCcw className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#D97706" }} />
          <div>
            <p className="text-sm font-bold" style={{ color: "#92400E" }}>Sesi Ulangan</p>
            <p className="text-xs mt-0.5" style={{ color: "#92400E" }}>
              Mahasiswa diminta mengulang pada sesi sebelumnya. Penilaian ini akan disimpan sebagai percobaan baru.
            </p>
          </div>
        </div>
      )}

      {/* === Score categories === */}
      <section className="rounded-3xl border p-6 md:p-8" style={{ background: "#fff", borderColor: C.taupe }}>
        <div className="flex items-center gap-3 mb-6">
          <NotebookPen className="w-5 h-5" style={{ color: C.gold }} />
          <h3 className="font-display italic text-2xl text-foreground">Aspek Penilaian</h3>
          <span className="text-[hsl(38_55%_56%)] text-base ml-1">۞</span>
        </div>

        <div className="space-y-7">
          {scoreCategories.map((cat) => {
            const Icon = cat.icon;
            const color = scoreColor(cat.value);
            return (
              <div key={cat.label} className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${C.emerald}10`, color: C.emerald }}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground">{cat.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{cat.desc}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="font-display italic text-3xl tabular-nums leading-none" style={{ color }}>{cat.value}</span>
                    <p className="text-[10px] tracking-widest uppercase text-muted-foreground mt-1">/100</p>
                  </div>
                </div>
                <Slider
                  data-testid={`slider-${cat.label.toLowerCase().replace(/\s+/g, "-")}`}
                  value={[cat.value]}
                  onValueChange={([v]) => cat.setter(v)}
                  min={0} max={100} step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
                  <span>0 — Rasib</span>
                  <span>60 — Maqbul</span>
                  <span>70 — Jayyid</span>
                  <span>100 — Mumtaz</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* === Total summary === */}
        <div
          className="mt-8 rounded-2xl p-5 md:p-6 flex flex-wrap items-center justify-between gap-4 border"
          style={{
            background: passed ? `${C.sage}12` : "#FEF3C7",
            borderColor: passed ? `${C.sage}55` : "#FBBF24",
          }}
        >
          <div>
            <p className="text-[11px] tracking-[0.22em] uppercase font-semibold text-muted-foreground">Total Skor</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-display italic text-5xl tabular-nums" style={{ color: passed ? C.sage : "#D97706" }}>{totalScore}</span>
              <span className="text-sm text-muted-foreground">/100</span>
            </div>
            <p className="text-xs mt-1 italic" style={{ color: passed ? C.sage : "#D97706" }}>{grade}</p>
          </div>
          <span
            className="px-5 py-2.5 rounded-full text-sm font-bold tracking-wider uppercase"
            style={{ background: passed ? C.sage : "#D97706", color: "#fff" }}
          >
            {passed ? "✓ Lulus" : "Perlu Mengulang"}
          </span>
        </div>

        {/* === Outcome chooser — instruktur memutuskan secara manual === */}
        <div className="mt-6 space-y-2">
          <p className="text-sm font-bold flex items-center gap-2" style={{ color: C.emerald }}>
            <CheckCircle2 className="w-4 h-4" /> Keputusan Akhir
          </p>
          <p className="text-xs text-muted-foreground">
            Pilih hasil sesi ini. Default mengikuti ambang skor (≥70 = Lulus), tapi Anda boleh mengubahnya berdasarkan penilaian Anda.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              data-testid="outcome-lulus"
              onClick={() => setOutcome("lulus")}
              className="rounded-xl border-2 p-4 text-left transition-all"
              style={{
                borderColor: effectiveOutcome === "lulus" ? C.sage : C.taupe,
                background: effectiveOutcome === "lulus" ? `${C.sage}10` : "#fff",
              }}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" style={{ color: C.sage }} />
                <p className="font-bold text-sm" style={{ color: C.sage }}>LULUS</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Mahasiswa lulus. Tagihan biaya sertifikat dibuat otomatis.
              </p>
            </button>
            <button
              type="button"
              data-testid="outcome-perlu-mengulang"
              onClick={() => setOutcome("perlu_mengulang")}
              className="rounded-xl border-2 p-4 text-left transition-all"
              style={{
                borderColor: effectiveOutcome === "perlu_mengulang" ? "#D97706" : C.taupe,
                background: effectiveOutcome === "perlu_mengulang" ? "#FEF3C7" : "#fff",
              }}
            >
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5" style={{ color: "#D97706" }} />
                <p className="font-bold text-sm" style={{ color: "#D97706" }}>PERLU MENGULANG</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Mahasiswa diminta mengulang pada sesi berikutnya. Tanpa biaya tambahan.
              </p>
            </button>
          </div>
        </div>

        {/* === Notes === */}
        <div className="mt-7 space-y-2">
          <label className="text-sm font-bold flex items-center gap-2" style={{ color: C.emerald }}>
            <NotebookPen className="w-4 h-4" /> Catatan Instruktur
          </label>
          <Textarea
            data-testid="textarea-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Tuliskan catatan, saran muraja'ah, atau ayat yang perlu diperbaiki..."
            className="rounded-xl min-h-[120px] resize-none"
            style={{ background: C.bgSoft, borderColor: C.taupe }}
          />
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Button
            data-testid="button-simpan-penilaian"
            onClick={() => setShowConfirm(true)}
            className="rounded-xl h-12 px-8 font-semibold transition-all"
            style={{
              background: C.emerald,
              color: C.cream,
              boxShadow: `0 8px 20px ${C.emerald}33`,
            }}
          >
            <Save className="w-4 h-4 mr-2" />
            Simpan Penilaian
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/instruktur/mahasiswa-list")}
            className="rounded-xl h-12 px-6"
            style={{ borderColor: C.taupe }}
          >
            Batal
          </Button>
        </div>
      </section>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="rounded-2xl" style={{ background: C.cream, borderColor: C.taupe }}>
          <DialogHeader>
            <DialogTitle className="font-display italic text-2xl" style={{ color: C.emerald }}>
              Konfirmasi Penilaian
            </DialogTitle>
            <DialogDescription className="text-sm" style={{ color: C.emeraldSoft }}>
              Simpan penilaian untuk <span className="font-semibold">{student.name}</span>?
              <br />
              Skor total: <span className="font-bold">{totalScore}/100</span> ({grade}) —{" "}
              <span className="font-bold" style={{ color: passed ? C.sage : "#D97706" }}>
                {passed ? "Lulus" : "Perlu Mengulang"}
              </span>
              {passed && (
                <span className="block text-xs mt-2 italic" style={{ color: C.emeraldSoft }}>
                  Tagihan biaya sertifikat akan otomatis dibuat untuk mahasiswa.
                </span>
              )}
              {!passed && (
                <span className="block text-xs mt-2 italic" style={{ color: C.emeraldSoft }}>
                  Mahasiswa akan diberitahu untuk mengulang pada sesi berikutnya.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirm(false)} className="rounded-xl" style={{ borderColor: C.taupe }}>
              Batal
            </Button>
            <Button
              data-testid="button-confirm-save"
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="rounded-xl"
              style={{ background: C.emerald, color: C.cream }}
            >
              {mutation.isPending ? "Menyimpan..." : "Ya, Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
