import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { StatusBadge } from "@/components/status-badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { CreditCard, Upload, Clock, CheckCircle } from "lucide-react";
import type { Payment } from "@shared/schema";

export default function Pembayaran() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: payments, isLoading } = useQuery<Payment[]>({
    queryKey: ["/api/payments", `?studentId=${user?.id}`],
  });

  const uploadMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      await apiRequest("PATCH", `/api/payments/${paymentId}`, {
        status: "menunggu_verifikasi",
        proofUrl: "/uploads/bukti_bayar.jpg",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      toast({ title: "Berhasil", description: "Bukti pembayaran berhasil diunggah" });
    },
  });

  const payment = payments?.[0];

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-48 rounded-2xl bg-gray-100" />
        <div className="h-64 rounded-2xl bg-gray-100" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {payment && (
        <div className="rounded-2xl border p-6" style={{ background: "#fff", borderColor: "#e8e4db" }}>
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold" style={{ color: "#1A1A1A" }}>Detail Pembayaran</h3>
              <p className="text-sm mt-1" style={{ color: "#888" }}>{payment.description}</p>
            </div>
            <StatusBadge status={payment.status} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="rounded-xl p-4" style={{ background: "#faf8f3" }}>
              <p className="text-xs font-medium mb-1" style={{ color: "#888" }}>Jumlah</p>
              <p className="text-xl font-bold" style={{ color: "#84B179" }}>
                Rp {Number(payment.amount).toLocaleString("id-ID")}
              </p>
            </div>
            <div className="rounded-xl p-4" style={{ background: "#faf8f3" }}>
              <p className="text-xs font-medium mb-1" style={{ color: "#888" }}>Jatuh Tempo</p>
              <p className="text-base font-semibold" style={{ color: "#1A1A1A" }}>
                {new Date(payment.dueDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
            <div className="rounded-xl p-4" style={{ background: "#faf8f3" }}>
              <p className="text-xs font-medium mb-1" style={{ color: "#888" }}>Status</p>
              <div className="flex items-center gap-2">
                {payment.status === "lunas" ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <Clock className="w-4 h-4 text-amber-600" />
                )}
                <p className="text-base font-semibold" style={{ color: payment.status === "lunas" ? "#059669" : "#D97706" }}>
                  {payment.status === "lunas" ? "Sudah Lunas" : payment.status === "menunggu_verifikasi" ? "Menunggu Verifikasi" : "Belum Bayar"}
                </p>
              </div>
            </div>
          </div>

          {payment.status === "belum_bayar" && (
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                data-testid="button-bayar"
                className="rounded-xl h-11"
                style={{ background: "#84B179", color: "#fff" }}
                onClick={() => toast({ title: "Info", description: "Integrasi payment gateway akan segera tersedia" })}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Bayar Sekarang
              </Button>
              <Button
                data-testid="button-upload-bukti"
                variant="outline"
                className="rounded-xl h-11"
                onClick={() => uploadMutation.mutate(payment.id)}
                disabled={uploadMutation.isPending}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Bukti Pembayaran
              </Button>
            </div>
          )}
          {payment.status === "menunggu_verifikasi" && (
            <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: "#FEF3C7" }}>
              <Clock className="w-5 h-5 text-amber-600" />
              <p className="text-sm font-medium text-amber-700">
                Bukti pembayaran sedang diverifikasi oleh admin. Mohon tunggu.
              </p>
            </div>
          )}
        </div>
      )}

      {payments && payments.length > 0 && (
        <div className="rounded-2xl border p-6" style={{ background: "#fff", borderColor: "#e8e4db" }}>
          <h3 className="text-base font-semibold mb-4" style={{ color: "#1A1A1A" }}>Riwayat Pembayaran</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
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
                    <td className="py-3 px-4 font-medium" style={{ color: "#84B179" }}>Rp {Number(p.amount).toLocaleString("id-ID")}</td>
                    <td className="py-3 px-4"><StatusBadge status={p.status} /></td>
                    <td className="py-3 px-4" style={{ color: "#888" }}>
                      {p.paidAt ? new Date(p.paidAt).toLocaleDateString("id-ID") : "-"}
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
