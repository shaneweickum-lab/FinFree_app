import type { TickerState } from "./market";
import type { Position } from "./types";

export const MAX_TRADING_LEVEL = 30;
const LEVEL_1_GOAL = 10_000;
const LEVEL_GROWTH = 2.5;

/** Portfolio value needed to reach `level` (1-indexed): level 1 = 10,000, each level 2.5x the previous. */
export function goalForLevel(level: number): number {
  return LEVEL_1_GOAL * LEVEL_GROWTH ** (level - 1);
}

export function computePortfolioValue(cashBalance: number, positions: Position[], tickers: TickerState[]): number {
  const positionsValue = positions.reduce((sum, position) => {
    const ticker = tickers.find((t) => t.symbol === position.symbol);
    return sum + position.quantity * (ticker?.price ?? position.avgCost);
  }, 0);
  return cashBalance + positionsValue;
}

export interface TradingLevelInfo {
  level: number;
  goal: number;
  previousGoal: number;
  progressFraction: number;
  portfolioValue: number;
  isMaxLevel: boolean;
}

/** The current level is the highest level whose goal the portfolio value has reached (capped at MAX_TRADING_LEVEL). */
export function computeTradingLevel(portfolioValue: number): TradingLevelInfo {
  let level = 1;
  while (level < MAX_TRADING_LEVEL && portfolioValue >= goalForLevel(level + 1)) {
    level += 1;
  }

  const isMaxLevel = level >= MAX_TRADING_LEVEL;
  const previousGoal = level === 1 ? 0 : goalForLevel(level);
  const goal = isMaxLevel ? goalForLevel(MAX_TRADING_LEVEL) : goalForLevel(level + 1);
  const progressFraction = isMaxLevel ? 1 : clamp01((portfolioValue - previousGoal) / (goal - previousGoal));

  return { level, goal, previousGoal, progressFraction, portfolioValue, isMaxLevel };
}

export function formatCompactCoins(amount: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(amount);
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}
