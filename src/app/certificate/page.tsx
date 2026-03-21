"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-client";
import { Award, Printer, ArrowLeft, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { Assessment, Certificate } from "@shared/schema";

interface CertificateData {
  certificate: Certificate;
  assessment: Assessment;
  studentName: string;
  studentNim: string | null;
  studentFaculty: string | null;
  studentProgram: string | null;
}

export default function CertificatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#faf8f3]">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#84B179" }} />
      </div>
    }>
      <CertificatePreview />
    </Suspense>
  );
}

function CertificatePreview() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const studentIdParam = searchParams.get("studentId");
  const studentId = studentIdParam || user?.id;

  const [data, setData] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) return;

    async function fetchData() {
      try {
        // Fetch assessment
        const assessRes = await fetch(`/api/assessments?studentId=${studentId}`);
        const assessments: Assessment[] = await assessRes.json();
        const assessment = assessments?.[0];
        if (!assessment?.passed) {
          setError("Mahasiswa belum dinyatakan lulus.");
          setLoading(false);
          return;
        }

        // Generate/fetch certificate
        const certRes = await fetch("/api/certificates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId }),
        });
        if (!certRes.ok) throw new Error("Gagal memuat sertifikat");
        const certificate: Certificate = await certRes.json();

        // Fetch student info
        const userRes = await fetch(`/api/users?role=mahasiswa`);
        const users = await userRes.json();
        const student = users.find((u: any) => u.id === studentId);

        setData({
          certificate,
          assessment,
          studentName: certificate.studentName || student?.name || "-",
          studentNim: certificate.studentNim || student?.nim || null,
          studentFaculty: certificate.studentFaculty || student?.faculty || null,
          studentProgram: certificate.studentProgram || student?.program || null,
        });
      } catch {
        setError("Gagal memuat data sertifikat.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [studentId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8f3]">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#84B179" }} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#faf8f3] gap-4">
        <p className="text-red-500 font-medium">{error || "Data tidak ditemukan"}</p>
        <button onClick={() => window.history.back()} className="text-sm underline" style={{ color: "#84B179" }}>
          Kembali
        </button>
      </div>
    );
  }

  const { certificate, assessment } = data;
  const verifyUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/verify/${certificate.certificateNumber}`;

  return (
    <>
      {/* Print-specific styles */}
      <style jsx global>{`
        @media print {
          body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .print-page { 
            padding: 0 !important; 
            margin: 0 !important; 
            min-height: auto !important; 
            background: white !important; 
          }
          .cert-card { 
            margin: 0 !important; 
            border-radius: 0 !important; 
            border: none !important;
            box-shadow: none !important;
            page-break-inside: avoid;
            width: 100% !important;
            max-width: 100% !important;
          }
          .cert-inner {
            padding: 40px !important;
            border-width: 3px !important;
          }
        }

        @page {
          size: A4 landscape;
          margin: 15mm;
        }
      `}</style>

      <div className="print-page min-h-screen py-8 px-4" style={{ background: "#faf8f3" }}>
        {/* Action Bar - Hidden on print */}
        <div className="no-print max-w-4xl mx-auto mb-6 flex items-center justify-between">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl hover:bg-white transition-colors"
            style={{ color: "#666" }}
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-xl text-white transition-colors hover:opacity-90"
            style={{ background: "#84B179" }}
          >
            <Printer className="w-4 h-4" />
            Cetak / Simpan PDF
          </button>
        </div>

        {/* Certificate */}
        <div className="cert-card max-w-4xl mx-auto rounded-2xl overflow-hidden" style={{ background: "#fff", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
          <div className="cert-inner p-8 md:p-12 lg:p-16 relative overflow-hidden border-[3px] m-4 md:m-6 rounded-2xl" style={{ borderColor: "#A2CB8B", background: "#FFFDF7" }}>
            {/* Background Pattern */}
            <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="cert-bg" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M20 0 L40 20 L20 40 L0 20Z" fill="none" stroke="#A2CB8B" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#cert-bg)" />
            </svg>

            <div className="relative z-10">
              {/* Logos */}
              <div className="flex items-center justify-center gap-6 md:gap-10 mb-8">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo/universitas.png" alt="Logo Universitas" className="w-16 h-16 md:w-20 md:h-20 object-contain" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo/logo.png" alt="Logo TajwidKu" className="w-14 h-14 md:w-16 md:h-16 object-contain" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo/teknik.png" alt="Logo Fakultas" className="w-16 h-16 md:w-20 md:h-20 object-contain" />
              </div>

              {/* Title */}
              <div className="text-center mb-8">
                <p className="text-xs md:text-sm font-medium tracking-[0.25em] uppercase" style={{ color: "#A2CB8B" }}>
                  Sertifikat Kelulusan
                </p>
                <h1 className="text-2xl md:text-3xl font-serif font-bold mt-2" style={{ color: "#84B179" }}>
                  Ujian Kemampuan Tajwid Al-Quran
                </h1>
                <p className="text-xs md:text-sm font-mono mt-3 px-4 py-1.5 rounded-full inline-block" style={{ background: "#F0FDF4", color: "#84B179" }}>
                  No: {certificate.certificateNumber}
                </p>
              </div>

              {/* Separator */}
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px" style={{ background: "#d4cfbf" }} />
                <Award className="w-6 h-6" style={{ color: "#A2CB8B" }} />
                <div className="flex-1 h-px" style={{ background: "#d4cfbf" }} />
              </div>

              {/* Student Info */}
              <div className="text-center my-8">
                <p className="text-sm md:text-base" style={{ color: "#888" }}>Diberikan kepada:</p>
                <p className="text-3xl md:text-4xl font-serif font-bold mt-3" style={{ color: "#1A1A1A" }}>
                  {data.studentName}
                </p>
                <p className="text-sm md:text-base mt-3" style={{ color: "#666" }}>
                  NIM: {data.studentNim || "-"}
                  {data.studentFaculty && ` · ${data.studentFaculty}`}
                  {data.studentProgram && ` · ${data.studentProgram}`}
                </p>
              </div>

              {/* Result */}
              <div className="text-center my-8">
                <p className="text-sm md:text-base" style={{ color: "#666" }}>
                  Telah dinyatakan{" "}
                  <strong className="text-xl" style={{ color: "#059669" }}>LULUS</strong>{" "}
                  dengan nilai:
                </p>
                <p className="text-5xl md:text-6xl font-bold mt-3" style={{ color: "#84B179" }}>
                  {assessment.totalScore}
                  <span className="text-xl font-normal">/100</span>
                </p>
              </div>

              {/* Score Details */}
              <div className="grid grid-cols-4 gap-3 md:gap-4 my-8">
                {[
                  { label: "Tajwid", value: assessment.tajwid },
                  { label: "Kelancaran", value: assessment.kelancaran },
                  { label: "Makhorijul Huruf", value: assessment.makhorijulHuruf },
                  { label: "Adab", value: assessment.adab },
                ].map(item => (
                  <div key={item.label} className="text-center p-3 md:p-4 rounded-xl" style={{ background: "#F0FDF4" }}>
                    <p className="text-xs md:text-sm" style={{ color: "#888" }}>{item.label}</p>
                    <p className="text-xl md:text-2xl font-bold mt-1" style={{ color: "#84B179" }}>{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Separator */}
              <div className="h-px my-8" style={{ background: "#d4cfbf" }} />

              {/* Footer: Academic Info + QR + Signature */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                {/* Academic Info */}
                <div className="text-center md:text-left">
                  <p className="text-xs" style={{ color: "#999" }}>Tahun Akademik</p>
                  <p className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>
                    {certificate.academicYear}
                  </p>
                  {certificate.issuedAt && (
                    <>
                      <p className="text-xs mt-3" style={{ color: "#999" }}>Diterbitkan pada</p>
                      <p className="text-sm" style={{ color: "#1A1A1A" }}>
                        {new Date(certificate.issuedAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </>
                  )}
                </div>

                {/* QR Code */}
                <div className="flex flex-col items-center gap-2">
                  <div className="p-2.5 rounded-xl border" style={{ borderColor: "#e8e4db", background: "#fff" }}>
                    <QRCodeSVG
                      value={verifyUrl}
                      size={110}
                      bgColor="#FFFFFF"
                      fgColor="#1A1A1A"
                      level="M"
                    />
                  </div>
                  <p className="text-[10px]" style={{ color: "#999" }}>Scan untuk verifikasi</p>
                </div>

                {/* Digital Signature */}
                <div className="text-center">
                  <p className="text-xs" style={{ color: "#999" }}>Ditandatangani secara digital</p>
                  <div className="mt-4 mb-2">
                    <div className="w-36 h-px mx-auto" style={{ background: "#1A1A1A" }} />
                  </div>
                  <p className="font-semibold text-sm" style={{ color: "#1A1A1A" }}>
                    {certificate.signerName}
                  </p>
                  <p className="text-xs" style={{ color: "#666" }}>
                    {certificate.signerTitle}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Print hint */}
        <p className="no-print text-center text-xs mt-6" style={{ color: "#aaa" }}>
          Gunakan tombol &quot;Cetak / Simpan PDF&quot; di atas, atau tekan <kbd className="px-1.5 py-0.5 rounded border text-[10px]" style={{ borderColor: "#ddd" }}>Ctrl+P</kbd> untuk menyimpan sebagai PDF
        </p>
      </div>
    </>
  );
}
