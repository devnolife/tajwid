"use client";

import { useAuth } from "@/lib/auth-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Award, Download, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
import Image from "next/image";
import type { Assessment, Certificate } from "@shared/schema";

export default function Sertifikat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: assessments, isLoading: loadingAssessment } = useQuery<Assessment[]>({
    queryKey: ["/api/assessments", `?studentId=${user?.id}`],
  });

  const { data: certificate, isLoading: loadingCert } = useQuery<Certificate | null>({
    queryKey: ["/api/certificates", user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/certificates?studentId=${user?.id}`);
      return res.json();
    },
    enabled: !!user?.id,
  });

  const generateCert = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: user?.id }),
      });
      if (!res.ok) throw new Error("Gagal generate sertifikat");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certificates", user?.id] });
      toast({ title: "Berhasil", description: "Sertifikat berhasil digenerate!" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const assessment = assessments?.[0];
  const passed = assessment?.passed;
  const isLoading = loadingAssessment || loadingCert;

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
            ? "Anda belum menyelesaikan tes tajwid. Sertifikat akan tersedia setelah Anda dinyatakan lulus."
            : "Maaf, Anda belum dinyatakan lulus. Silakan hubungi instruktur untuk informasi lebih lanjut."}
        </p>
      </div>
    );
  }

  const verifyUrl = certificate?.certificateNumber
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/verify/${certificate.certificateNumber}`
    : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="rounded-2xl border overflow-hidden" style={{ background: "#fff", borderColor: "#e8e4db" }}>
        <div className="p-6">
          <h3 className="text-lg font-semibold" style={{ color: "#1A1A1A" }}>Sertifikat Kelulusan TajwidKu</h3>
          <p className="text-sm mt-1" style={{ color: "#888" }}>Selamat! Anda telah dinyatakan lulus.</p>
        </div>

        {/* Certificate Card */}
        <div className="mx-6 mb-6 rounded-2xl border-2 p-8 md:p-12 relative overflow-hidden" style={{ borderColor: "#A2CB8B", background: "#FFFDF7" }}>
          {/* Background Pattern */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="cert-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M20 0 L40 20 L20 40 L0 20Z" fill="none" stroke="#A2CB8B" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#cert-pattern)" />
          </svg>

          <div className="relative z-10">
            {/* Logos Header */}
            <div className="flex items-center justify-center gap-4 md:gap-8 mb-6">
              <Image src="/logo/universitas.png" alt="Logo Universitas" width={64} height={64} className="object-contain" />
              <Image src="/logo/logo.png" alt="Logo TajwidKu" width={56} height={56} className="object-contain" />
              <Image src="/logo/teknik.png" alt="Logo Fakultas" width={64} height={64} className="object-contain" />
            </div>

            {/* Title */}
            <div className="text-center mb-6">
              <p className="text-xs font-medium tracking-[0.2em] uppercase" style={{ color: "#A2CB8B" }}>Sertifikat Kelulusan</p>
              <h2 className="text-xl md:text-2xl font-serif font-bold mt-1" style={{ color: "#84B179" }}>Ujian Kemampuan Tajwid Al-Quran</h2>
              {certificate?.certificateNumber && (
                <p className="text-xs font-mono mt-2 px-3 py-1 rounded-full inline-block" style={{ background: "#F0FDF4", color: "#84B179" }}>
                  No: {certificate.certificateNumber}
                </p>
              )}
            </div>

            {/* Separator */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px" style={{ background: "#e8e4db" }} />
              <Award className="w-5 h-5" style={{ color: "#A2CB8B" }} />
              <div className="flex-1 h-px" style={{ background: "#e8e4db" }} />
            </div>

            {/* Student Info */}
            <div className="text-center my-6">
              <p className="text-sm" style={{ color: "#888" }}>Diberikan kepada:</p>
              <p className="text-2xl md:text-3xl font-serif font-bold mt-2" style={{ color: "#1A1A1A" }}>{user?.name}</p>
              <p className="text-sm mt-2" style={{ color: "#666" }}>
                NIM: {user?.nim} {user?.faculty && `· ${user.faculty}`}
              </p>
            </div>

            {/* Result */}
            <div className="text-center my-6">
              <p className="text-sm" style={{ color: "#666" }}>
                Telah dinyatakan <strong className="text-lg" style={{ color: "#059669" }}>LULUS</strong> dengan nilai:
              </p>
              <p className="text-4xl font-bold mt-2" style={{ color: "#84B179" }}>{assessment?.totalScore}<span className="text-lg font-normal">/100</span></p>
            </div>

            {/* Scores Detail */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-6">
              <ScoreItem label="Tajwid" value={assessment?.tajwid || 0} />
              <ScoreItem label="Kelancaran" value={assessment?.kelancaran || 0} />
              <ScoreItem label="Makhorijul Huruf" value={assessment?.makhorijulHuruf || 0} />
              <ScoreItem label="Adab" value={assessment?.adab || 0} />
            </div>

            {/* Separator */}
            <div className="h-px my-6" style={{ background: "#e8e4db" }} />

            {/* Signature + QR Section */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Academic Year */}
              <div className="text-center md:text-left">
                <p className="text-xs" style={{ color: "#999" }}>Tahun Akademik</p>
                <p className="text-sm font-medium" style={{ color: "#1A1A1A" }}>{certificate?.academicYear || "2025/2026"}</p>
                {certificate?.issuedAt && (
                  <>
                    <p className="text-xs mt-2" style={{ color: "#999" }}>Diterbitkan pada</p>
                    <p className="text-sm" style={{ color: "#1A1A1A" }}>
                      {new Date(certificate.issuedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </>
                )}
              </div>

              {/* QR Code */}
              {verifyUrl && (
                <div className="flex flex-col items-center gap-2">
                  <div className="p-2 rounded-xl border" style={{ borderColor: "#e8e4db", background: "#fff" }}>
                    <QRCodeSVG
                      value={verifyUrl}
                      size={100}
                      bgColor="#FFFFFF"
                      fgColor="#1A1A1A"
                      level="M"
                    />
                  </div>
                  <p className="text-[10px]" style={{ color: "#999" }}>Scan untuk verifikasi</p>
                </div>
              )}

              {/* Digital Signature */}
              <div className="text-center">
                <p className="text-xs" style={{ color: "#999" }}>Ditandatangani secara digital</p>
                <div className="mt-3 mb-1">
                  <div className="w-32 h-px mx-auto" style={{ background: "#1A1A1A" }} />
                </div>
                <p className="font-semibold text-sm" style={{ color: "#1A1A1A" }}>
                  {certificate?.signerName || "Dr. Alamsyah, S.Pd.I., M.H."}
                </p>
                <p className="text-xs" style={{ color: "#666" }}>
                  {certificate?.signerTitle || "Wakil Dekan IV"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex flex-wrap gap-3">
          {!certificate?.certificateNumber ? (
            <Button
              className="rounded-xl h-11"
              style={{ background: "#84B179", color: "#fff" }}
              onClick={() => generateCert.mutate()}
              disabled={generateCert.isPending}
            >
              {generateCert.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Award className="w-4 h-4 mr-2" />
              )}
              Generate Sertifikat
            </Button>
          ) : (
            <Button
              data-testid="button-download-certificate"
              className="rounded-xl h-11"
              style={{ background: "#84B179", color: "#fff" }}
              onClick={() => window.open("/certificate", "_blank")}
            >
              <Download className="w-4 h-4 mr-2" />
              Unduh Sertifikat (PDF)
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ScoreItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center p-3 rounded-xl" style={{ background: "#F0FDF4" }}>
      <p className="text-xs" style={{ color: "#888" }}>{label}</p>
      <p className="text-lg font-bold mt-0.5" style={{ color: "#84B179" }}>{value}</p>
    </div>
  );
}

