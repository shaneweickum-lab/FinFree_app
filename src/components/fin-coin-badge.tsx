"use client";

import Link from "next/link";
import { useProgress } from "@/lib/progress-context";

export function FinCoinBadge() {
  const { progress, hydrated } = useProgress();

  return (
    <Link
      href="/fin-coin-bank"
      className="flex items-center gap-1.5 rounded-full bg-money-green/10 px-3 py-1.5 font-semibold text-money-green-dark transition hover:bg-money-green/20"
      aria-label="Fin Coin balance — open the Fin Coin Bank"
    >
      <span aria-hidden className="text-base leading-none">🪙</span>
      <span className="tabular-nums">{hydrated ? progress.finCoinBalance : "—"}</span>
      <span className="hidden text-xs font-medium text-money-green-dark/70 sm:inline">Fin Coin</span>
    </Link>
  );
}
