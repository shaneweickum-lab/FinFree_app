"use client";

import { useProgress } from "@/lib/progress-context";

export function FinCoinBadge() {
  const { progress, hydrated } = useProgress();

  return (
    <div
      className="flex items-center gap-1.5 rounded-full bg-money-green/10 px-3 py-1.5 font-semibold text-money-green-dark"
      aria-label="Fin Coin balance"
    >
      <span aria-hidden className="text-base leading-none">🪙</span>
      <span className="tabular-nums">{hydrated ? progress.finCoinBalance : "—"}</span>
      <span className="hidden text-xs font-medium text-money-green-dark/70 sm:inline">Fin Coin</span>
    </div>
  );
}
