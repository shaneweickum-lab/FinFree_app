"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FinCoinBadge } from "./fin-coin-badge";
import { useProgress } from "@/lib/progress-context";
import { useAuth } from "@/lib/auth-context";

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/trading-floor", label: "Trading Floor" },
  { href: "/achievements", label: "Achievements" },
  { href: "/analytics", label: "Analytics" },
  { href: "/profile", label: "Profile" },
];

export function AppHeader() {
  const pathname = usePathname();
  const { progress, hydrated } = useProgress();
  const { username, logout } = useAuth();

  return (
    <header className="sticky top-0 z-10 border-b border-royal-purple/10 bg-royal-purple text-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span aria-hidden className="text-xl">🏠</span>
          <span>FinFree App</span>
        </Link>

        <nav className="flex flex-wrap items-center gap-1 text-sm">
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

        <div className="flex items-center gap-3">
          <FinCoinBadge />
          <span className="hidden text-xs text-white/70 sm:inline">{username}</span>
          <button
            onClick={logout}
            className="rounded-full border border-white/30 px-3 py-1 text-xs font-semibold hover:bg-white/10"
          >
            Log Out
          </button>
        </div>
      </div>
    </header>
  );
}
