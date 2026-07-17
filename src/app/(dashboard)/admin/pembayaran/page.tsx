"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { reviewPayment, type PaymentReviewAction } from "@/lib/payment-client";
import { useToast } from "@/hooks/use-toast";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CheckCircle, XCircle, Filter, Loader2, Search, Download, Banknote } from "lucide-react";
import type { User, Payment } from "@shared/schema";
import { getMahasiswaPhotoUrl } from "@/lib/mahasiswa-photo";
import { Pagination, usePagination } from "@/components/pagination";

export default function PembayaranManagement() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("semua");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [cashConfirmPayment, setCashConfirmPayment] = useState<Payment | null>(null);

  const { data: payments, isLoading } = useQuery<Payment[]>({ queryKey: ["/api/payments"] });
  const { data: students } = useQuery<Omit<User, "password">[]>({ queryKey: ["/api/users", "?role=mahasiswa"] });

  const updateMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: PaymentReviewAction }) => {
      setUpdatingId(id);
      await reviewPayment<Payment>(id, action);
    },
    onSuccess: () => {
      setUpdatingId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      toast({ title: "Berhasil", description: "Status pembayaran diperbarui" });
    },
    onError: () => {
      setUpdatingId(null);
    },
  });

  const getStudentName = (id: string) => students?.find(s => s.id === id)?.name || "-";
  const getStudentNim = (id: string) => students?.find(s => s.id === id)?.nim || "-";

  const filtered = useMemo(() => {
    return (payments || []).filter(p => {
      const matchStatus = statusFilter === "semua" || p.status === statusFilter;
      if (!matchStatus) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      const name = getStudentName(p.studentId).toLowerCase();
      const nim = getStudentNim(p.studentId).toLowerCase();
      return name.includes(q) || nim.includes(q);
    });
  }, [payments, students, statusFilter, search]);

  const paged = usePagination(filtered, pageSize, page);
  useEffect(() => { setPage(1); }, [statusFilter, search, pageSize]);

  const handleExport = async () => {
    const XLSX = await import("xlsx");
    const rows = filtered.map(p => ({
      NIM: getStudentNim(p.studentId),
      Nama: getStudentName(p.studentId),
      Jumlah: Number(p.amount),
      "Jatuh Tempo": new Date(p.dueDate).toLocaleDateString("id-ID"),
      Status: p.status,
      "Dibayar Pada": p.paidAt ? new Date(p.paidAt).toLocaleDateString("id-ID") : "",
      "Bukti URL": p.proofUrl || "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pembayaran");
    const filename = `pembayaran-${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);
    toast({ title: "Berhasil", description: `${rows.length} data diekspor` });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:flex-1 lg:max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#888" }} />
            <Input
              placeholder="Cari nama atau NIM..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 rounded-xl"
              style={{ background: "#fff", borderColor: "#e8e4db" }}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-56 h-10 rounded-xl" style={{ background: "#fff", borderColor: "#e8e4db" }}>
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
        <Button variant="outline" className="rounded-xl h-10 text-xs" onClick={handleExport}>
          <Download className="w-3.5 h-3.5 mr-1.5" /> Export Excel
        </Button>
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ background: "#fff", borderColor: "#e8e4db" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#faf8f3", borderBottom: "1px solid #e8e4db" }}>
                <th className="text-left py-3 px-4 font-medium" style={{ color: "#888" }}>Foto</th>
                <th className="text-left py-3 px-4 font-medium" style={{ color: "#888" }}>NIM</th>
                <th className="text-left py-3 px-4 font-medium" style={{ color: "#888" }}>Nama</th>
                <th className="text-left py-3 px-4 font-medium" style={{ color: "#888" }}>Jumlah</th>
                <th className="text-left py-3 px-4 font-medium" style={{ color: "#888" }}>Tanggal</th>
                <th className="text-left py-3 px-4 font-medium" style={{ color: "#888" }}>Status</th>
                <th className="text-left py-3 px-4 font-medium" style={{ color: "#888" }}>Bukti</th>
                <th className="text-left py-3 px-4 font-medium" style={{ color: "#888" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [1, 2, 3].map(i => <tr key={i}><td colSpan={8} className="py-4 px-4"><div className="h-8 bg-gray-100 rounded animate-pulse" /></td></tr>)
              ) : paged.map(p => (
                <tr key={p.id} style={{ borderBottom: "1px solid #f0ede6" }} className="hover:bg-[#faf8f3] transition-colors">
                  <td className="py-3 px-4">
                    <img
                      src={getMahasiswaPhotoUrl(getStudentNim(p.studentId))}
                      alt={getStudentName(p.studentId)}
                      className="w-9 h-9 rounded-full object-cover border"
                      style={{ borderColor: "#e8e4db" }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.outerHTML = `<div class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold" style="background:#84B179;color:#fff">${getStudentName(p.studentId).charAt(0)}</div>`;
                      }}
                    />
                  </td>
                  <td className="py-3 px-4 font-mono text-xs" style={{ color: "#84B179" }}>{getStudentNim(p.studentId)}</td>
                  <td className="py-3 px-4 font-medium" style={{ color: "#1A1A1A" }}>{getStudentName(p.studentId)}</td>
                  <td className="py-3 px-4 font-medium" style={{ color: "#84B179" }}>Rp {Number(p.amount).toLocaleString("id-ID")}</td>
                  <td className="py-3 px-4" style={{ color: "#666" }}>{new Date(p.dueDate).toLocaleDateString("id-ID")}</td>
                  <td className="py-3 px-4"><StatusBadge status={p.status} /></td>
                  <td className="py-3 px-4">
                    {p.proofUrl ? (
                      <a href={p.proofUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-medium hover:underline" style={{ color: "#84B179" }}>
                        Lihat Bukti
                      </a>
                    ) : p.method === "cash" ? (
                      <span className="text-xs font-medium" style={{ color: "#84B179" }}>Cash</span>
                    ) : (
                      <span className="text-xs" style={{ color: "#bbb" }}>-</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {p.status === "menunggu_verifikasi" && (
                      <div className="flex gap-1">
                        <button
                          data-testid={`verify-payment-${p.id}`}
                          onClick={() => updateMutation.mutate({ id: p.id, action: "approve" })}
                          className="p-1.5 rounded-lg hover:bg-green-50 transition-colors text-green-600"
                          disabled={updatingId === p.id}
                          title="Setujui"
                        >
                          {updatingId === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                        <button
                          data-testid={`reject-payment-${p.id}`}
                          onClick={() => updateMutation.mutate({ id: p.id, action: "reject" })}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-red-500"
                          disabled={updatingId === p.id}
                          title="Tolak"
                        >
                          {updatingId === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                        </button>
                      </div>
                    )}
                    {(p.status === "belum_bayar" || p.status === "ditolak") && (
                      <button
                        data-testid={`confirm-cash-${p.id}`}
                        onClick={() => setCashConfirmPayment(p)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-green-50 transition-colors text-green-700 border border-green-200"
                        disabled={updatingId === p.id}
                        title="Konfirmasi pembayaran cash"
                      >
                        {updatingId === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Banknote className="w-3.5 h-3.5" />}
                        Konfirmasi Cash
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={8} className="py-12 text-center" style={{ color: "#888" }}>Tidak ada data pembayaran</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <Pagination
            page={page}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </div>

      <AlertDialog
        open={!!cashConfirmPayment}
        onOpenChange={(open) => { if (!open) setCashConfirmPayment(null); }}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Pembayaran Cash</AlertDialogTitle>
            <AlertDialogDescription>
              {cashConfirmPayment && (
                <>
                  Konfirmasi bahwa <span className="font-semibold">{getStudentName(cashConfirmPayment.studentId)}</span> ({getStudentNim(cashConfirmPayment.studentId)}) telah membayar secara cash sebesar{" "}
                  <span className="font-semibold">Rp {Number(cashConfirmPayment.amount).toLocaleString("id-ID")}</span>?
                  Status akan langsung menjadi lunas dan sertifikat diterbitkan otomatis. Tindakan ini tidak dapat dibatalkan.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction
              data-testid="confirm-cash-submit"
              className="rounded-xl"
              style={{ background: "#84B179", color: "#fff" }}
              onClick={() => {
                if (cashConfirmPayment) {
                  updateMutation.mutate({ id: cashConfirmPayment.id, action: "confirm_cash" });
                }
                setCashConfirmPayment(null);
              }}
            >
              Ya, Konfirmasi Lunas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
