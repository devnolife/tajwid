"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Settings } from "lucide-react";
import type { Settings as SettingsType } from "@shared/schema";

export default function Pengaturan() {
  const { toast } = useToast();
  const { data: settings, isLoading } = useQuery<SettingsType>({ queryKey: ["/api/settings"] });

  const [form, setForm] = useState({
    appName: "Mengaji",
    academicYear: "2025/2026",
    passingScore: 70,
    paymentAmount: "150000",
  });

  useEffect(() => {
    if (settings) {
      setForm({
        appName: settings.appName,
        academicYear: settings.academicYear,
        passingScore: settings.passingScore,
        paymentAmount: settings.paymentAmount,
      });
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", "/api/settings", form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Berhasil", description: "Pengaturan disimpan" });
    },
    onError: () => toast({ title: "Gagal", description: "Terjadi kesalahan", variant: "destructive" }),
  });

  if (isLoading) {
    return <div className="h-64 rounded-2xl bg-gray-100 animate-pulse" />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="rounded-2xl border p-6 md:p-8" style={{ background: "#fff", borderColor: "#e8e4db" }}>
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-5 h-5" style={{ color: "#84B179" }} />
          <h3 className="text-lg font-semibold" style={{ color: "#1A1A1A" }}>Pengaturan Aplikasi</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
          <div>
            <Label className="text-xs font-medium" style={{ color: "#666" }}>Nama Aplikasi</Label>
            <Input
              data-testid="input-app-name"
              value={form.appName}
              onChange={(e) => setForm({ ...form, appName: e.target.value })}
              className="mt-1 rounded-xl h-10"
              style={{ background: "#faf8f3", borderColor: "#e8e4db" }}
            />
          </div>
          <div>
            <Label className="text-xs font-medium" style={{ color: "#666" }}>Tahun Akademik</Label>
            <Input
              data-testid="input-academic-year"
              value={form.academicYear}
              onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
              className="mt-1 rounded-xl h-10"
              style={{ background: "#faf8f3", borderColor: "#e8e4db" }}
            />
          </div>
          <div>
            <Label className="text-xs font-medium" style={{ color: "#666" }}>Skor Kelulusan (minimum)</Label>
            <Input
              data-testid="input-passing-score"
              type="number"
              value={form.passingScore}
              onChange={(e) => setForm({ ...form, passingScore: parseInt(e.target.value) || 0 })}
              className="mt-1 rounded-xl h-10"
              style={{ background: "#faf8f3", borderColor: "#e8e4db" }}
            />
          </div>
          <div>
            <Label className="text-xs font-medium" style={{ color: "#666" }}>Biaya Ujian (Rp)</Label>
            <Input
              data-testid="input-payment-amount"
              value={form.paymentAmount}
              onChange={(e) => setForm({ ...form, paymentAmount: e.target.value })}
              className="mt-1 rounded-xl h-10"
              style={{ background: "#faf8f3", borderColor: "#e8e4db" }}
            />
          </div>
        </div>

        <div className="mt-8">
          <Button
            data-testid="button-save-settings"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="rounded-xl h-11 px-8"
            style={{ background: "#84B179", color: "#fff" }}
          >
            <Save className="w-4 h-4 mr-2" />
            {mutation.isPending ? "Menyimpan..." : "Simpan Pengaturan"}
          </Button>
        </div>
      </div>
    </div>
  );
}
