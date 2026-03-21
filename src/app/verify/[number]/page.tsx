"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, ShieldCheck, CalendarDays, GraduationCap, Award } from "lucide-react";
import Image from "next/image";

interface CertificateData {
  certificateNumber: string;
  studentName: string;
  studentNim: string | null;
  studentFaculty: string | null;
  studentProgram: string | null;
  totalScore: number;
  academicYear: string;
  signerName: string;
  signerTitle: string;
  issuedAt: string;
}

export default function VerifyCertificate() {
  const { number } = useParams<{ number: string }>();
  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [cert, setCert] = useState<CertificateData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function verify() {
      try {
        const res = await fetch(`/api/certificates/verify/${number}`);
        const data = await res.json();
        if (data.valid) {
          setValid(true);
          setCert(data.certificate);
        } else {
          setValid(false);
          setError(data.message || "Sertifikat tidak valid");
        }
      } catch {
        setError("Gagal memverifikasi sertifikat");
      } finally {
        setLoading(false);
      }
    }
    verify();
  }, [number]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#FAFAF7" }}>
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto" style={{ color: "#84B179" }} />
          <p className="text-sm" style={{ color: "#666" }}>Memverifikasi sertifikat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#FAFAF7" }}>
      {/* Header */}
      <header className="border-b" style={{ background: "#fff", borderColor: "#e8e4db" }}>
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Image src="/logo/logo.png" alt="TajwidKu" width={36} height={36} />
          <div>
            <h1 className="font-semibold text-sm" style={{ color: "#1A1A1A" }}>TajwidKu</h1>
            <p className="text-xs" style={{ color: "#888" }}>Verifikasi Sertifikat Digital</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {!valid ? (
          /* Invalid Certificate */
          <div className="rounded-2xl border p-8 text-center" style={{ background: "#fff", borderColor: "#FCA5A5" }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#FEE2E2" }}>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: "#DC2626" }}>Sertifikat Tidak Valid</h2>
            <p className="text-sm mb-2" style={{ color: "#666" }}>{error}</p>
            <p className="text-xs font-mono px-3 py-1.5 rounded-lg inline-block" style={{ background: "#F3F4F6", color: "#888" }}>
              Nomor: {number}
            </p>
          </div>
        ) : cert && (
          /* Valid Certificate */
          <div className="space-y-6">
            {/* Verification Badge */}
            <div className="rounded-2xl border p-6 flex items-center gap-4" style={{ background: "#F0FDF4", borderColor: "#BBF7D0" }}>
              <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0" style={{ background: "#DCFCE7" }}>
                <ShieldCheck className="w-7 h-7" style={{ color: "#16A34A" }} />
              </div>
              <div>
                <h2 className="font-bold" style={{ color: "#16A34A" }}>Sertifikat Terverifikasi</h2>
                <p className="text-sm mt-0.5" style={{ color: "#15803D" }}>
                  Sertifikat ini asli dan dikeluarkan oleh sistem TajwidKu
                </p>
              </div>
              <CheckCircle2 className="w-6 h-6 ml-auto shrink-0" style={{ color: "#16A34A" }} />
            </div>

            {/* Certificate Details */}
            <div className="rounded-2xl border overflow-hidden" style={{ background: "#fff", borderColor: "#e8e4db" }}>
              {/* Certificate Header with Logos */}
              <div className="p-6 border-b flex items-center justify-center gap-6" style={{ borderColor: "#e8e4db", background: "#FFFDF7" }}>
                <Image src="/logo/universitas.png" alt="Universitas" width={56} height={56} className="object-contain" />
                <div className="text-center">
                  <p className="text-xs font-medium tracking-widest uppercase" style={{ color: "#84B179" }}>Sertifikat Kelulusan</p>
                  <h3 className="font-serif font-bold text-lg mt-0.5" style={{ color: "#1A1A1A" }}>Ujian Kemampuan Tajwid Al-Quran</h3>
                </div>
                <Image src="/logo/teknik.png" alt="Fakultas" width={56} height={56} className="object-contain" />
              </div>

              {/* Details Grid */}
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DetailItem icon={<Award className="w-4 h-4" />} label="Nomor Sertifikat" value={cert.certificateNumber} mono />
                  <DetailItem icon={<CalendarDays className="w-4 h-4" />} label="Tanggal Terbit" value={formatDate(cert.issuedAt)} />
                  <DetailItem icon={<GraduationCap className="w-4 h-4" />} label="Nama Mahasiswa" value={cert.studentName} bold />
                  <DetailItem label="NIM" value={cert.studentNim || "-"} />
                  <DetailItem label="Fakultas" value={cert.studentFaculty || "-"} />
                  <DetailItem label="Program Studi" value={cert.studentProgram || "-"} />
                  <DetailItem label="Nilai Total" value={`${cert.totalScore}/100`} bold />
                  <DetailItem label="Tahun Akademik" value={cert.academicYear} />
                </div>

                {/* Signer */}
                <div className="mt-6 pt-4 border-t text-center" style={{ borderColor: "#e8e4db" }}>
                  <p className="text-xs" style={{ color: "#999" }}>Ditandatangani secara digital oleh:</p>
                  <p className="font-semibold mt-1" style={{ color: "#1A1A1A" }}>{cert.signerName}</p>
                  <p className="text-sm" style={{ color: "#666" }}>{cert.signerTitle}</p>
                </div>
              </div>
            </div>

            {/* Footer Info */}
            <p className="text-xs text-center" style={{ color: "#999" }}>
              Verifikasi dilakukan pada {new Date().toLocaleDateString("id-ID", { dateStyle: "full" })} pukul {new Date().toLocaleTimeString("id-ID")}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function DetailItem({ icon, label, value, mono, bold }: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
  bold?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs flex items-center gap-1.5" style={{ color: "#999" }}>
        {icon}
        {label}
      </p>
      <p
        className={`text-sm ${mono ? "font-mono" : ""} ${bold ? "font-semibold" : ""}`}
        style={{ color: "#1A1A1A" }}
      >
        {value}
      </p>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
