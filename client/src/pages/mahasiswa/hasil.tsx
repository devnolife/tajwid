import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { FileText, CheckCircle, XCircle } from "lucide-react";
import type { Assessment } from "@shared/schema";

export default function HasilMengaji() {
  const { user } = useAuth();

  const { data: assessments, isLoading } = useQuery<Assessment[]>({
    queryKey: ["/api/assessments", `?studentId=${user?.id}`],
  });

  const assessment = assessments?.[0];

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
          Hasil penilaian akan muncul setelah Anda menyelesaikan tes mengaji.
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
        <div className="flex items-start justify-between mb-8">
          <div>
            <h3 className="text-lg font-semibold" style={{ color: "#1A1A1A" }}>Hasil Penilaian Mengaji</h3>
            <p className="text-sm mt-1" style={{ color: "#888" }}>
              Dinilai pada {assessment.assessedAt ? new Date(assessment.assessedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}
            </p>
          </div>
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full"
            data-testid="badge-result"
            style={{
              background: assessment.passed ? "#D1FAE5" : "#FEE2E2",
              color: assessment.passed ? "#059669" : "#DC2626",
            }}
          >
            {assessment.passed ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            <span className="text-sm font-bold">{assessment.passed ? "LULUS" : "TIDAK LULUS"}</span>
          </div>
        </div>

        <div className="flex items-center justify-center mb-8">
          <div className="relative w-36 h-36">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#e8e4db" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="42" fill="none"
                stroke={assessment.passed ? "#84B179" : "#DC2626"}
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
      </div>

      {assessment.notes && (
        <div className="rounded-2xl border p-6" style={{ background: "#fff", borderColor: "#e8e4db" }}>
          <h3 className="text-base font-semibold mb-3" style={{ color: "#1A1A1A" }}>Catatan Instruktur</h3>
          <p className="text-sm leading-relaxed" style={{ color: "#555" }}>{assessment.notes}</p>
        </div>
      )}
    </div>
  );
}
