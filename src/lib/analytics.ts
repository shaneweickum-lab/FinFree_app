import { MODULES } from "./content";
import { computeOverallMasteryScore, computeConceptMastery } from "./adaptive";
import { computePortfolioValue, computeTradingLevel, MAX_TRADING_LEVEL } from "./trading-levels";
import type { TickerState } from "./market";
import type { UserProfile, UserProgress } from "./types";

export interface ConceptMasteryRow {
  concept: string;
  correct: number;
  total: number;
  pct: number;
}

export function computeConceptMasteryBreakdown(progress: UserProgress): ConceptMasteryRow[] {
  return computeConceptMastery(progress)
    .filter((c) => c.total > 0)
    .map((c) => ({ ...c, pct: c.correct / c.total }))
    .sort((a, b) => b.pct - a.pct);
}

export interface DailyCoinBucket {
  dateLabel: string;
  earned: number;
}

/** Buckets positive Fin Coin ledger entries by calendar day for the trailing `days` window. */
export function computeCoinsPerDay(progress: UserProgress, days: number, now: number): DailyCoinBucket[] {
  const buckets = new Map<string, number>();
  const dayMs = 24 * 60 * 60 * 1000;

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now - i * dayMs);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }

  for (const entry of progress.finCoinLedger) {
    if (entry.amount <= 0) continue;
    const key = new Date(entry.timestamp).toISOString().slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + entry.amount);
  }

  return Array.from(buckets.entries()).map(([key, earned]) => ({
    dateLabel: key.slice(5), // MM-DD
    earned,
  }));
}

export interface TradingStats {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number | null;
  level: number;
  portfolioValue: number;
  /** Positive = current win streak length, negative = current loss streak length, 0 = no decided trades yet. */
  currentStreak: number;
}

/**
 * Replays trade history chronologically, reconstructing running average cost per symbol, so each
 * sell can be scored a win (sold above running avg cost) or loss without needing extra stored state.
 */
export function computeTradingStats(progress: UserProgress, tickers: TickerState[]): TradingStats {
  const chronological = [...progress.tradeHistory].sort((a, b) => a.timestamp - b.timestamp);
  const runningAvgCost = new Map<string, { qty: number; avgCost: number }>();
  let wins = 0;
  let losses = 0;
  let currentStreak = 0;

  for (const trade of chronological) {
    const existing = runningAvgCost.get(trade.symbol);
    if (trade.side === "buy") {
      if (!existing) {
        runningAvgCost.set(trade.symbol, { qty: trade.quantity, avgCost: trade.price });
      } else {
        const totalQty = existing.qty + trade.quantity;
        const avgCost = (existing.avgCost * existing.qty + trade.price * trade.quantity) / totalQty;
        runningAvgCost.set(trade.symbol, { qty: totalQty, avgCost });
      }
    } else if (existing) {
      if (trade.price >= existing.avgCost) {
        wins += 1;
        currentStreak = currentStreak > 0 ? currentStreak + 1 : 1;
      } else {
        losses += 1;
        currentStreak = currentStreak < 0 ? currentStreak - 1 : -1;
      }
      runningAvgCost.set(trade.symbol, { qty: Math.max(0, existing.qty - trade.quantity), avgCost: existing.avgCost });
    }
  }

  const decidedTrades = wins + losses;
  const portfolioValue = computePortfolioValue(progress.finCoinBalance, progress.positions, tickers);

  return {
    totalTrades: progress.tradeHistory.length,
    wins,
    losses,
    winRate: decidedTrades === 0 ? null : wins / decidedTrades,
    level: computeTradingLevel(portfolioValue).level,
    portfolioValue,
    currentStreak,
  };
}

export interface EngagementStats {
  activeDays: number;
  currentStreakDays: number;
}

export function computeEngagement(progress: UserProgress, now: number): EngagementStats {
  const dayMs = 24 * 60 * 60 * 1000;
  const activeDayKeys = new Set(
    progress.finCoinLedger.map((entry) => new Date(entry.timestamp).toISOString().slice(0, 10)),
  );

  let streak = 0;
  for (let i = 0; ; i++) {
    const key = new Date(now - i * dayMs).toISOString().slice(0, 10);
    if (!activeDayKeys.has(key)) break;
    streak += 1;
  }

  return { activeDays: activeDayKeys.size, currentStreakDays: streak };
}

/**
 * Composite 0-100 "Financial Growth Score": a weighted blend of curriculum progress, quiz mastery,
 * trading performance, and engagement. Weights are tuned so no single dimension dominates —
 * a learner who only trades or only studies tops out around 60-70, not 100.
 */
export function computeGrowthScore(progress: UserProgress, profile: UserProfile, tickers: TickerState[]): number {
  const learningScore = progress.completedModuleIds.length / MODULES.length;
  const masteryScore = computeOverallMasteryScore(progress);
  const tradingStats = computeTradingStats(progress, tickers);
  const tradingScore = Math.min(1, computeTradingLevel(tradingStats.portfolioValue).level / (MAX_TRADING_LEVEL / 2));
  const onboardingScore = profile.onboardingBonusAwarded ? 1 : 0;

  const weighted =
    learningScore * 0.35 + masteryScore * 0.3 + tradingScore * 0.25 + onboardingScore * 0.1;

  return Math.round(weighted * 100);
}
