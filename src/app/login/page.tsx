"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Moon } from "lucide-react";

const MAHASISWA_NIMS = ["105841102018", "105841102019", "105841102020", "105841102021"];

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
    <div className="min-h-screen flex">
      {/* Sidebar — foto Unsplash background tetap */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=1200&q=80"
          alt="Al-Quran"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(30,30,30,0.3) 0%, rgba(30,30,30,0.6) 50%, rgba(30,30,30,0.85) 100%)" }} />

         <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <div />

          <div className="space-y-6">
            <h2 className="text-4xl font-serif font-bold leading-tight drop-shadow-lg">
              Platform Penilaian<br />Kemampuan Tajwid
            </h2>
            <p className="text-base opacity-90 max-w-md leading-relaxed drop-shadow">
              Sistem penilaian tajwid, kelancaran, makhorijul huruf, dan adab membaca Al-Quran secara terstruktur.
            </p>

            {/* Foto mahasiswa kecil — berganti urutan random */}
            <div className="flex items-center gap-4 pt-2">
              <div className="flex -space-x-3">
                {avatarOrder.map((nim, i) => (
                  <img
                    key={nim}
                    src={`https://simak.unismuh.ac.id/upload/mahasiswa/${nim}.jpg`}
                    alt="Mahasiswa"
                    className="w-10 h-10 rounded-full object-cover border-2 border-white/40 transition-all duration-700"
                    style={{ zIndex: MAHASISWA_NIMS.length - i }}
                  />
                ))}
              </div>
              <p className="text-sm opacity-80">Ratusan mahasiswa telah mengikuti</p>
            </div>
          </div>

          <div className="flex items-center gap-2 opacity-60 text-sm">
            <Moon className="w-4 h-4" />
            <span>Universitas Muhammadiyah Makassar</span>
          </div>
        </div>
      </div>

      {/* Form login */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative overflow-hidden" style={{ background: "#FAF7F0" }}>
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="islamic-pattern" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M40 0 L80 40 L40 80 L0 40Z" fill="none" stroke="#84B179" strokeWidth="0.5" />
              <circle cx="40" cy="40" r="15" fill="none" stroke="#84B179" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#islamic-pattern)" />
        </svg>

        <div className="w-full max-w-md relative z-10">
          {/* Logo — hanya tampil di mobile */}
          <div className="flex flex-col items-center gap-3 mb-8 lg:hidden">
            <div className="flex items-center justify-center gap-2">
              <img src="/logo/universitas.png" alt="Unismuh" style={{ width: 40, height: 40, minWidth: 40 }} className="object-contain flex-shrink-0" />
              <img src="/logo/teknik.png" alt="Teknik" style={{ width: 48, height: 48, minWidth: 48 }} className="object-contain flex-shrink-0" />
              <img src="/logo/logo.png" alt="FT" style={{ width: 48, height: 48, minWidth: 48 }} className="object-contain flex-shrink-0" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold font-serif" style={{ color: "#84B179" }}>TajwidKu</h1>
              <p className="text-xs" style={{ color: "#888" }}>Masuk ke akun Anda untuk melanjutkan</p>
            </div>
          </div>

          {/* Logo row — desktop */}
          <div className="hidden lg:flex items-center justify-center gap-4 mb-6">
            <img src="/logo/universitas.png" alt="Logo Universitas" className="w-14 h-14 object-contain" />
            <img src="/logo/teknik.png" alt="Logo FT" className="object-contain" style={{ width: 70, height: 70 }} />
            <img src="/logo/logo.png" alt="Logo" className="object-contain" style={{ width: 70, height: 70 }} />
          </div>

          <div className="mb-8 hidden lg:block text-center">
            <h1 className="text-2xl font-bold" style={{ color: "#1A1A1A" }}>TajwidKu</h1>
            <p className="text-sm mt-1" style={{ color: "#888" }}>Masuk ke akun Anda untuk melanjutkan</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium" style={{ color: "#1A1A1A" }}>
                NIM / Username
              </Label>
              <Input
                id="username"
                data-testid="input-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan NIM atau username"
                className="h-11 rounded-xl border-gray-200 focus:border-[#84B179] focus:ring-[#84B179]/20"
                style={{ background: "#fff" }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium" style={{ color: "#1A1A1A" }}>
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  data-testid="input-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="h-11 rounded-xl border-gray-200 pr-10 focus:border-[#84B179] focus:ring-[#84B179]/20"
                  style={{ background: "#fff" }}
                />
                <button
                  type="button"
                  data-testid="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              data-testid="button-login"
              disabled={loading}
              className="w-full h-12 rounded-xl text-base font-semibold transition-all duration-200 mt-2"
              style={{ background: "linear-gradient(135deg, #84B179, #A2CB8B)", color: "#fff" }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Memproses...
                </span>
              ) : "Masuk"}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-center" style={{ color: "#999" }}>
              created by{" "}
              <a
                href="https://github.com/devnolife"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:underline"
                style={{ color: "#84B179" }}
              >
                devnolife
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
