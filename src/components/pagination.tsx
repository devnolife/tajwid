"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const pageNumbers = (): (number | "...")[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "...")[] = [1];
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 border-t" style={{ borderColor: "hsl(40 22% 88%)" }}>
      <div className="flex items-center gap-3 text-xs" style={{ color: "hsl(190 28% 35%)" }}>
        <span>
          Menampilkan <span className="font-semibold" style={{ color: "hsl(190 28% 12%)" }}>{start}-{end}</span> dari <span className="font-semibold" style={{ color: "hsl(190 28% 12%)" }}>{total}</span>
        </span>
        {onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="text-xs px-2 py-1 rounded-lg border bg-white"
            style={{ borderColor: "hsl(40 22% 88%)", color: "hsl(190 28% 12%)" }}
          >
            {pageSizeOptions.map(s => <option key={s} value={s}>{s} / hal</option>)}
          </select>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[hsl(40_22%_92%)] transition-colors"
          style={{ color: "hsl(168 50% 22%)" }}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pageNumbers().map((p, i) => (
          p === "..." ? (
            <span key={`e${i}`} className="px-2 text-xs" style={{ color: "hsl(190 28% 35%)" }}>…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className="min-w-[32px] h-8 px-2 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: p === page ? "hsl(168 50% 22%)" : "transparent",
                color: p === page ? "hsl(44 45% 96%)" : "hsl(190 28% 35%)",
              }}
            >
              {p}
            </button>
          )
        ))}
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[hsl(40_22%_92%)] transition-colors"
          style={{ color: "hsl(168 50% 22%)" }}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function usePagination<T>(items: T[], pageSize: number, page: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}
