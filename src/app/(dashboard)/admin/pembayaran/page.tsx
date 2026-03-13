"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, XCircle, Filter } from "lucide-react";
import type { User, Payment } from "@shared/schema";

export default function PembayaranManagement() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("semua");

  const { data: payments, isLoading } = useQuery<Payment[]>({ queryKey: ["/api/payments"] });
  const { data: students } = useQuery<Omit<User, "password">[]>({ queryKey: ["/api/users", "?role=mahasiswa"] });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const data: any = { status };
      if (status === "lunas") data.paidAt = new Date().toISOString();
      await apiRequest("PATCH", `/api/payments/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      toast({ title: "Berhasil", description: "Status pembayaran diperbarui" });
    },
  });

  const getStudentName = (id: string) => students?.find(s => s.id === id)?.name || "-";
  const getStudentNim = (id: string) => students?.find(s => s.id === id)?.nim || "-";

  const filtered = payments?.filter(p => statusFilter === "semua" || p.status === statusFilter) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-56 h-10 rounded-xl" style={{ background: "#fff", borderColor: "#e8e4db" }}>
            <Filter className="w-4 h-4 mr-2" style={{ color: "#888" }} />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua Status</SelectItem>
            <SelectItem value="belum_bayar">Belum Bayar</SelectItem>
            <SelectItem value="menunggu_verifikasi">Menunggu Verifikasi</SelectItem>
            <SelectItem value="lunas">Lunas</SelectItem>
            <SelectItem value="ditolak">Ditolak</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ background: "#fff", borderColor: "#e8e4db" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#faf8f3", borderBottom: "1px solid #e8e4db" }}>
                <th className="text-left py-3 px-4 font-medium" style={{ color: "#888" }}>NIM</th>
                <th className="text-left py-3 px-4 font-medium" style={{ color: "#888" }}>Nama</th>
                <th className="text-left py-3 px-4 font-medium" style={{ color: "#888" }}>Jumlah</th>
                <th className="text-left py-3 px-4 font-medium" style={{ color: "#888" }}>Tanggal</th>
                <th className="text-left py-3 px-4 font-medium" style={{ color: "#888" }}>Status</th>
                <th className="text-left py-3 px-4 font-medium" style={{ color: "#888" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [1, 2, 3].map(i => <tr key={i}><td colSpan={6} className="py-4 px-4"><div className="h-8 bg-gray-100 rounded animate-pulse" /></td></tr>)
              ) : filtered.map(p => (
                <tr key={p.id} style={{ borderBottom: "1px solid #f0ede6" }} className="hover:bg-[#faf8f3] transition-colors">
                  <td className="py-3 px-4 font-mono text-xs" style={{ color: "#84B179" }}>{getStudentNim(p.studentId)}</td>
                  <td className="py-3 px-4 font-medium" style={{ color: "#1A1A1A" }}>{getStudentName(p.studentId)}</td>
                  <td className="py-3 px-4 font-medium" style={{ color: "#84B179" }}>Rp {Number(p.amount).toLocaleString("id-ID")}</td>
                  <td className="py-3 px-4" style={{ color: "#666" }}>{new Date(p.dueDate).toLocaleDateString("id-ID")}</td>
                  <td className="py-3 px-4"><StatusBadge status={p.status} /></td>
                  <td className="py-3 px-4">
                    {p.status === "menunggu_verifikasi" && (
                      <div className="flex gap-1">
                        <button
                          data-testid={`verify-payment-${p.id}`}
                          onClick={() => updateMutation.mutate({ id: p.id, status: "lunas" })}
                          className="p-1.5 rounded-lg hover:bg-green-50 transition-colors text-green-600"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          data-testid={`reject-payment-${p.id}`}
                          onClick={() => updateMutation.mutate({ id: p.id, status: "ditolak" })}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-red-500"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={6} className="py-12 text-center" style={{ color: "#888" }}>Tidak ada data pembayaran</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
