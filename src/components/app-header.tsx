"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FinCoinBadge } from "./fin-coin-badge";
import { useProgress } from "@/lib/progress-context";

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/trading-floor", label: "Trading Floor" },
];

export function AppHeader() {
  const pathname = usePathname();
  const { progress, hydrated } = useProgress();

  return (
    <header className="sticky top-0 z-10 border-b border-royal-purple/10 bg-royal-purple text-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span aria-hidden className="text-xl">🏠</span>
          <span>FinFree App</span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          {NAV_LINKS.map((link) => {
            const isTradingFloor = link.href === "/trading-floor";
            const locked = isTradingFloor && hydrated && !progress.tradingFloorUnlocked;
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-3 py-1.5 transition-colors ${
                  active ? "bg-white/15 font-semibold" : "hover:bg-white/10"
                } ${locked ? "opacity-60" : ""}`}
              >
                {link.label}
                {locked ? " 🔒" : ""}
              </Link>
            );
          })}
        </nav>

        <FinCoinBadge />
      </div>
    </header>
  );
}
