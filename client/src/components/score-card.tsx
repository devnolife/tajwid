interface ScoreCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: string;
  accent?: string;
}

export function ScoreCard({ title, value, subtitle, icon, color = "#84B179", accent = "#A2CB8B" }: ScoreCardProps) {
  return (
    <div
      data-testid={`card-${title.toLowerCase().replace(/\s+/g, "-")}`}
      className="rounded-2xl p-5 border transition-all duration-200 hover:shadow-md"
      style={{ background: "#fff", borderColor: "#e8e4db" }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium" style={{ color: "#888" }}>{title}</p>
          <p className="text-2xl font-bold" style={{ color }}>{value}</p>
          {subtitle && <p className="text-xs" style={{ color: "#aaa" }}>{subtitle}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${accent}15`, color: accent }}>
          {icon}
        </div>
      </div>
    </div>
  );
}
