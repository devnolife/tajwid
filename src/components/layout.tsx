"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-client";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Home,
  CreditCard,
  Calendar,
  FileText,
  Award,
  Users,
  ClipboardList,
  Settings,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const menuConfig: Record<string, { icon: any; label: string; href: string }[]> = {
  mahasiswa: [
    { icon: Home, label: "Dashboard", href: "/mahasiswa/dashboard" },
    { icon: CreditCard, label: "Pembayaran", href: "/mahasiswa/pembayaran" },
    { icon: Calendar, label: "Jadwal Saya", href: "/mahasiswa/jadwal" },
    { icon: FileText, label: "Hasil Mengaji", href: "/mahasiswa/hasil" },
    { icon: Award, label: "Sertifikat", href: "/mahasiswa/sertifikat" },
  ],
  instruktur: [
    { icon: Home, label: "Dashboard", href: "/instruktur/dashboard" },
    { icon: Users, label: "Daftar Mahasiswa", href: "/instruktur/mahasiswa-list" },
    { icon: ClipboardList, label: "Penilaian", href: "/instruktur/penilaian" },
  ],
  admin: [
    { icon: Home, label: "Dashboard", href: "/admin/dashboard" },
    { icon: Users, label: "Mahasiswa", href: "/admin/mahasiswa" },
    { icon: Users, label: "Instruktur", href: "/admin/instruktur" },
    { icon: CreditCard, label: "Pembayaran", href: "/admin/pembayaran" },
    { icon: Calendar, label: "Jadwal", href: "/admin/jadwal" },
    { icon: ClipboardList, label: "Penilaian & Hasil", href: "/admin/penilaian" },
    { icon: Award, label: "Sertifikat", href: "/admin/sertifikat" },
    { icon: Settings, label: "Pengaturan", href: "/admin/pengaturan" },
  ],
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { toast } = useToast();

  if (!user) return null;

  const items = menuConfig[user.role] || [];

  const activeItem = items.find(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  );
  const pageTitle = activeItem?.label ?? "Dashboard";

  const handleLogout = async () => {
    await logout();
    toast({ title: "Berhasil keluar", description: "Sampai jumpa kembali!" });
  };

  return (
    <div className="flex min-h-screen" style={{ background: "#FAF7F0" }}>
      <aside
        className="flex flex-col border-r transition-all duration-300 relative"
        style={{
          width: collapsed ? 72 : 260,
          background: "linear-gradient(180deg, #84B179 0%, #6a9960 100%)",
          borderColor: "rgba(200, 234, 187, 0.15)",
        }}
      >
        <div className="flex items-center gap-3 px-4 h-16 border-b" style={{ borderColor: "rgba(255,255,255,0.15)" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.15)" }}>
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <span className="font-serif text-xl font-bold text-white">Mengaji</span>
          )}
        </div>

        <button
          data-testid="toggle-sidebar"
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full border flex items-center justify-center z-10 shadow-sm transition-colors"
          style={{ background: "#FAF7F0", borderColor: "#e0ddd6", color: "#84B179" }}
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.label}
                href={item.href}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group"
                style={{
                  background: active ? "rgba(255,255,255,0.18)" : "transparent",
                  color: active ? "#fff" : "rgba(255,255,255,0.7)",
                }}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="text-sm font-medium truncate">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 pb-4 border-t pt-4" style={{ borderColor: "rgba(255,255,255,0.15)" }}>
          {!collapsed && (
            <div className="px-3 pb-3">
              <p className="text-sm font-medium truncate text-white">{user.name ?? ""}</p>
              <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.6)" }}>
                {user.role === "mahasiswa" ? user.nim : user.role === "instruktur" ? "Instruktur" : "Administrator"}
              </p>
            </div>
          )}
          <button
            data-testid="button-logout"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200"
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="text-sm">Keluar</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="h-16 flex items-center justify-between px-8 border-b" style={{ borderColor: "#e8e4db", background: "rgba(250, 247, 240, 0.8)", backdropFilter: "blur(8px)" }}>
          <h2 className="text-lg font-semibold" style={{ color: "#1A1A1A" }}>{pageTitle}</h2>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: "#84B179", color: "#fff" }}>
              {user.name?.charAt(0) ?? "?"}
            </div>
          </div>
        </header>
        <div className="p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
