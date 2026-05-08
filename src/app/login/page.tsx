"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Moon, GraduationCap, BookOpen, ShieldCheck, Sparkles } from "lucide-react";

const MAHASISWA_NIMS = ["105841102018", "105841102019", "105841102020", "105841102021"];

const DEV_ACCOUNTS = [
  {
    role: "Mahasiswa",
    label: "Ahmad Fauzan",
    username: "2024101001",
    password: "password123",
    icon: GraduationCap,
    accent: "hsl(168 50% 22%)",
  },
  {
    role: "Instruktur",
    label: "Ustadz Hamid",
    username: "ustadz_hamid",
    password: "password123",
    icon: BookOpen,
    accent: "hsl(38 55% 46%)",
  },
  {
    role: "Admin",
    label: "Administrator",
    username: "admin",
    password: "admin123",
    icon: ShieldCheck,
    accent: "hsl(172 55% 18%)",
  },
] as const;

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avatarOrder, setAvatarOrder] = useState(MAHASISWA_NIMS);
  const { login } = useAuth();
  const { toast } = useToast();

  // Shuffle avatar order setiap 4 detik
  useEffect(() => {
    setAvatarOrder(shuffleArray(MAHASISWA_NIMS));
    const interval = setInterval(() => setAvatarOrder(shuffleArray(MAHASISWA_NIMS)), 4000);
    return () => clearInterval(interval);
  }, []);

  const isDev = process.env.NODE_ENV !== "production";

  const quickLogin = async (acc: typeof DEV_ACCOUNTS[number]) => {
    setUsername(acc.username);
    setPassword(acc.password);
    setLoading(true);
    try {
      await login(acc.username, acc.password);
      toast({ title: `Masuk sebagai ${acc.role}`, description: acc.label });
    } catch {
      toast({
        title: "Quick login gagal",
        description: "Pastikan database sudah di-seed (npm run db:seed).",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({ title: "Peringatan", description: "Mohon isi semua kolom", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await login(username, password);
      toast({ title: "Berhasil", description: "Selamat datang!" });
    } catch (e: any) {
      toast({ title: "Gagal masuk", description: "NIM/Username atau password salah", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* === Sanctuary panel — desktop only === */}
      <aside className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Solid emerald base — adem & tenang */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(165deg, hsl(168 45% 14%) 0%, hsl(172 50% 10%) 60%, hsl(180 55% 7%) 100%)",
          }}
        />

        {/* Subtle photograph as quiet texture */}
        <img
          src="https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=1400&q=80"
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover opacity-[0.18] mix-blend-luminosity"
        />

        {/* Edge ornaments — frame atas & bawah, tengah dibiarkan bersih */}
        <svg className="absolute top-0 left-0 right-0 h-32 w-full opacity-[0.18] animate-shimmer pointer-events-none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <defs>
            <linearGradient id="fade-top" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E8D5A8" stopOpacity="1" />
              <stop offset="100%" stopColor="#E8D5A8" stopOpacity="0" />
            </linearGradient>
            <pattern id="border-top" x="0" y="0" width="64" height="64" patternUnits="userSpaceOnUse">
              <g fill="none" stroke="url(#fade-top)" strokeWidth="0.6">
                <path d="M32 6 L42 22 L58 32 L42 42 L32 58 L22 42 L6 32 L22 22 Z" />
                <circle cx="32" cy="32" r="3" />
              </g>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#border-top)" />
        </svg>

        <svg className="absolute bottom-0 left-0 right-0 h-32 w-full opacity-[0.18] animate-shimmer pointer-events-none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ animationDelay: "1.5s" }}>
          <defs>
            <linearGradient id="fade-bot" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#E8D5A8" stopOpacity="1" />
              <stop offset="100%" stopColor="#E8D5A8" stopOpacity="0" />
            </linearGradient>
            <pattern id="border-bot" x="0" y="0" width="64" height="64" patternUnits="userSpaceOnUse">
              <g fill="none" stroke="url(#fade-bot)" strokeWidth="0.6">
                <path d="M32 6 L42 22 L58 32 L42 42 L32 58 L22 42 L6 32 L22 22 Z" />
                <circle cx="32" cy="32" r="3" />
              </g>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#border-bot)" />
        </svg>

        {/* Vignette samping — bingkai vertikal halus */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to right, hsl(168 50% 8% / 0.55) 0%, transparent 18%, transparent 82%, hsl(168 50% 8% / 0.55) 100%)",
          }}
        />

        {/* Top mihrab arch silhouette */}
        <svg
          className="absolute -top-10 left-1/2 -translate-x-1/2 w-[520px] h-[520px] opacity-[0.07] animate-float-slow"
          viewBox="0 0 200 200" fill="none" stroke="#E8D5A8" strokeWidth="0.5"
        >
          <path d="M100 10 C160 10 180 70 180 130 L180 195 L20 195 L20 130 C20 70 40 10 100 10 Z" />
          <path d="M100 30 C145 30 160 80 160 130 L160 175 L40 175 L40 130 C40 80 55 30 100 30 Z" />
          <path d="M100 50 C135 50 145 90 145 130 L145 160 L55 160 L55 130 C55 90 65 50 100 50 Z" />
        </svg>

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full text-[hsl(44_45%_94%)]">
          {/* Top brand row */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
              <Moon className="w-5 h-5 text-[hsl(38_60%_72%)]" />
            </div>
            <div className="leading-tight">
              <p className="font-display text-lg italic text-[hsl(38_60%_82%)]">TajwidKu</p>
              <p className="text-[11px] tracking-[0.18em] uppercase text-white/45">Sajadah Subuh</p>
            </div>
          </div>

          {/* Center — Arabic ayah */}
          <div className="space-y-8">
            <p
              className="font-arabic text-3xl xl:text-4xl text-right leading-[1.9] text-[hsl(42_45%_92%)] drop-shadow"
              dir="rtl"
            >
              وَرَتِّلِ ٱلْقُرْءَانَ تَرْتِيلًا
            </p>
            <p className="text-sm italic font-display text-[hsl(38_55%_80%)] text-right">
              "Dan bacalah Al-Qur'an itu dengan tartil." <span className="opacity-70">— QS. Al-Muzzammil: 4</span>
            </p>

            <div className="ornament-divider max-w-md text-[hsl(38_60%_72%)]">
              <span className="font-arabic text-base">۞</span>
            </div>

            <div className="space-y-4 max-w-md">
              <h2 className="font-display text-4xl xl:text-5xl leading-[1.1] text-white">
                Mengaji dengan <em className="text-[hsl(38_65%_75%)] not-italic font-medium" style={{ fontStyle: "italic" }}>tartil</em>,
                <br />menilai dengan tenang.
              </h2>
              <p className="text-sm leading-relaxed text-white/65">
                Penilaian tajwid, kelancaran, makhorijul huruf, dan adab membaca
                Al-Qur'an — tertata, transparan, penuh adab.
              </p>
            </div>

            {/* Avatars */}
            <div className="flex items-center gap-4 pt-1">
              <div className="flex -space-x-3">
                {avatarOrder.map((nim, i) => (
                  <img
                    key={nim}
                    src={`https://simak.unismuh.ac.id/upload/mahasiswa/${nim}.jpg`}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover border-2 border-[hsl(38_60%_72%)]/40 transition-all duration-700"
                    style={{ zIndex: MAHASISWA_NIMS.length - i }}
                  />
                ))}
              </div>
              <p className="text-xs text-white/60">
                Diikuti ratusan mahasiswa Universitas Muhammadiyah Makassar
              </p>
            </div>
          </div>

          {/* Bottom — institution */}
          <div className="flex items-center justify-between text-xs">
            <p className="text-white/45 tracking-wide">
              Fakultas Teknik · Universitas Muhammadiyah Makassar
            </p>
            <p className="font-arabic text-sm text-[hsl(38_60%_72%)]">١٤٤٦ هـ</p>
          </div>
        </div>
      </aside>

      {/* === Form panel === */}
      <section className="flex-1 flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
        {/* Soft arabesque watermark */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.05] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="login-pat" x="0" y="0" width="64" height="64" patternUnits="userSpaceOnUse">
              <g fill="none" stroke="hsl(168 45% 24%)" strokeWidth="0.5">
                <path d="M32 4 L60 32 L32 60 L4 32 Z" />
                <circle cx="32" cy="32" r="10" />
                <circle cx="32" cy="32" r="2" />
              </g>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#login-pat)" />
        </svg>

        {/* Floating ornament */}
        <div className="absolute top-10 right-10 w-32 h-32 opacity-30 hidden md:block animate-float-slow">
          <svg viewBox="0 0 100 100" fill="none" stroke="hsl(38 55% 56%)" strokeWidth="0.6">
            <path d="M50 5 L70 30 L95 50 L70 70 L50 95 L30 70 L5 50 L30 30 Z" />
            <path d="M50 5 L70 30 L95 50 L70 70 L50 95 L30 70 L5 50 L30 30 Z" transform="rotate(45 50 50)" />
            <circle cx="50" cy="50" r="3" fill="hsl(38 55% 56%)" />
          </svg>
        </div>

        <div className="w-full max-w-md relative z-10 animate-ascend">
          {/* Mobile brand */}
          <div className="flex flex-col items-center gap-3 mb-8 lg:hidden">
            <div className="flex items-center justify-center gap-2">
              <img src="/logo/universitas.png" alt="Unismuh" style={{ width: 40, height: 40 }} className="object-contain" />
              <img src="/logo/teknik.png" alt="Teknik" style={{ width: 48, height: 48 }} className="object-contain" />
              <img src="/logo/logo.png" alt="FT" style={{ width: 48, height: 48 }} className="object-contain" />
            </div>
            <div className="text-center">
              <h1 className="font-display text-3xl text-primary italic">TajwidKu</h1>
              <p className="text-xs text-muted-foreground mt-1">Sajadah Subuh — masuk untuk melanjutkan</p>
            </div>
          </div>

          {/* Desktop logo row */}
          <div className="hidden lg:flex items-center justify-center gap-5 mb-7">
            <img src="/logo/universitas.png" alt="" className="w-12 h-12 object-contain" />
            <span className="text-[hsl(38_55%_56%)] text-xl">۞</span>
            <img src="/logo/teknik.png" alt="" className="object-contain" style={{ width: 60, height: 60 }} />
            <span className="text-[hsl(38_55%_56%)] text-xl">۞</span>
            <img src="/logo/logo.png" alt="" className="object-contain" style={{ width: 60, height: 60 }} />
          </div>

          <div className="mb-8 hidden lg:block text-center space-y-1">
            <p className="text-[11px] tracking-[0.32em] uppercase text-[hsl(168_38%_28%)]/70">As-salāmu ʿalaykum</p>
            <h1 className="font-display text-4xl text-foreground italic">Selamat datang kembali</h1>
            <p className="text-sm text-muted-foreground">Masuk dengan tenang, niatkan karena-Nya.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs tracking-[0.18em] uppercase text-[hsl(168_38%_28%)]/80 font-semibold">
                NIM / Username
              </Label>
              <Input
                id="username"
                data-testid="input-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan NIM atau username"
                className="h-12 rounded-xl bg-card border-card-border focus:border-[hsl(38_55%_56%)] focus:ring-2 focus:ring-[hsl(38_55%_56%)]/25 transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs tracking-[0.18em] uppercase text-[hsl(168_38%_28%)]/80 font-semibold">
                Kata Sandi
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  data-testid="input-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-12 rounded-xl bg-card border-card-border pr-11 focus:border-[hsl(38_55%_56%)] focus:ring-2 focus:ring-[hsl(38_55%_56%)]/25 transition-all"
                />
                <button
                  type="button"
                  data-testid="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              data-testid="button-login"
              disabled={loading}
              className="w-full h-12 rounded-xl text-base font-semibold tracking-wide mt-2 group relative overflow-hidden border border-[hsl(168_45%_14%)]/20 transition-all duration-300 hover:shadow-[0_10px_30px_-10px_hsl(168_45%_20%/0.45)]"
              style={{
                background:
                  "linear-gradient(135deg, hsl(168 45% 20%) 0%, hsl(168 50% 28%) 60%, hsl(172 55% 22%) 100%)",
                color: "hsl(44 45% 96%)",
              }}
            >
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: "radial-gradient(ellipse at center, hsl(38 60% 60% / 0.35), transparent 70%)" }} />
              <span className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    Masuk
                    <span className="text-[hsl(38_60%_72%)] text-lg leading-none">۞</span>
                  </>
                )}
              </span>
            </Button>
          </form>

          {/* === Dev quick-login (hanya saat development) === */}
          {isDev && (
            <div
              className="mt-6 rounded-2xl border p-4 relative overflow-hidden"
              style={{
                borderColor: "hsl(38 55% 56% / 0.35)",
                background:
                  "linear-gradient(135deg, hsl(44 45% 98%) 0%, hsl(38 55% 92% / 0.4) 100%)",
              }}
            >
              <div className="absolute -top-2 -right-2 w-20 h-20 opacity-10 pointer-events-none">
                <svg viewBox="0 0 100 100" fill="none" stroke="hsl(38 55% 46%)" strokeWidth="0.8">
                  <path d="M50 5 L70 30 L95 50 L70 70 L50 95 L30 70 L5 50 L30 30 Z" />
                  <path d="M50 5 L70 30 L95 50 L70 70 L50 95 L30 70 L5 50 L30 30 Z" transform="rotate(45 50 50)" />
                </svg>
              </div>

              <div className="flex items-center justify-between mb-3 relative">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[hsl(38_55%_46%)]" />
                  <p className="text-[10px] tracking-[0.22em] uppercase font-semibold text-[hsl(168_38%_28%)]">
                    Mode Pengembang
                  </p>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono">DEV</span>
              </div>

              <p className="text-xs text-muted-foreground mb-3 relative">
                Masuk cepat sebagai akun seed:
              </p>

              <div className="grid grid-cols-3 gap-2 relative">
                {DEV_ACCOUNTS.map((acc) => {
                  const Icon = acc.icon;
                  return (
                    <button
                      key={acc.username}
                      type="button"
                      data-testid={`dev-login-${acc.role.toLowerCase()}`}
                      disabled={loading}
                      onClick={() => quickLogin(acc)}
                      className="group flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border bg-card hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
                      style={{ borderColor: "hsl(40 22% 86%)" }}
                      title={`${acc.username} / ${acc.password}`}
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:rotate-[8deg]"
                        style={{
                          background: `linear-gradient(135deg, ${acc.accent}1f, ${acc.accent}08)`,
                          color: acc.accent,
                          border: `1px solid ${acc.accent}33`,
                        }}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-semibold leading-tight" style={{ color: acc.accent }}>
                        {acc.role}
                      </span>
                      <span className="text-[10px] text-muted-foreground leading-tight truncate w-full text-center">
                        {acc.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <p className="text-[10px] text-muted-foreground/70 mt-3 text-center relative">
                Tombol ini otomatis hilang di production.
              </p>
            </div>
          )}

          <div className="mt-8 ornament-divider">
            <span className="text-[hsl(38_55%_56%)] text-base">۞</span>
          </div>

          <p className="text-[11px] text-center text-muted-foreground mt-5">
            Dibangun dengan adab oleh{" "}
            <a
              href="https://github.com/devnolife"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:text-[hsl(38_55%_46%)] transition-colors underline-offset-4 hover:underline"
            >
              devnolife
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
