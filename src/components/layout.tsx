"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-client";
import { getMahasiswaPhotoUrl } from "@/lib/mahasiswa-photo";
import {
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
  MoreHorizontal,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const menuConfig: Record<string, { icon: any; label: string; href: string }[]> = {
  mahasiswa: [
    { icon: Home, label: "Dashboard", href: "/mahasiswa/dashboard" },
    { icon: CreditCard, label: "Pembayaran", href: "/mahasiswa/pembayaran" },
    { icon: Calendar, label: "Jadwal Saya", href: "/mahasiswa/jadwal" },
    { icon: FileText, label: "Hasil Tajwid", href: "/mahasiswa/hasil" },
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
  const [moreOpen, setMoreOpen] = useState(false);
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
      {/* Desktop Sidebar — hidden di mobile, tampil di lg+ */}
      <aside
        className="hidden lg:flex flex-col border-r transition-all duration-300 relative"
        style={{
          width: collapsed ? 72 : 260,
          background: "linear-gradient(180deg, #84B179 0%, #6a9960 100%)",
          borderColor: "rgba(200, 234, 187, 0.15)",
        }}
      >
        <div className="flex items-center gap-3 px-4 h-16 border-b" style={{ borderColor: "rgba(255,255,255,0.15)" }}>
          <img src="/logo/logo.png" alt="TajwidKu" className="w-9 h-9 object-contain flex-shrink-0" />
          {!collapsed && (
            <span className="font-serif text-xl font-bold text-white">TajwidKu</span>
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
        {/* Header — desktop (lg+) */}
        <header className="hidden lg:flex h-16 items-center justify-between px-8 border-b" style={{ borderColor: "#e8e4db", background: "rgba(250, 247, 240, 0.8)", backdropFilter: "blur(8px)" }}>
          <h2 className="text-lg font-semibold" style={{ color: "#1A1A1A" }}>{pageTitle}</h2>
          <div className="flex items-center gap-3">
            {user.role === "mahasiswa" && user.nim ? (
              <img
                src={getMahasiswaPhotoUrl(user.nim)}
                alt={user.name || ""}
                className="w-9 h-9 rounded-full object-cover border"
                style={{ borderColor: "#e8e4db" }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.outerHTML = `<div class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold" style="background:#84B179;color:#fff">${user.name?.charAt(0) ?? "?"}</div>`;
                }}
              />
            ) : (
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: "#84B179", color: "#fff" }}>
                {user.name?.charAt(0) ?? "?"}
              </div>
            )}
          </div>
        </header>

        {/* Header — mobile (<lg) with 3 logos */}
        <header
          className="flex lg:hidden items-center justify-between px-4 border-b sticky top-0 z-30"
          style={{
            height: 56,
            borderColor: "#e8e4db",
            background: "rgba(250, 247, 240, 0.95)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <img src="/logo/universitas.png" alt="Unismuh" style={{ width: 28, height: 28, minWidth: 28 }} className="object-contain flex-shrink-0" />
            <img src="/logo/teknik.png" alt="Teknik" style={{ width: 28, height: 28, minWidth: 28 }} className="object-contain flex-shrink-0" />
            <img src="/logo/logo.png" alt="FT" style={{ width: 28, height: 28, minWidth: 28 }} className="object-contain flex-shrink-0" />
            <span className="font-serif text-sm font-bold ml-1 whitespace-nowrap" style={{ color: "#84B179" }}>TajwidKu</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium truncate max-w-[100px]" style={{ color: "#666" }}>
              {user.name ?? ""}
            </span>
            {user.role === "mahasiswa" && user.nim ? (
              <img
                src={getMahasiswaPhotoUrl(user.nim)}
                alt={user.name || ""}
                className="w-8 h-8 rounded-full object-cover border"
                style={{ borderColor: "#e8e4db" }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.outerHTML = `<div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style="background:#84B179;color:#fff">${user.name?.charAt(0) ?? "?"}</div>`;
                }}
              />
            ) : (
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "#84B179", color: "#fff" }}>
                {user.name?.charAt(0) ?? "?"}
              </div>
            )}
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: "#999" }}
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="p-4 pb-24 lg:p-8 lg:pb-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Tab Bar (<lg) */}
      {(() => {
        const MAX_TABS = 5;
        const needsMore = items.length > MAX_TABS;
        const visibleTabs = needsMore ? items.slice(0, MAX_TABS - 1) : items;
        const moreTabs = needsMore ? items.slice(MAX_TABS - 1) : [];
        const moreIsActive = moreTabs.some(
          (item) => pathname === item.href || pathname.startsWith(item.href + "/")
        );

        return (
          <>
            {/* "Lainnya" popup */}
            {moreOpen && (
              <div
                className="fixed inset-0 z-50 lg:hidden"
                onClick={() => setMoreOpen(false)}
              >
                <div className="absolute inset-0 bg-black/30" />
                <div
                  className="absolute bottom-16 right-2 left-2 rounded-2xl shadow-xl p-3 space-y-1"
                  style={{
                    background: "#FAF7F0",
                    marginBottom: "env(safe-area-inset-bottom)",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between px-2 pb-2 border-b" style={{ borderColor: "#e8e4db" }}>
                    <span className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>Menu Lainnya</span>
                    <button onClick={() => setMoreOpen(false)} className="p-1 rounded-lg" style={{ color: "#999" }}>
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {moreTabs.map((item) => {
                    const Icon = item.icon;
                    const active = pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={() => setMoreOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
                        style={{
                          background: active ? "rgba(132, 177, 121, 0.12)" : "transparent",
                          color: active ? "#84B179" : "#666",
                        }}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className={`text-sm ${active ? "font-semibold" : "font-normal"}`}>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            <nav
              className="fixed bottom-0 left-0 right-0 z-40 flex lg:hidden border-t shadow-lg"
              style={{
                background: "rgba(250, 247, 240, 0.97)",
                backdropFilter: "blur(12px)",
                borderColor: "#e8e4db",
                paddingBottom: "env(safe-area-inset-bottom)",
              }}
            >
              <div className="flex w-full">
                {visibleTabs.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="flex flex-col items-center justify-center gap-0.5 py-2 flex-1 transition-colors relative"
                      style={{ color: active ? "#84B179" : "#999" }}
                    >
                      {active && (
                        <span
                          className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                          style={{ background: "#84B179" }}
                        />
                      )}
                      <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.8} />
                      <span className={`text-[10px] leading-tight truncate max-w-[56px] ${active ? "font-semibold" : "font-normal"}`}>
                        {item.label.split(" ")[0]}
                      </span>
                    </Link>
                  );
                })}
                {needsMore && (
                  <button
                    onClick={() => setMoreOpen(!moreOpen)}
                    className="flex flex-col items-center justify-center gap-0.5 py-2 flex-1 transition-colors relative"
                    style={{ color: moreIsActive || moreOpen ? "#84B179" : "#999" }}
                  >
                    {moreIsActive && !moreOpen && (
                      <span
                        className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                        style={{ background: "#84B179" }}
                      />
                    )}
                    <MoreHorizontal className="w-5 h-5" strokeWidth={moreIsActive || moreOpen ? 2.5 : 1.8} />
                    <span className={`text-[10px] leading-tight ${moreIsActive || moreOpen ? "font-semibold" : "font-normal"}`}>
                      Lainnya
                    </span>
                  </button>
                )}
              </div>
            </nav>
          </>
        );
      })()}
    </div>
  );
}
