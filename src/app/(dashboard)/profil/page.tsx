"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User as UserIcon, Mail, Phone, Building2, GraduationCap, KeyRound, Save, Loader2,
  IdCard, ShieldCheck, Briefcase, AtSign, Pencil,
} from "lucide-react";
import { getMahasiswaPhotoUrl } from "@/lib/mahasiswa-photo";

const C = {
  emerald: "hsl(168 50% 22%)",
  emeraldDeep: "hsl(172 55% 14%)",
  emeraldSoft: "hsl(168 38% 42%)",
  gold: "hsl(38 55% 56%)",
  goldDeep: "hsl(38 55% 40%)",
  goldSoft: "hsl(38 85% 88%)",
  cream: "hsl(44 45% 98%)",
  taupe: "hsl(40 22% 88%)",
  bgSoft: "hsl(42 38% 96%)",
  muted: "hsl(190 28% 35%)",
};

export default function ProfilPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: "", email: "", phone: "", faculty: "", program: "", specialization: "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetch("/api/users/me")
      .then((r) => r.json())
      .then((data) => {
        setForm({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          faculty: data.faculty || "",
          program: data.program || "",
          specialization: data.specialization || "",
        });
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal menyimpan");
      toast({ title: "Berhasil", description: "Profil berhasil diperbarui" });
    } catch (e: any) {
      toast({ title: "Gagal", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const role = (user as any)?.role as "mahasiswa" | "instruktur" | "admin" | undefined;
  const isMahasiswa = role === "mahasiswa";
  const isInstruktur = role === "instruktur";
  const isAdmin = role === "admin";
  const nim = (user as any)?.nim as string | undefined;
  const username = (user as any)?.username as string | undefined;

  const initial = (user?.name || "U").charAt(0).toUpperCase();
  const photoUrl = useMemo(() => (isMahasiswa && nim ? getMahasiswaPhotoUrl(nim) : null), [isMahasiswa, nim]);

  const roleMeta = isMahasiswa
    ? { label: "Mahasiswa", icon: GraduationCap }
    : isInstruktur
      ? { label: "Instruktur Penguji", icon: ShieldCheck }
      : { label: "Administrator", icon: Briefcase };
  const RoleIcon = roleMeta.icon;

  return (
    <div className="space-y-7 animate-in fade-in duration-500">
      {/* === Hero === */}
      <section
        className="relative rounded-3xl overflow-hidden border"
        style={{
          background:
            "radial-gradient(ellipse 60% 80% at 100% 0%, hsl(38 60% 60% / 0.18), transparent 60%)," +
            "linear-gradient(135deg, hsl(168 50% 18%) 0%, hsl(172 55% 14%) 100%)",
          borderColor: "hsl(168 30% 18%)",
        }}
      >
        <svg className="absolute -right-10 -bottom-12 w-64 h-64 opacity-[0.07]" viewBox="0 0 100 100" fill="none" stroke="#E8D5A8" strokeWidth="0.5">
          <path d="M50 5 L70 30 L95 50 L70 70 L50 95 L30 70 L5 50 L30 30 Z" />
          <path d="M50 5 L70 30 L95 50 L70 70 L50 95 L30 70 L5 50 L30 30 Z" transform="rotate(45 50 50)" />
        </svg>

        <div className="relative z-10 p-6 md:p-8 flex flex-wrap items-center gap-6">
          {/* Avatar */}
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={user?.name ?? ""}
              className="w-24 h-24 md:w-28 md:h-28 rounded-2xl object-cover border-2 flex-shrink-0"
              style={{ borderColor: `${C.gold}aa` }}
              onError={(e) => {
                const t = e.target as HTMLImageElement;
                t.outerHTML = `<div class="w-24 h-24 md:w-28 md:h-28 rounded-2xl flex items-center justify-center text-4xl font-display italic border-2 flex-shrink-0" style="background:${C.gold};color:${C.emeraldDeep};border-color:${C.gold}aa">${initial}</div>`;
              }}
            />
          ) : (
            <div
              className="w-24 h-24 md:w-28 md:h-28 rounded-2xl flex items-center justify-center text-4xl font-display italic border-2 flex-shrink-0"
              style={{ background: C.gold, color: C.emeraldDeep, borderColor: `${C.gold}aa` }}
            >
              {initial}
            </div>
          )}

          {/* Identity */}
          <div className="flex-1 min-w-0">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-[0.18em] uppercase border"
              style={{ background: "rgba(232,213,168,0.12)", color: C.goldSoft, borderColor: "rgba(232,213,168,0.25)" }}
            >
              <RoleIcon className="w-3 h-3" /> {roleMeta.label}
            </span>
            <h1 className="text-3xl md:text-4xl font-display italic mt-3 truncate text-white">{user?.name}</h1>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-white/65">
              {username && (
                <span className="inline-flex items-center gap-1.5">
                  <AtSign className="w-3.5 h-3.5" /> {username}
                </span>
              )}
              {nim && (
                <span className="inline-flex items-center gap-1.5">
                  <IdCard className="w-3.5 h-3.5" /> NIM <span className="font-mono">{nim}</span>
                </span>
              )}
              {form.email && (
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> {form.email}
                </span>
              )}
            </div>
          </div>

          {/* Action */}
          <div className="flex flex-col gap-2 self-stretch md:self-auto">
            <Link
              href="/profil/password"
              className="inline-flex items-center justify-center gap-2 px-4 h-11 rounded-xl text-sm font-semibold border transition-all hover:bg-white/10"
              style={{ borderColor: "rgba(232,213,168,0.35)", color: C.goldSoft, background: "rgba(255,255,255,0.04)" }}
            >
              <KeyRound className="w-4 h-4" /> Ganti Password
            </Link>
          </div>
        </div>
      </section>

      {/* === Body grid === */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left — Info card */}
        <aside className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl border p-5 md:p-6" style={{ background: "#fff", borderColor: C.taupe }}>
            <p className="text-[11px] tracking-[0.22em] uppercase font-bold" style={{ color: C.goldDeep }}>Ringkasan Akun</p>
            <h3 className="font-display italic text-xl mt-1" style={{ color: C.emerald }}>Identitas</h3>

            <ul className="mt-5 space-y-3 text-sm">
              <InfoRow icon={UserIcon} label="Nama" value={form.name || "—"} />
              <InfoRow icon={AtSign} label="Username" value={username || "—"} mono />
              {nim && <InfoRow icon={IdCard} label="NIM" value={nim} mono />}
              {form.email && <InfoRow icon={Mail} label="Email" value={form.email} />}
              {form.phone && <InfoRow icon={Phone} label="Telepon" value={form.phone} />}
              {isMahasiswa && form.faculty && <InfoRow icon={Building2} label="Fakultas" value={form.faculty} />}
              {isMahasiswa && form.program && <InfoRow icon={GraduationCap} label="Program Studi" value={form.program} />}
              {isInstruktur && form.specialization && <InfoRow icon={ShieldCheck} label="Spesialisasi" value={form.specialization} />}
            </ul>
          </div>

          {/* Quick links by role */}
          <div className="rounded-2xl border p-5" style={{ background: C.bgSoft, borderColor: C.taupe }}>
            <p className="text-[11px] tracking-[0.22em] uppercase font-bold mb-3" style={{ color: C.goldDeep }}>Pintasan</p>
            <div className="space-y-2">
              {isMahasiswa && (
                <>
                  <QuickLink href="/mahasiswa/dashboard" label="Dashboard Saya" />
                  <QuickLink href="/mahasiswa/pembayaran" label="Pembayaran" />
                  <QuickLink href="/mahasiswa/jadwal" label="Jadwal Tes" />
                  <QuickLink href="/mahasiswa/sertifikat" label="Sertifikat" />
                </>
              )}
              {isInstruktur && (
                <>
                  <QuickLink href="/instruktur/dashboard" label="Dashboard Saya" />
                  <QuickLink href="/instruktur/jadwal-mengajar" label="Jadwal Tes" />
                  <QuickLink href="/instruktur/mahasiswa-list" label="Daftar Mahasiswa" />
                </>
              )}
              {isAdmin && (
                <>
                  <QuickLink href="/admin/dashboard" label="Dashboard Admin" />
                  <QuickLink href="/admin/mahasiswa" label="Manajemen Mahasiswa" />
                  <QuickLink href="/admin/pengaturan" label="Pengaturan Aplikasi" />
                </>
              )}
            </div>
          </div>
        </aside>

        {/* Right — Form */}
        <main className="lg:col-span-8">
          <div className="rounded-2xl border p-6 md:p-8" style={{ background: "#fff", borderColor: C.taupe }}>
            <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${C.emerald}10`, color: C.emerald }}>
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-display italic" style={{ color: C.emerald }}>Informasi Pribadi</h2>
                  <p className="text-xs mt-0.5" style={{ color: C.muted }}>Perbarui data Anda agar tetap akurat</p>
                </div>
              </div>
              <span className="text-[hsl(38_55%_56%)] text-base">۞</span>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field icon={UserIcon} label="Nama Lengkap" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
                <Field icon={Mail} label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
                <Field icon={Phone} label="No. Telepon" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
                {isInstruktur && (
                  <Field icon={ShieldCheck} label="Spesialisasi" value={form.specialization} onChange={(v) => setForm({ ...form, specialization: v })} />
                )}
                {!isInstruktur && (
                  <>
                    <Field icon={Building2} label="Fakultas" value={form.faculty} onChange={(v) => setForm({ ...form, faculty: v })} disabled={isMahasiswa} />
                    <Field icon={GraduationCap} label="Program Studi" value={form.program} onChange={(v) => setForm({ ...form, program: v })} disabled={isMahasiswa} />
                  </>
                )}
              </div>
            )}

            {isMahasiswa && (
              <div className="mt-5 flex items-start gap-2.5 px-4 py-3 rounded-xl border" style={{ background: `${C.gold}10`, borderColor: `${C.gold}33` }}>
                <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: C.goldDeep }} />
                <p className="text-xs leading-relaxed" style={{ color: C.goldDeep }}>
                  Fakultas & program studi disinkronkan otomatis dari data kampus dan tidak dapat diubah.
                </p>
              </div>
            )}

            <div className="mt-7 pt-6 border-t flex justify-end gap-3" style={{ borderColor: C.taupe }}>
              <Button
                onClick={handleSave}
                disabled={saving || loading}
                className="rounded-xl h-12 px-8 font-semibold"
                style={{
                  background: C.emerald,
                  color: C.cream,
                  boxShadow: `0 8px 20px ${C.emerald}33`,
                }}
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {saving ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, mono = false }: { icon: any; label: string; value: string; mono?: boolean }) {
  return (
    <li className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${C.emerald}0c`, color: C.emeraldSoft }}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] tracking-widest uppercase font-semibold" style={{ color: C.muted }}>{label}</p>
        <p className={`text-sm mt-0.5 truncate ${mono ? "font-mono" : "font-medium"}`} style={{ color: C.emerald }}>{value}</p>
      </div>
    </li>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium border bg-white transition-all hover:shadow-sm hover:-translate-y-0.5"
      style={{ borderColor: C.taupe, color: C.emerald }}
    >
      <span>{label}</span>
      <span style={{ color: C.gold }}>›</span>
    </Link>
  );
}

function Field({
  icon: Icon, label, value, onChange, type = "text", disabled = false,
}: {
  icon: any; label: string; value: string; onChange: (v: string) => void; type?: string; disabled?: boolean;
}) {
  return (
    <div>
      <Label className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: C.muted }}>{label}</Label>
      <div className="relative mt-1.5">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: disabled ? "hsl(40 14% 60%)" : C.gold }} />
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="pl-10 h-11 rounded-xl text-sm"
          style={{
            background: disabled ? "hsl(40 22% 94%)" : "#fff",
            borderColor: C.taupe,
            color: disabled ? "hsl(190 14% 45%)" : C.emerald,
          }}
        />
      </div>
    </div>
  );
}
