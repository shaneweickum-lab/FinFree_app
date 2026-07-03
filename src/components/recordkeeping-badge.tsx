"use client";

import { useProgress } from "@/lib/progress-context";

export function RecordkeepingBadge() {
  const { progress, hydrated } = useProgress();

  return (
    <div
      className="flex items-center gap-1.5 rounded-full border border-rich-gold/40 bg-white/10 px-3 py-1.5 font-semibold text-white"
      aria-label="Recordkeeping score"
    >
      <span aria-hidden className="text-base leading-none">📒</span>
      <span className="tabular-nums">{hydrated ? progress.recordkeepingScore : "—"}</span>
      <span className="hidden text-xs font-medium text-white/70 sm:inline">Recordkeeping</span>
    </div>
  );
}
