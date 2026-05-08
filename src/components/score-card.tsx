interface ScoreCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: string;
  accent?: string;
}

export function ScoreCard({ title, value, subtitle, icon, color, accent }: ScoreCardProps) {
  const accentColor = accent ?? "hsl(38 55% 56%)";
  const valueColor = color ?? "hsl(168 50% 22%)";

  return (
    <div
      data-testid={`card-${title.toLowerCase().replace(/\s+/g, "-")}`}
      className="group relative rounded-2xl p-5 border bg-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-20px_hsl(168_50%_22%/0.25)] overflow-hidden"
      style={{ borderColor: "hsl(40 22% 88%)" }}
    >
      {/* Subtle corner ornament */}
      <svg
        className="absolute -top-3 -right-3 w-16 h-16 opacity-[0.08] group-hover:opacity-[0.18] transition-opacity duration-500"
        viewBox="0 0 100 100" fill="none" stroke={accentColor} strokeWidth="0.8"
      >
        <path d="M50 5 L70 30 L95 50 L70 70 L50 95 L30 70 L5 50 L30 30 Z" />
        <path d="M50 5 L70 30 L95 50 L70 70 L50 95 L30 70 L5 50 L30 30 Z" transform="rotate(45 50 50)" />
      </svg>

      <div className="relative flex items-start justify-between gap-3">
        <div className="space-y-1.5 min-w-0">
          <p className="text-[11px] tracking-[0.18em] uppercase font-semibold text-muted-foreground">{title}</p>
          <p className="font-display text-3xl leading-tight truncate" style={{ color: valueColor }}>{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div
          className="flex items-center justify-center w-11 h-11 rounded-xl border flex-shrink-0 transition-transform duration-300 group-hover:rotate-[8deg]"
          style={{
            background: `linear-gradient(135deg, ${accentColor}18, ${accentColor}05)`,
            color: accentColor,
            borderColor: `${accentColor}33`,
          }}
        >
          {icon}
        </div>
      </div>

      {/* Bottom hairline */}
      <div
        className="absolute bottom-0 left-5 right-5 h-px opacity-60"
        style={{ background: `linear-gradient(90deg, transparent, ${accentColor}55, transparent)` }}
      />
    </div>
  );
}
