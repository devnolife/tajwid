"use client";

import { useState } from "react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, KeyRound, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";

export default function GantiPasswordPage() {
  const { toast } = useToast();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toast({ title: "Tidak sama", description: "Konfirmasi password tidak cocok", variant: "destructive" });
      return;
    }
    if (form.newPassword.length < 6) {
      toast({ title: "Terlalu pendek", description: "Password baru minimal 6 karakter", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/users/me/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal mengganti password");
      toast({ title: "Berhasil", description: "Password berhasil diperbarui. Gunakan password baru saat login berikutnya." });
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (e: any) {
      toast({ title: "Gagal", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-2xl">
      <Link href="/profil" className="text-xs inline-flex items-center gap-1.5 hover:underline" style={{ color: "hsl(168 50% 22%)" }}>
        <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Profil
      </Link>

      <div className="rounded-3xl border p-6 md:p-8" style={{ background: "hsl(44 45% 98%)", borderColor: "hsl(40 22% 88%)" }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "hsl(168 50% 22% / 0.1)" }}>
            <KeyRound className="w-5 h-5" style={{ color: "hsl(168 50% 22%)" }} />
          </div>
          <div>
            <h1 className="text-xl font-display italic" style={{ color: "hsl(190 28% 12%)" }}>Ganti Password</h1>
            <p className="text-xs mt-0.5" style={{ color: "hsl(190 28% 35%)" }}>Pastikan password baru Anda kuat dan mudah diingat</p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <PasswordField
            label="Password Lama"
            value={form.currentPassword}
            onChange={(v) => setForm({ ...form, currentPassword: v })}
            show={show.current}
            onToggle={() => setShow({ ...show, current: !show.current })}
          />
          <PasswordField
            label="Password Baru"
            value={form.newPassword}
            onChange={(v) => setForm({ ...form, newPassword: v })}
            show={show.next}
            onToggle={() => setShow({ ...show, next: !show.next })}
            hint="Minimal 6 karakter"
          />
          <PasswordField
            label="Konfirmasi Password Baru"
            value={form.confirmPassword}
            onChange={(v) => setForm({ ...form, confirmPassword: v })}
            show={show.confirm}
            onToggle={() => setShow({ ...show, confirm: !show.confirm })}
          />

          <div className="rounded-xl border p-3 flex items-start gap-2.5" style={{ background: "hsl(38 55% 56% / 0.08)", borderColor: "hsl(38 55% 56% / 0.3)" }}>
            <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "hsl(38 55% 40%)" }} />
            <p className="text-xs" style={{ color: "hsl(38 55% 30%)" }}>
              Demi keamanan, jangan bagikan password Anda kepada siapa pun. Gunakan kombinasi huruf, angka, dan simbol.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Link href="/profil">
              <Button type="button" variant="outline" className="rounded-xl h-11">Batal</Button>
            </Link>
            <Button
              type="submit"
              disabled={saving}
              className="rounded-xl h-11 px-6"
              style={{ background: "hsl(168 50% 22%)", color: "hsl(44 45% 98%)" }}
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <KeyRound className="w-4 h-4 mr-2" />}
              {saving ? "Menyimpan..." : "Ganti Password"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggle,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  hint?: string;
}) {
  return (
    <div>
      <Label className="text-xs font-medium uppercase tracking-wider" style={{ color: "hsl(190 28% 35%)" }}>{label}</Label>
      <div className="relative mt-1.5">
        <Input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          className="pr-10 h-11 rounded-xl"
          style={{ background: "#fff", borderColor: "hsl(40 22% 88%)" }}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2"
          style={{ color: "hsl(190 28% 35%)" }}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {hint && <p className="text-[11px] mt-1" style={{ color: "hsl(190 28% 50%)" }}>{hint}</p>}
    </div>
  );
}
