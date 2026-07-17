"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { StatusBadge } from "@/components/status-badge";
import { queryClient } from "@/lib/queryClient";
import { uploadPaymentProof } from "@/lib/payment-client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { CreditCard, Upload, Clock, CheckCircle, Wallet, CalendarDays, FileText, Loader2, ImageIcon, X } from "lucide-react";
import type { Payment } from "@shared/schema";

export default function Pembayaran() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const ensuredRef = useRef(false);

  const { data: payments, isLoading } = useQuery<Payment[]>({
    queryKey: ["/api/payments", `?studentId=${user?.id}`],
  });

  // Auto-buat tagihan default kalau mahasiswa belum punya tagihan apapun
  useEffect(() => {
    if (isLoading) return;
    if (!user || (user as any).role !== "mahasiswa") return;
    if (payments && payments.length > 0) return;
    if (ensuredRef.current) return;
    ensuredRef.current = true;
    fetch("/api/payments/ensure-mine", { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        if (data?.created) {
          queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
        }
      })
      .catch(() => {
        // diam saja — empty state tetap muncul kalau gagal
      });
  }, [isLoading, payments, user]);

  const uploadMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      if (!selectedFile) throw new Error("Pilih file bukti pembayaran terlebih dahulu");
      await uploadPaymentProof(paymentId, selectedFile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      toast({ title: "Berhasil", description: "Bukti pembayaran berhasil diunggah" });
      setSelectedFile(null);
      setPreview(null);
    },
    onError: (err: any) => {
      toast({ title: "Gagal", description: err.message, variant: "destructive" });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File terlalu besar", description: "Maksimal 5MB", variant: "destructive" });
      return;
    }
    setSelectedFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const payment = payments?.[0];

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-48 rounded-2xl bg-gray-100" />
        <div className="h-64 rounded-2xl bg-gray-100" />
      </div>
    );
  }

  if (!payments || payments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: "#F3F4F6" }}>
          <Wallet className="w-8 h-8" style={{ color: "#9CA3AF" }} />
        </div>
        <h3 className="text-base font-semibold mb-1" style={{ color: "#1A1A1A" }}>Belum Ada Tagihan</h3>
        <p className="text-sm text-center max-w-sm" style={{ color: "#888" }}>
          Tagihan akan otomatis muncul setelah Anda dinyatakan <strong>LULUS</strong> oleh
          instruktur. Selesaikan dulu sesi mengaji Anda — biaya sertifikat dibayarkan setelah lulus.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Detail Pembayaran Utama */}
      {payment && (
        <div className="rounded-2xl border p-5 md:p-6" style={{ background: "#fff", borderColor: "#e8e4db" }}>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
            <div className="min-w-0">
              <h3 className="text-lg font-semibold" style={{ color: "#1A1A1A" }}>Detail Pembayaran</h3>
              <p className="text-sm mt-1 truncate" style={{ color: "#888" }}>{payment.description}</p>
            </div>
            <StatusBadge status={payment.status} className="shrink-0 self-start" />
          </div>

          {/* Info Cards — stack on mobile, 3-col on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            <div className="rounded-xl p-4 flex items-center gap-3 sm:flex-col sm:items-start sm:gap-1" style={{ background: "#faf8f3" }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 sm:mb-1" style={{ background: "#E8F5E2" }}>
                <Wallet className="w-4 h-4" style={{ color: "#84B179" }} />
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: "#888" }}>Jumlah</p>
                <p className="text-lg font-bold" style={{ color: "#84B179" }}>
                  Rp {Number(payment.amount).toLocaleString("id-ID")}
                </p>
              </div>
            </div>
            <div className="rounded-xl p-4 flex items-center gap-3 sm:flex-col sm:items-start sm:gap-1" style={{ background: "#faf8f3" }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 sm:mb-1" style={{ background: "#FEF3C7" }}>
                <CalendarDays className="w-4 h-4" style={{ color: "#D97706" }} />
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: "#888" }}>Jatuh Tempo</p>
                <p className="text-base font-semibold" style={{ color: "#1A1A1A" }}>
                  {new Date(payment.dueDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
            </div>
            <div className="rounded-xl p-4 flex items-center gap-3 sm:flex-col sm:items-start sm:gap-1" style={{ background: "#faf8f3" }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 sm:mb-1" style={{ background: payment.status === "lunas" ? "#D1FAE5" : "#FEE2E2" }}>
                {payment.status === "lunas" ? (
                  <CheckCircle className="w-4 h-4" style={{ color: "#059669" }} />
                ) : (
                  <Clock className="w-4 h-4" style={{ color: "#D97706" }} />
                )}
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: "#888" }}>Status</p>
                <p className="text-base font-semibold" style={{ color: payment.status === "lunas" ? "#059669" : "#D97706" }}>
                  {payment.status === "lunas" ? "Sudah Lunas" : payment.status === "menunggu_verifikasi" ? "Menunggu Verifikasi" : payment.status === "ditolak" ? "Ditolak" : "Belum Bayar"}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons + Upload */}
          {(payment.status === "belum_bayar" || payment.status === "ditolak") && (
            <div className="space-y-4">
              <div className="rounded-xl border p-4" style={{ borderColor: "#e8e4db", background: "#faf8f3" }}>
                <p className="text-sm font-semibold mb-2" style={{ color: "#1A1A1A" }}>Cara Pembayaran</p>
                <ul className="text-sm space-y-1.5" style={{ color: "#666" }}>
                  <li className="flex items-start gap-2">
                    <CreditCard className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#84B179" }} />
                    <span><span className="font-medium">Transfer:</span> transfer sesuai nominal tagihan, lalu upload bukti transfer di bawah untuk diverifikasi admin.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Wallet className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#84B179" }} />
                    <span><span className="font-medium">Cash:</span> bayar langsung ke admin. Setelah admin mengonfirmasi, status pembayaran otomatis menjadi lunas.</span>
                  </li>
                </ul>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />

              {!selectedFile ? (
                <div className="rounded-xl border-2 border-dashed p-6 text-center" style={{ borderColor: "#e8e4db", background: "#faf8f3" }}>
                  <ImageIcon className="w-8 h-8 mx-auto mb-2" style={{ color: "#84B179" }} />
                  <p className="text-sm mb-3" style={{ color: "#666" }}>
                    Upload bukti transfer/pembayaran (JPG, PNG, WebP, atau PDF — maks 5MB)
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" /> Pilih File
                  </Button>
                </div>
              ) : (
                <div className="rounded-xl border p-4" style={{ borderColor: "#84B179", background: "#F0FDF4" }}>
                  <div className="flex items-start gap-3">
                    {preview ? (
                      <img src={preview} alt="preview" className="w-20 h-20 rounded-lg object-cover" />
                    ) : (
                      <div className="w-20 h-20 rounded-lg flex items-center justify-center" style={{ background: "#fff" }}>
                        <FileText className="w-8 h-8" style={{ color: "#84B179" }} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "#1A1A1A" }}>{selectedFile.name}</p>
                      <p className="text-xs mt-1" style={{ color: "#666" }}>
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button onClick={clearFile} className="p-1 rounded-lg hover:bg-white/60 transition-colors">
                      <X className="w-4 h-4" style={{ color: "#666" }} />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  data-testid="button-upload-bukti"
                  className="rounded-xl h-11 w-full sm:flex-1"
                  style={{ background: "#84B179", color: "#fff" }}
                  onClick={() => uploadMutation.mutate(payment.id)}
                  disabled={uploadMutation.isPending || !selectedFile}
                >
                  {uploadMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                  {uploadMutation.isPending ? "Mengunggah..." : "Kirim Bukti Pembayaran"}
                </Button>
              </div>
            </div>
          )}

          {payment.status === "lunas" && payment.proofUrl && (
            <a href={payment.proofUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium hover:underline" style={{ color: "#84B179" }}>
              <FileText className="w-4 h-4" /> Lihat bukti yang dikirim
            </a>
          )}
          {payment.status === "lunas" && payment.method === "cash" && (
            <div className="inline-flex items-center gap-2 text-sm font-medium" style={{ color: "#84B179" }}>
              <Wallet className="w-4 h-4" /> Dibayar secara cash (dikonfirmasi admin)
            </div>
          )}
          {payment.status === "menunggu_verifikasi" && (
            <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: "#FEF3C7" }}>
              <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-amber-700">
                Bukti pembayaran sedang diverifikasi oleh admin. Mohon tunggu.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Riwayat Pembayaran */}
      {payments.length > 0 && (
        <div className="rounded-2xl border p-5 md:p-6" style={{ background: "#fff", borderColor: "#e8e4db" }}>
          <h3 className="text-base font-semibold mb-4" style={{ color: "#1A1A1A" }}>Riwayat Pembayaran</h3>

          {/* Mobile: Card List */}
          <div className="space-y-3 md:hidden">
            {payments.map((p) => (
              <div key={p.id} className="rounded-xl p-4 border" style={{ borderColor: "#f0ede6", background: "#faf8f3" }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 shrink-0" style={{ color: "#84B179" }} />
                    <p className="text-sm font-medium truncate" style={{ color: "#1A1A1A" }}>{p.description || "Pembayaran"}</p>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm font-semibold" style={{ color: "#84B179" }}>
                    Rp {Number(p.amount).toLocaleString("id-ID")}
                  </p>
                  <p className="text-xs" style={{ color: "#888" }}>
                    {p.paidAt ? new Date(p.paidAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "Belum dibayar"}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr style={{ borderBottom: "1px solid #e8e4db" }}>
                  <th className="text-left py-3 px-4 font-medium" style={{ color: "#888" }}>Deskripsi</th>
                  <th className="text-left py-3 px-4 font-medium" style={{ color: "#888" }}>Jumlah</th>
                  <th className="text-left py-3 px-4 font-medium" style={{ color: "#888" }}>Status</th>
                  <th className="text-left py-3 px-4 font-medium" style={{ color: "#888" }}>Tanggal Bayar</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid #f0ede6" }}>
                    <td className="py-3 px-4" style={{ color: "#1A1A1A" }}>{p.description}</td>
                    <td className="py-3 px-4 font-medium tabular-nums" style={{ color: "#84B179" }}>Rp {Number(p.amount).toLocaleString("id-ID")}</td>
                    <td className="py-3 px-4"><StatusBadge status={p.status} /></td>
                    <td className="py-3 px-4" style={{ color: "#888" }}>
                      {p.paidAt ? new Date(p.paidAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
