"use client";

import { useEffect, useState } from "react";
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
import NotificationBell from "@/components/notification-bell";

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
    { icon: Calendar, label: "Jadwal Tes", href: "/instruktur/jadwal-mengajar" },
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

  // Restore sidebar state from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "true") setCollapsed(true);
  }, []);

  // Persist sidebar state + toggle helper with keyboard shortcut Ctrl+B
  const toggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("sidebar-collapsed", String(next));
      }
      return next;
    });
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

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
    <div className="flex min-h-screen bg-background">
      {/* === Desktop Sidebar — emerald sanctuary === */}
      <aside
        className="hidden lg:flex flex-col border-r transition-all duration-300 relative overflow-hidden"
        style={{
          width: collapsed ? 80 : 280,
          background:
            "linear-gradient(180deg, hsl(168 50% 14%) 0%, hsl(172 55% 10%) 60%, hsl(180 60% 8%) 100%)",
          borderColor: "hsl(168 30% 18%)",
        }}
      >
        {/* Subtle arabesque texture in sidebar */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.06] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="side-pat" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
              <g fill="none" stroke="#E8D5A8" strokeWidth="0.5">
                <path d="M40 8 L56 24 L72 40 L56 56 L40 72 L24 56 L8 40 L24 24 Z" />
                <circle cx="40" cy="40" r="4" />
              </g>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#side-pat)" />
        </svg>
        {/* gold glow accent at top */}
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, hsl(38 60% 60% / 0.6), transparent)" }} />

        <div className="relative flex items-center gap-3 px-5 h-[78px] border-b border-white/10">
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <img src="/logo/logo.png" alt="" className="w-7 h-7 object-contain" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <span className="font-display italic text-2xl text-white">TajwidKu</span>
              <p className="text-[10px] tracking-[0.22em] uppercase text-[hsl(38_55%_70%)]/70 mt-0.5">Sajadah Subuh</p>
            </div>
          )}
        </div>

        <button
          data-testid="toggle-sidebar"
          onClick={toggleSidebar}
          title={collapsed ? "Buka sidebar (Ctrl+B)" : "Tutup sidebar (Ctrl+B)"}
          aria-label={collapsed ? "Buka sidebar" : "Tutup sidebar"}
          className="sr-only"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>

        <nav className="relative flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {!collapsed && (
            <p className="px-4 mb-3 text-[10px] tracking-[0.28em] uppercase text-white/35 font-semibold">Menu</p>
          )}
          {items.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.label}
                href={item.href}
                title={collapsed ? item.label : undefined}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                className="group w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 relative"
                style={{
                  background: active
                    ? "linear-gradient(90deg, hsl(38 55% 56% / 0.18), hsl(38 55% 56% / 0.04))"
                    : "transparent",
                  color: active ? "hsl(38 65% 78%)" : "rgba(255,255,255,0.62)",
                }}
              >
                {active && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-7 rounded-r-full"
                    style={{ background: "hsl(38 60% 60%)", boxShadow: "0 0 12px hsl(38 60% 60% / 0.6)" }}
                  />
                )}
                <Icon className="w-[20px] h-[20px] flex-shrink-0" strokeWidth={active ? 2.2 : 1.7} />
                {!collapsed && (
                  <span className={`text-[14px] truncate ${active ? "font-semibold tracking-wide" : "font-medium"}`}>
                    {item.label}
                  </span>
                )}
                {!collapsed && active && (
                  <span className="ml-auto text-[hsl(38_60%_60%)] text-sm">۞</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="relative px-3 pb-5 border-t border-white/10 pt-4">
          {!collapsed && (
            <div className="px-4 pb-3">
              <p className="text-[14px] font-semibold truncate text-white">{user.name ?? ""}</p>
              <p className="text-[11px] truncate tracking-wide" style={{ color: "hsl(38 55% 70% / 0.65)" }}>
                {user.role === "mahasiswa" ? `NIM ${user.nim}` : user.role === "instruktur" ? "Instruktur" : "Administrator"}
              </p>
            </div>
          )}
          <button
            data-testid="button-logout"
            onClick={handleLogout}
            className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 hover:bg-white/5 text-white/55 hover:text-[hsl(38_65%_78%)]"
          >
            <LogOut className="w-[20px] h-[20px] flex-shrink-0" />
            {!collapsed && <span className="text-[14px] font-medium">Keluar</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto relative">
        {/* === Header — desktop === */}
        <header
          className="hidden lg:flex h-[68px] items-center justify-between px-8 border-b sticky top-0 z-20"
          style={{
            borderColor: "hsl(40 22% 86%)",
            background: "hsl(42 38% 96% / 0.78)",
            backdropFilter: "saturate(140%) blur(14px)",
          }}
        >
          <div className="flex items-baseline gap-3">
            <h2 className="font-display italic text-2xl text-foreground leading-none">{pageTitle}</h2>
            <span className="text-[hsl(38_55%_56%)] text-sm">۞</span>
            <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground">
              {user.role === "mahasiswa" ? "Mahasiswa" : user.role === "instruktur" ? "Instruktur" : "Administrator"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <Link href="/profil" className="flex items-center gap-3 group" title="Profil saya">
              <div className="text-right mr-1 leading-tight">
                <p className="text-sm font-semibold text-foreground group-hover:text-[hsl(168_50%_22%)] transition-colors">{user.name ?? ""}</p>
                <p className="text-[11px] text-muted-foreground tracking-wide">
                  {user.role === "mahasiswa" ? `NIM ${user.nim}` : user.role === "instruktur" ? "Instruktur" : "Administrator"}
                </p>
              </div>
              {user.role === "mahasiswa" && user.nim ? (
                <img
                  src={getMahasiswaPhotoUrl(user.nim)}
                  alt={user.name || ""}
                  className="w-10 h-10 rounded-full object-cover border-2 group-hover:scale-105 transition-transform"
                  style={{ borderColor: "hsl(38 55% 56% / 0.6)" }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.outerHTML = `<div class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2" style="background:hsl(168 50% 22%);color:hsl(44 45% 96%);border-color:hsl(38 55% 56% / 0.6)">${user.name?.charAt(0) ?? "?"}</div>`;
                  }}
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 group-hover:scale-105 transition-transform"
                  style={{ background: "hsl(168 50% 22%)", color: "hsl(44 45% 96%)", borderColor: "hsl(38 55% 56% / 0.6)" }}
                >
                  {user.name?.charAt(0) ?? "?"}
                </div>
              )}
            </Link>
          </div>
        </header>

        {/* === Header — mobile === */}
        <header
          className="flex lg:hidden items-center justify-between px-4 border-b sticky top-0 z-30"
          style={{
            height: 60,
            borderColor: "hsl(40 22% 86%)",
            background: "hsl(42 38% 96% / 0.95)",
            backdropFilter: "blur(10px)",
          }}
        >
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <img src="/logo/universitas.png" alt="" style={{ width: 26, height: 26 }} className="object-contain" />
            <img src="/logo/teknik.png" alt="" style={{ width: 26, height: 26 }} className="object-contain" />
            <img src="/logo/logo.png" alt="" style={{ width: 26, height: 26 }} className="object-contain" />
            <span className="font-display italic text-base ml-1 text-primary">TajwidKu</span>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <div className="text-right leading-tight">
              <p className="text-xs font-semibold truncate max-w-[120px] text-foreground">
                {user.name ?? ""}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {user.role === "mahasiswa" ? user.nim : user.role === "instruktur" ? "Instruktur" : "Admin"}
              </p>
            </div>
            {user.role === "mahasiswa" && user.nim ? (
              <Link href="/profil" title="Profil saya">
                <img
                  src={getMahasiswaPhotoUrl(user.nim)}
                  alt={user.name || ""}
                  className="w-8 h-8 rounded-full object-cover border-2"
                  style={{ borderColor: "hsl(38 55% 56% / 0.5)" }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.outerHTML = `<div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style="background:hsl(168 50% 22%);color:hsl(44 45% 96%)">${user.name?.charAt(0) ?? "?"}</div>`;
                  }}
                />
              </Link>
            ) : (
              <Link href="/profil" title="Profil saya">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: "hsl(168 50% 22%)", color: "hsl(44 45% 96%)" }}
                >
                  {user.name?.charAt(0) ?? "?"}
                </div>
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg transition-colors text-muted-foreground hover:text-primary"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="p-4 pb-24 lg:p-8 lg:pb-10">
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
            {moreOpen && (
              <div
                className="fixed inset-0 z-50 lg:hidden"
                onClick={() => setMoreOpen(false)}
              >
                <div className="absolute inset-0 bg-[hsl(168_50%_10%)]/40 backdrop-blur-sm" />
                <div
                  className="absolute bottom-16 right-2 left-2 rounded-2xl shadow-2xl p-3 space-y-1 border"
                  style={{
                    background: "hsl(44 45% 98%)",
                    borderColor: "hsl(40 22% 86%)",
                    marginBottom: "env(safe-area-inset-bottom)",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between px-2 pb-2 border-b" style={{ borderColor: "hsl(40 22% 88%)" }}>
                    <span className="font-display italic text-base text-foreground">Menu Lainnya</span>
                    <button onClick={() => setMoreOpen(false)} className="p-1 rounded-lg text-muted-foreground hover:text-primary">
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
                          background: active ? "hsl(38 55% 56% / 0.14)" : "transparent",
                          color: active ? "hsl(168 50% 22%)" : "hsl(168 18% 32%)",
                        }}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className={`text-sm ${active ? "font-semibold" : "font-normal"}`}>{item.label}</span>
                        {active && <span className="ml-auto text-[hsl(38_55%_56%)]">۞</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            <nav
              className="fixed bottom-0 left-0 right-0 z-40 flex lg:hidden border-t"
              style={{
                background: "hsl(44 45% 98% / 0.96)",
                backdropFilter: "blur(14px)",
                borderColor: "hsl(40 22% 86%)",
                paddingBottom: "env(safe-area-inset-bottom)",
                boxShadow: "0 -4px 24px -8px hsl(168 50% 14% / 0.12)",
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
                      className="flex flex-col items-center justify-center gap-0.5 py-2.5 flex-1 transition-colors relative"
                      style={{ color: active ? "hsl(168 50% 22%)" : "hsl(168 18% 50%)" }}
                    >
                      {active && (
                        <span
                          className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-[3px] rounded-b-full"
                          style={{ background: "hsl(38 55% 56%)", boxShadow: "0 2px 8px hsl(38 55% 56% / 0.55)" }}
                        />
                      )}
                      <Icon className="w-5 h-5" strokeWidth={active ? 2.4 : 1.7} />
                      <span className={`text-[10px] leading-tight truncate max-w-[60px] ${active ? "font-semibold" : "font-normal"}`}>
                        {item.label.split(" ")[0]}
                      </span>
                    </Link>
                  );
                })}
                {needsMore && (
                  <button
                    onClick={() => setMoreOpen(!moreOpen)}
                    className="flex flex-col items-center justify-center gap-0.5 py-2.5 flex-1 transition-colors relative"
                    style={{ color: moreIsActive || moreOpen ? "hsl(168 50% 22%)" : "hsl(168 18% 50%)" }}
                  >
                    {moreIsActive && !moreOpen && (
                      <span
                        className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-[3px] rounded-b-full"
                        style={{ background: "hsl(38 55% 56%)" }}
                      />
                    )}
                    <MoreHorizontal className="w-5 h-5" strokeWidth={moreIsActive || moreOpen ? 2.4 : 1.7} />
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
