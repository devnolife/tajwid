import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { Award, Download, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Assessment } from "@shared/schema";

export default function Sertifikat() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: assessments, isLoading } = useQuery<Assessment[]>({
    queryKey: ["/api/assessments", `?studentId=${user?.id}`],
  });

  const assessment = assessments?.[0];
  const passed = assessment?.passed;

  if (isLoading) {
    return <div className="h-64 rounded-2xl bg-gray-100 animate-pulse" />;
  }

  if (!passed) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ background: "#FEE2E2" }}>
          <Lock className="w-10 h-10 text-red-400" />
        </div>
        <h3 className="text-lg font-semibold mb-2" style={{ color: "#1A1A1A" }}>Sertifikat Belum Tersedia</h3>
        <p className="text-sm text-center max-w-md" style={{ color: "#888" }}>
          {!assessment
            ? "Anda belum menyelesaikan tes mengaji. Sertifikat akan tersedia setelah Anda dinyatakan lulus."
            : "Maaf, Anda belum dinyatakan lulus. Silakan hubungi instruktur untuk informasi lebih lanjut."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="rounded-2xl border overflow-hidden" style={{ background: "#fff", borderColor: "#e8e4db" }}>
        <div className="p-6">
          <h3 className="text-lg font-semibold" style={{ color: "#1A1A1A" }}>Sertifikat Kelulusan Mengaji</h3>
          <p className="text-sm mt-1" style={{ color: "#888" }}>Selamat! Anda telah dinyatakan lulus.</p>
        </div>

        <div className="mx-6 mb-6 rounded-2xl border-2 p-8 md:p-12 text-center relative overflow-hidden" style={{ borderColor: "#A2CB8B", background: "#FFFDF7" }}>
          <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="cert-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M20 0 L40 20 L20 40 L0 20Z" fill="none" stroke="#A2CB8B" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#cert-pattern)" />
          </svg>
          <div className="relative z-10">
            <div className="flex justify-center mb-4">
              <Award className="w-12 h-12" style={{ color: "#A2CB8B" }} />
            </div>
            <p className="text-sm font-medium tracking-widest uppercase" style={{ color: "#A2CB8B" }}>Sertifikat Kelulusan</p>
            <h2 className="text-xl font-serif font-bold mt-2" style={{ color: "#84B179" }}>Ujian Kemampuan Mengaji Al-Quran</h2>
            <div className="my-6">
              <p className="text-sm" style={{ color: "#888" }}>Diberikan kepada:</p>
              <p className="text-2xl font-serif font-bold mt-1" style={{ color: "#1A1A1A" }}>{user?.name}</p>
              <p className="text-sm mt-1" style={{ color: "#666" }}>NIM: {user?.nim} · {user?.faculty}</p>
            </div>
            <p className="text-sm" style={{ color: "#666" }}>
              Telah dinyatakan <strong style={{ color: "#059669" }}>LULUS</strong> dengan nilai {assessment?.totalScore}/100
            </p>
            <div className="mt-8 pt-6 border-t" style={{ borderColor: "#e8e4db" }}>
              <p className="text-xs" style={{ color: "#999" }}>Tahun Akademik 2025/2026</p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          <Button
            data-testid="button-download-certificate"
            className="rounded-xl h-11"
            style={{ background: "#84B179", color: "#fff" }}
            onClick={() => toast({ title: "Info", description: "Fitur unduh sertifikat PDF akan segera tersedia" })}
          >
            <Download className="w-4 h-4 mr-2" />
            Unduh Sertifikat (PDF)
          </Button>
        </div>
      </div>
    </div>
  );
}
