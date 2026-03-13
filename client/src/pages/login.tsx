import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Eye, EyeOff, Moon, Star } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"mahasiswa" | "instruktur" | "admin">("mahasiswa");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({ title: "Peringatan", description: "Mohon isi semua kolom", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await login(username, password, role);
      toast({ title: "Berhasil", description: "Selamat datang!" });
    } catch (e: any) {
      toast({ title: "Gagal masuk", description: "Username atau password salah", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { value: "mahasiswa" as const, label: "Mahasiswa" },
    { value: "instruktur" as const, label: "Instruktur" },
    { value: "admin" as const, label: "Admin" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #84B179 0%, #6a9960 40%, #527a4a 100%)" }}>
      <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="islamic-pattern" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M40 0 L80 40 L40 80 L0 40Z" fill="none" stroke="#E8F5BD" strokeWidth="0.5" />
            <circle cx="40" cy="40" r="15" fill="none" stroke="#E8F5BD" strokeWidth="0.5" />
            <path d="M40 25 L47 35 L57 35 L50 42 L53 52 L40 46 L27 52 L30 42 L23 35 L33 35Z" fill="none" stroke="#E8F5BD" strokeWidth="0.3" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#islamic-pattern)" />
      </svg>

      <div className="absolute top-8 right-12 opacity-10">
        <Moon className="w-32 h-32 text-[#E8F5BD]" />
      </div>
      <div className="absolute bottom-12 left-8 opacity-5">
        <Star className="w-20 h-20 text-[#C7EABB]" />
      </div>

      <Card className="w-full max-w-md relative z-10 border-0 shadow-2xl" style={{ background: "rgba(250, 247, 240, 0.97)", borderRadius: "16px" }}>
        <CardHeader className="text-center pb-2 pt-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #84B179, #A2CB8B)" }}>
              <BookOpen className="w-7 h-7 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold font-serif" style={{ color: "#84B179" }}>Mengaji</h1>
          <p className="text-sm mt-1" style={{ color: "#666" }}>Platform Penilaian Kemampuan Al-Quran</p>
        </CardHeader>

        <CardContent className="px-8 pb-8 pt-4">
          <div className="flex rounded-xl p-1 mb-6" style={{ background: "#f0ede6" }}>
            {roles.map((r) => (
              <button
                key={r.value}
                data-testid={`role-tab-${r.value}`}
                onClick={() => setRole(r.value)}
                className="flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200"
                style={{
                  background: role === r.value ? "#84B179" : "transparent",
                  color: role === r.value ? "#fff" : "#666",
                  fontWeight: role === r.value ? 600 : 400,
                }}
              >
                {r.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium" style={{ color: "#1A1A1A" }}>
                {role === "mahasiswa" ? "NIM / Username" : "Username"}
              </Label>
              <Input
                id="username"
                data-testid="input-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={role === "mahasiswa" ? "Masukkan NIM Anda" : "Masukkan username"}
                className="h-11 rounded-xl border-gray-200 focus:border-[#84B179] focus:ring-[#84B179]/20"
                style={{ background: "#faf8f3" }}
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
                  style={{ background: "#faf8f3" }}
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

          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-xs text-center" style={{ color: "#999" }}>
              Demo: Mahasiswa (2024101001/password123) · Instruktur (ustadz_hamid/password123) · Admin (admin/admin123)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
