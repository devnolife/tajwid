const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  belum_bayar: { label: "Belum Bayar", bg: "#FEE2E2", text: "#DC2626" },
  menunggu_verifikasi: { label: "Menunggu Verifikasi", bg: "#FEF3C7", text: "#D97706" },
  lunas: { label: "Lunas", bg: "#D1FAE5", text: "#059669" },
  ditolak: { label: "Ditolak", bg: "#FEE2E2", text: "#DC2626" },
  belum_tes: { label: "Belum Tes", bg: "#E0E7FF", text: "#4F46E5" },
  sudah_tes: { label: "Sudah Tes", bg: "#FEF3C7", text: "#D97706" },
  lulus: { label: "Lulus", bg: "#D1FAE5", text: "#059669" },
  tidak_lulus: { label: "Tidak Lulus", bg: "#FEE2E2", text: "#DC2626" },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const config = statusConfig[status] || { label: status, bg: "#F3F4F6", text: "#6B7280" };
  return (
    <span
      data-testid={`badge-status-${status}`}
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${className || ""}`}
      style={{ background: config.bg, color: config.text }}
    >
      {config.label}
    </span>
  );
}
