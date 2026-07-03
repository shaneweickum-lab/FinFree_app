"use client";

import { useState } from "react";
import { useProgress } from "@/lib/progress-context";
import { useProfile } from "@/lib/profile-context";
import {
  computeCoinsPerDay,
  computeConceptMasteryBreakdown,
  computeEngagement,
  computeGrowthScore,
  computeTradingStats,
} from "@/lib/analytics";
import { totalFinCoinEarned } from "@/lib/achievements";
import { formatCompactCoins, MAX_TRADING_LEVEL } from "@/lib/trading-levels";
import { StatTile } from "@/components/stat-tile";
import { ProgressBar } from "@/components/progress-bar";
import { DailyCoinChart } from "@/components/daily-coin-chart";
import { MODULES } from "@/lib/content";

export default function AnalyticsPage() {
  const { progress, hydrated: progressHydrated } = useProgress();
  const { profile, hydrated: profileHydrated } = useProfile();

  const [now] = useState(() => Date.now());

  if (!progressHydrated || !profileHydrated) return null;

  const growthScore = computeGrowthScore(progress, profile, []);
  const conceptRows = computeConceptMasteryBreakdown(progress);
  const coinsPerDay = computeCoinsPerDay(progress, 14, now);
  const tradingStats = computeTradingStats(progress, []);
  const engagement = computeEngagement(progress, now);
  const totalEarned = totalFinCoinEarned(progress);
  const totalSpent = totalEarned - progress.finCoinBalance;
  const overallQuizAccuracy =
    progress.quizAttempts.length === 0
      ? null
      : progress.quizAttempts.reduce((sum, a) => sum + a.score, 0) / progress.quizAttempts.length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-royal-purple-dark">Analytics</h1>
      <p className="mt-1 text-sm text-foreground/60">Your personal learning and trading metrics.</p>

      <section className="mt-6 rounded-3xl bg-gradient-to-br from-royal-purple to-royal-purple-dark p-6 text-center text-white">
        <p className="text-sm font-semibold uppercase tracking-wide text-rich-gold-light">Financial Growth Score</p>
        <p className="mt-1 text-5xl font-bold">{growthScore}</p>
        <p className="mt-1 text-xs text-white/70">Blends curriculum progress, quiz mastery, trading level, and onboarding.</p>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-royal-purple">Learning</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Modules Complete" value={`${progress.completedModuleIds.length}/${MODULES.length}`} />
          <StatTile label="Lessons Complete" value={String(progress.completedLessonIds.length)} />
          <StatTile
            label="Quiz Accuracy"
            value={overallQuizAccuracy === null ? "—" : `${Math.round(overallQuizAccuracy * 100)}%`}
          />
          <StatTile label="Quizzes Taken" value={String(progress.quizAttempts.length)} />
        </div>

        {conceptRows.length > 0 && (
          <div className="mt-4 rounded-2xl border-2 border-royal-purple/10 bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-royal-purple-dark">Concept Mastery</h3>
            <div className="space-y-2">
              {conceptRows.map((row) => (
                <div key={row.concept} className="flex items-center gap-3 text-sm">
                  <span className="w-40 shrink-0 truncate text-foreground/70">{row.concept.replace(/-/g, " ")}</span>
                  <div className="flex-1">
                    <ProgressBar fraction={row.pct} colorClass="bg-money-green" />
                  </div>
                  <span className="w-10 shrink-0 text-right text-xs font-semibold text-foreground/60">
                    {Math.round(row.pct * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-royal-purple">Fin Coin Economy</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Current Balance" value={`${progress.finCoinBalance} 🪙`} />
          <StatTile label="Total Earned" value={`${totalEarned} 🪙`} />
          <StatTile label="Total Spent" value={`${Math.max(0, totalSpent)} 🪙`} />
          <StatTile label="Ledger Entries" value={String(progress.finCoinLedger.length)} />
        </div>
        <div className="mt-4 rounded-2xl border-2 border-royal-purple/10 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-royal-purple-dark">Fin Coin Earned — Last 14 Days</h3>
          <DailyCoinChart data={coinsPerDay} />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-royal-purple">Trading Floor</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Highest Level" value={`${progress.highestTradingLevel}/${MAX_TRADING_LEVEL}`} />
          <StatTile label="Portfolio (approx.)" value={`${formatCompactCoins(tradingStats.portfolioValue)} 🪙`} />
          <StatTile label="Total Trades" value={String(tradingStats.totalTrades)} />
          <StatTile
            label="Win Rate"
            value={tradingStats.winRate === null ? "—" : `${Math.round(tradingStats.winRate * 100)}%`}
            sublabel={tradingStats.winRate === null ? undefined : `${tradingStats.wins}W / ${tradingStats.losses}L`}
          />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-royal-purple">Engagement</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Active Days" value={String(engagement.activeDays)} />
          <StatTile label="Current Streak" value={`${engagement.currentStreakDays}d`} />
        </div>
      </section>
    </div>
  );
}
