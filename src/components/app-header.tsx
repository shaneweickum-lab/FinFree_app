"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FinCoinBadge } from "./fin-coin-badge";
import { RecordkeepingBadge } from "./recordkeeping-badge";
import { useProgress } from "@/lib/progress-context";
import { useAuth } from "@/lib/auth-context";

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/trading-floor", label: "Trading Floor" },
  { href: "/trade-ledger", label: "Trade Ledger" },
  { href: "/achievements", label: "Achievements" },
  { href: "/analytics", label: "Analytics" },
  { href: "/profile", label: "Profile" },
];

const LOCKED_UNTIL_TRADING_FLOOR = new Set(["/trading-floor", "/trade-ledger"]);

export function AppHeader() {
  const pathname = usePathname();
  const { progress, hydrated } = useProgress();
  const { username, logout } = useAuth();

  return (
    <header className="sticky top-0 z-10 border-b border-royal-purple/10 bg-royal-purple text-white">
      <div className="mx-auto max-w-5xl px-4 py-3 sm:px-6">
        {/* Logo and account controls always share one row — only two items, so wrapping (on very
         * narrow screens) never produces the lopsided single-item line nav used to leave behind. */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
            <span aria-hidden className="text-xl">🏠</span>
            <span>FinFree App</span>
          </Link>

          <div className="flex items-center gap-3">
            <FinCoinBadge />
            <RecordkeepingBadge />
            <span className="hidden text-xs text-white/70 sm:inline">{username}</span>
            <button
              onClick={logout}
              className="rounded-full border border-white/30 px-3 py-1 text-xs font-semibold hover:bg-white/10"
            >
              Log Out
            </button>
          </div>
        </div>

        {/* Nav gets its own full-width row, centered, instead of competing with the controls above
         * for space on one line. */}
        <nav className="mt-2 flex flex-wrap items-center justify-center gap-1 text-sm">
          {NAV_LINKS.map((link) => {
            const locked = LOCKED_UNTIL_TRADING_FLOOR.has(link.href) && hydrated && !progress.tradingFloorUnlocked;
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
      </div>
    </header>
  );
}
