"use client";

import { useAuth } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
import { FileText, CheckCircle, RotateCcw, History } from "lucide-react";
import type { Assessment } from "@shared/schema";

export default function HasilTajwid() {
  const { user } = useAuth();

  const { data: assessments, isLoading } = useQuery<Assessment[]>({
    queryKey: ["/api/assessments", `?studentId=${user?.id}`],
  });

  // API mengembalikan riwayat dari yang terbaru ke yang terlama.
  const history = assessments ?? [];
  const assessment = history[0];

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-64 rounded-2xl bg-gray-100" />
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ background: "#E0E7FF" }}>
          <FileText className="w-10 h-10 text-indigo-600" />
        </div>
        <h3 className="text-lg font-semibold mb-2" style={{ color: "#1A1A1A" }}>Belum Ada Hasil Penilaian</h3>
        <p className="text-sm text-center max-w-md" style={{ color: "#888" }}>
          Hasil akan muncul setelah instruktur menilai sesi mengaji Anda.
        </p>
      </div>
    );
  }

  const categories = [
    { label: "Tajwid", value: assessment.tajwid, color: "#84B179" },
    { label: "Kelancaran", value: assessment.kelancaran, color: "#A2CB8B" },
    { label: "Makhorijul Huruf", value: assessment.makhorijulHuruf, color: "#A2CB8B" },
    { label: "Adab / Sopan Santun", value: assessment.adab, color: "#059669" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="rounded-2xl border p-6 md:p-8" style={{ background: "#fff", borderColor: "#e8e4db" }}>
        <div className="flex items-start justify-between mb-8 gap-3 flex-wrap">
          <div>
            <h3 className="text-lg font-semibold" style={{ color: "#1A1A1A" }}>Hasil Penilaian Terakhir</h3>
            <p className="text-sm mt-1" style={{ color: "#888" }}>
              Dinilai pada {assessment.assessedAt ? new Date(assessment.assessedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}
            </p>
          </div>
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full"
            data-testid="badge-result"
            style={{
              background: assessment.passed ? "#D1FAE5" : "#FEF3C7",
              color: assessment.passed ? "#059669" : "#D97706",
            }}
          >
            {assessment.passed ? <CheckCircle className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
            <span className="text-sm font-bold">{assessment.passed ? "LULUS" : "PERLU MENGULANG"}</span>
          </div>
        </div>

        <div className="flex items-center justify-center mb-8">
          <div className="relative w-36 h-36">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#e8e4db" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="42" fill="none"
                stroke={assessment.passed ? "#84B179" : "#D97706"}
                strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${(assessment.totalScore / 100) * 264} 264`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold" style={{ color: "#1A1A1A" }}>{assessment.totalScore}</span>
              <span className="text-xs" style={{ color: "#888" }}>dari 100</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {categories.map((cat) => (
            <div key={cat.label} className="rounded-xl p-4" style={{ background: "#faf8f3" }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium" style={{ color: "#1A1A1A" }}>{cat.label}</span>
                <span className="text-sm font-bold" style={{ color: cat.color }}>{cat.value}/100</span>
              </div>
              <div className="w-full h-2 rounded-full" style={{ background: "#e8e4db" }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${cat.value}%`, background: cat.color }}
                />
              </div>
            </div>
          ))}
        </div>

        {!assessment.passed && (
          <div className="mt-6 rounded-xl p-4 flex items-start gap-3" style={{ background: "#FEF3C7" }}>
            <RotateCcw className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#D97706" }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: "#92400E" }}>Anda diminta untuk mengulang.</p>
              <p className="text-xs mt-1" style={{ color: "#92400E" }}>
                Pelajari catatan instruktur, lalu hadiri jadwal sesi berikutnya. Tidak ada biaya
                tambahan untuk mengulang — pembayaran sertifikat hanya muncul setelah Anda dinyatakan lulus.
              </p>
            </div>
          </div>
        )}
      </div>

      {assessment.notes && (
        <div className="rounded-2xl border p-6" style={{ background: "#fff", borderColor: "#e8e4db" }}>
          <h3 className="text-base font-semibold mb-3" style={{ color: "#1A1A1A" }}>Catatan Instruktur</h3>
          <p className="text-sm leading-relaxed" style={{ color: "#555" }}>{assessment.notes}</p>
        </div>
      )}

      {history.length > 1 && (
        <div className="rounded-2xl border p-6" style={{ background: "#fff", borderColor: "#e8e4db" }}>
          <div className="flex items-center gap-2 mb-4">
            <History className="w-4 h-4" style={{ color: "#84B179" }} />
            <h3 className="text-base font-semibold" style={{ color: "#1A1A1A" }}>Riwayat Penilaian</h3>
          </div>
          <ul className="space-y-2">
            {history.map((a, i) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-3 rounded-xl px-4 py-3"
                style={{ background: "#faf8f3" }}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium" style={{ color: "#1A1A1A" }}>
                    Percobaan ke-{history.length - i}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#888" }}>
                    {a.assessedAt ? new Date(a.assessedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-bold tabular-nums" style={{ color: "#1A1A1A" }}>{a.totalScore}/100</span>
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full"
                    style={{
                      background: a.passed ? "#D1FAE5" : "#FEF3C7",
                      color: a.passed ? "#059669" : "#D97706",
                    }}
                  >
                    {a.passed ? "Lulus" : "Perlu Mengulang"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
