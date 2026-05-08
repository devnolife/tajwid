"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Check, CheckCheck, X, Calendar, CreditCard, FileText, Award, Info } from "lucide-react";
import type { Notification } from "@shared/schema";

const POLL_MS = 30000;

const TYPE_META: Record<string, { icon: any; color: string; bg: string }> = {
  payment: { icon: CreditCard, color: "hsl(38 55% 40%)", bg: "hsl(38 55% 56% / 0.12)" },
  schedule: { icon: Calendar, color: "hsl(168 50% 22%)", bg: "hsl(168 50% 22% / 0.1)" },
  result: { icon: FileText, color: "hsl(152 38% 32%)", bg: "hsl(152 38% 42% / 0.12)" },
  certificate: { icon: Award, color: "hsl(38 55% 40%)", bg: "hsl(38 60% 78% / 0.25)" },
  system: { icon: Info, color: "hsl(190 28% 35%)", bg: "hsl(190 28% 35% / 0.08)" },
  info: { icon: Info, color: "hsl(190 28% 35%)", bg: "hsl(190 28% 35% / 0.08)" },
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "baru saja";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.items || []);
      setUnread(data.unread || 0);
    } catch {}
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, POLL_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!open) return;
    fetchData();
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const markRead = async (id: string) => {
    setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnread(c => Math.max(0, c - 1));
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
  };

  const remove = async (id: string) => {
    setItems(prev => prev.filter(n => n.id !== id));
    await fetch(`/api/notifications/${id}`, { method: "DELETE" });
    fetchData();
  };

  const markAll = async () => {
    setItems(prev => prev.map(n => ({ ...n, read: true })));
    setUnread(0);
    await fetch("/api/notifications/read-all", { method: "POST" });
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl transition-colors hover:bg-[hsl(38_55%_56%/0.12)]"
        title="Notifikasi"
        aria-label="Notifikasi"
      >
        <Bell className="w-5 h-5" style={{ color: "hsl(168 50% 22%)" }} />
        {unread > 0 && (
          <span
            className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
            style={{ background: "hsl(8 70% 52%)", boxShadow: "0 0 0 2px hsl(42 38% 96%)" }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={dropdownRef}
          className="absolute right-0 top-full mt-2 w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl border shadow-2xl z-50 overflow-hidden"
          style={{ background: "hsl(44 45% 98%)", borderColor: "hsl(40 22% 86%)" }}
        >
          <div className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: "hsl(40 22% 88%)" }}>
            <div>
              <h3 className="font-display italic text-base" style={{ color: "hsl(190 28% 12%)" }}>Notifikasi</h3>
              <p className="text-[11px]" style={{ color: "hsl(190 28% 35%)" }}>{unread > 0 ? `${unread} belum dibaca` : "Semua sudah dibaca"}</p>
            </div>
            {unread > 0 && (
              <button
                onClick={markAll}
                className="text-xs px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1 hover:bg-white transition-colors"
                style={{ color: "hsl(168 50% 22%)" }}
              >
                <CheckCheck className="w-3.5 h-3.5" /> Tandai semua
              </button>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {items.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="w-12 h-12 mx-auto rounded-2xl flex items-center justify-center mb-3" style={{ background: "hsl(38 55% 56% / 0.1)" }}>
                  <Bell className="w-5 h-5" style={{ color: "hsl(38 55% 56%)" }} />
                </div>
                <p className="text-sm" style={{ color: "hsl(190 28% 35%)" }}>Belum ada notifikasi</p>
              </div>
            ) : (
              items.map(n => {
                const meta = TYPE_META[n.type] || TYPE_META.info;
                const Icon = meta.icon;
                const Body = (
                  <div
                    className="px-4 py-3 flex gap-3 transition-colors hover:bg-[hsl(40_22%_92%/0.5)] cursor-pointer relative group"
                    style={{ borderBottom: "1px solid hsl(40 22% 92%)" }}
                  >
                    {!n.read && (
                      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full" style={{ background: "hsl(38 55% 56%)" }} />
                    )}
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: meta.bg }}>
                      <Icon className="w-4 h-4" style={{ color: meta.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${n.read ? "font-normal" : "font-semibold"}`} style={{ color: "hsl(190 28% 12%)" }}>
                        {n.title}
                      </p>
                      <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "hsl(190 28% 35%)" }}>
                        {n.message}
                      </p>
                      <p className="text-[10px] mt-1" style={{ color: "hsl(190 28% 50%)" }}>
                        {timeAgo(new Date(n.createdAt))}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!n.read && (
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); markRead(n.id); }}
                          className="p-1 rounded hover:bg-white"
                          title="Tandai dibaca"
                        >
                          <Check className="w-3.5 h-3.5" style={{ color: "hsl(152 38% 32%)" }} />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); remove(n.id); }}
                        className="p-1 rounded hover:bg-white"
                        title="Hapus"
                      >
                        <X className="w-3.5 h-3.5" style={{ color: "hsl(8 50% 50%)" }} />
                      </button>
                    </div>
                  </div>
                );
                return n.link ? (
                  <Link
                    key={n.id}
                    href={n.link}
                    onClick={() => { if (!n.read) markRead(n.id); setOpen(false); }}
                  >
                    {Body}
                  </Link>
                ) : (
                  <div key={n.id} onClick={() => !n.read && markRead(n.id)}>{Body}</div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
