import { computeTradingStats } from "../analytics";
import { computePortfolioValue } from "../trading-levels";
import type { TickerState } from "../market";
import type { OrderKind, UserProgress } from "../types";
import type { TradeRecord } from "../types";

export type TradeVerdict = "Excellent" | "Sound" | "Risky" | "Reckless";

export interface FactorContribution {
  key: string;
  label: string;
  contribution: number;
  detail: string;
}

export interface TradeCritique {
  tradeId: string;
  verdict: TradeVerdict;
  score: number;
  factors: FactorContribution[];
  suggestedReframe: string;
}

interface FactorDef<F> {
  key: string;
  label: string;
  weight: number;
  baseline: number;
  value: (f: F) => number;
  detail: (f: F, value: number) => string;
}

/**
 * Contribution = weight * (value - baseline). This is exact SHAP for an additive linear model with
 * `baseline` standing in for the reference/expected feature value — i.e. "how much did this factor
 * push the verdict away from a typical trade," which is what the design doc's SHAP breakdown asks for.
 * A real deployment would swap this for a trained XGBoost + tree-SHAP model (per the doc's Phase 2:
 * "refined later using aggregated real user outcome data") once enough labeled outcomes exist; this
 * rule-based scorer is deliberately the doc's own Phase 1 "simulated/labeled... rule-based ground truth".
 */
function scoreFactors<F>(defs: FactorDef<F>[], features: F): FactorContribution[] {
  return defs
    .map((def) => {
      const value = def.value(features);
      const contribution = def.weight * (value - def.baseline);
      return { key: def.key, label: def.label, contribution, detail: def.detail(features, value) };
    })
    .filter((f) => Math.abs(f.contribution) > 1e-6);
}

function verdictFromScore(score: number): TradeVerdict {
  if (score >= 0.5) return "Excellent";
  if (score >= -1.5) return "Sound";
  if (score >= -4) return "Risky";
  return "Reckless";
}

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

// ---- Buy-side critique ----

export interface BuyTradeContext {
  positionValue: number;
  portfolioValueBeforeTrade: number;
  hasStopLoss: boolean;
  stopLossDistancePct: number | null;
  /** Signed % price move over the lookback window immediately before this entry. */
  momentumPct: number;
  /** Coefficient of variation (stdev / mean) over the lookback window — a volatility proxy standing in
   * for the doc's "recent candle pattern context" since the simulation tracks price points, not OHLC candles. */
  recentVolatilityPct: number;
  streakBeforeTrade: number;
  distinctPositionsAfter: number;
}

const BUY_FACTORS: FactorDef<BuyTradeContext>[] = [
  {
    key: "position-size",
    label: "Position size",
    weight: -6,
    baseline: 0.1,
    value: (f) => (f.portfolioValueBeforeTrade > 0 ? f.positionValue / f.portfolioValueBeforeTrade : 0),
    detail: (f, v) => `Position size was ${pct(v)} of portfolio${f.hasStopLoss ? "" : " with no stop-loss set"}.`,
  },
  {
    key: "stop-loss",
    label: "Stop-loss protection",
    weight: 1.5,
    baseline: 1,
    value: (f) => (f.hasStopLoss ? 1 : 0),
    detail: (f) => (f.hasStopLoss ? "Downside was protected with a stop-loss." : "No stop-loss was set to cap downside risk."),
  },
  {
    key: "stop-distance",
    label: "Stop-loss distance",
    weight: 1,
    baseline: 1,
    value: (f) => {
      if (f.stopLossDistancePct === null) return 0;
      const idealCenter = 0.05; // ~5% is a reasonable stop distance
      return Math.max(0, 1 - Math.abs(f.stopLossDistancePct - idealCenter) / idealCenter);
    },
    detail: (f) =>
      f.stopLossDistancePct === null
        ? "No stop-loss distance to evaluate."
        : `Stop-loss was set ${pct(f.stopLossDistancePct)} below entry.`,
  },
  {
    key: "momentum-chase",
    label: "Entry timing",
    weight: -4,
    baseline: 0,
    value: (f) => Math.max(0, f.momentumPct),
    detail: (f) =>
      f.momentumPct > 0.03
        ? `Entry occurred after the price already moved ${pct(f.momentumPct)}, consistent with chasing the move rather than a planned entry.`
        : "Entry did not chase a recent price spike.",
  },
  {
    key: "volatility",
    label: "Market volatility at entry",
    weight: -2,
    baseline: 0.03,
    value: (f) => f.recentVolatilityPct,
    detail: (f) => `Recent price volatility at entry was ${pct(f.recentVolatilityPct)}.`,
  },
  {
    key: "streak-risk",
    label: "Streak-driven risk",
    weight: -2,
    baseline: 0,
    value: (f) => (f.streakBeforeTrade <= -2 ? 1 : f.streakBeforeTrade >= 3 ? 0.5 : 0),
    detail: (f) =>
      f.streakBeforeTrade <= -2
        ? `This trade follows ${Math.abs(f.streakBeforeTrade)} losses in a row — a common revenge-trading pattern.`
        : f.streakBeforeTrade >= 3
          ? `This trade follows ${f.streakBeforeTrade} wins in a row — watch for overconfidence.`
          : "No streak-driven pressure detected.",
  },
  {
    key: "concentration",
    label: "Diversification",
    weight: -1.5,
    baseline: 0,
    value: (f) => (f.distinctPositionsAfter <= 1 ? 1 : 0),
    detail: (f) =>
      f.distinctPositionsAfter <= 1
        ? "This trade leaves the portfolio concentrated in a single position."
        : `Portfolio is spread across ${f.distinctPositionsAfter} positions.`,
  },
];

export function critiqueBuyTrade(trade: TradeRecord, context: BuyTradeContext): TradeCritique {
  const factors = scoreFactors(BUY_FACTORS, context).sort((a, b) => a.contribution - b.contribution);
  const score = factors.reduce((sum, f) => sum + f.contribution, 0);
  const worst = factors[0];
  const reframe =
    worst && worst.contribution < 0
      ? worst.key === "position-size"
        ? `What would this trade look like with a ${pct(0.1)} position size${context.hasStopLoss ? "" : " and a stop-loss 3-5% below entry"}?`
        : worst.key === "momentum-chase"
          ? "What would it look like to wait for a pullback or confirmation instead of entering right after the spike?"
          : worst.key === "streak-risk"
            ? "Would this trade still look good if the last few trades hadn't happened?"
            : "What would reduce this specific risk factor next time?"
      : "This trade shows solid risk management — keep applying the same discipline.";

  return { tradeId: trade.id, verdict: verdictFromScore(score), score, factors: factors.slice(0, 3), suggestedReframe: reframe };
}

// ---- Sell-side critique ----

export interface SellTradeContext {
  holdingMinutes: number | null;
  wasLoss: boolean;
  streakBeforeTrade: number;
  distinctPositionsAfter: number;
}

const SELL_FACTORS: FactorDef<SellTradeContext>[] = [
  {
    key: "panic-exit",
    label: "Holding time",
    weight: -2,
    baseline: 0,
    value: (f) => (f.holdingMinutes !== null && f.holdingMinutes < 2 ? 1 : 0),
    detail: (f) =>
      f.holdingMinutes !== null && f.holdingMinutes < 2
        ? "Position was closed within 2 minutes of opening — a possible panic exit."
        : "Holding time before exit was reasonable.",
  },
  {
    key: "bag-holding",
    label: "Loss management",
    weight: -2,
    baseline: 0,
    value: (f) => (f.wasLoss && f.holdingMinutes !== null && f.holdingMinutes > 240 ? 1 : 0),
    detail: (f) =>
      f.wasLoss && f.holdingMinutes !== null && f.holdingMinutes > 240
        ? "A losing position was held for a long time before being closed."
        : "No excessive loss-holding detected.",
  },
  {
    key: "streak-risk",
    label: "Streak-driven risk",
    weight: -2,
    baseline: 0,
    value: (f) => (f.streakBeforeTrade <= -2 ? 1 : f.streakBeforeTrade >= 3 ? 0.5 : 0),
    detail: (f) =>
      f.streakBeforeTrade <= -2
        ? `This exit follows ${Math.abs(f.streakBeforeTrade)} losses in a row.`
        : f.streakBeforeTrade >= 3
          ? `This exit follows ${f.streakBeforeTrade} wins in a row.`
          : "No streak-driven pressure detected.",
  },
  {
    key: "concentration",
    label: "Diversification",
    weight: -1.5,
    baseline: 0,
    value: (f) => (f.distinctPositionsAfter === 0 ? 1 : 0),
    detail: (f) => (f.distinctPositionsAfter === 0 ? "This closes your only open position." : "Other positions remain open."),
  },
];

export function critiqueSellTrade(trade: TradeRecord, context: SellTradeContext): TradeCritique {
  const factors = scoreFactors(SELL_FACTORS, context).sort((a, b) => a.contribution - b.contribution);
  const score = factors.reduce((sum, f) => sum + f.contribution, 0);
  const worst = factors[0];
  const reframe =
    worst && worst.contribution < 0
      ? worst.key === "panic-exit"
        ? "What was the original plan for this trade — did this exit follow it, or react to the moment?"
        : worst.key === "bag-holding"
          ? "At what point should a pre-set stop-loss have closed this earlier?"
          : "Would this exit still make sense outside the current streak?"
      : context.wasLoss
        ? "Cutting a loss in a reasonable timeframe is good discipline."
        : "This exit shows solid trade management — keep it up.";

  return { tradeId: trade.id, verdict: verdictFromScore(score), score, factors: factors.slice(0, 3), suggestedReframe: reframe };
}

// ---- Pre-trade context extraction (called by the Trading Floor page, which alone has live ticker data) ----

function mean(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((sum, v) => sum + v, 0) / values.length;
}

function stdev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  return Math.sqrt(mean(values.map((v) => (v - m) ** 2)));
}

/** Builds a BuyTradeContext from state available right before calling executeTrade. */
export function buildBuyTradeContext(
  progress: UserProgress,
  tickers: TickerState[],
  symbol: string,
  quantity: number,
  execPrice: number,
  orderKind: OrderKind,
  stopPrice: number | undefined,
): BuyTradeContext {
  const ticker = tickers.find((t) => t.symbol === symbol);
  const history = ticker?.priceHistory ?? [execPrice];
  const lookback = history.slice(-6);
  const past = lookback[0] ?? execPrice;
  const momentumPct = past === 0 ? 0 : (execPrice - past) / past;
  const recentVolatilityPct = mean(lookback) === 0 ? 0 : stdev(lookback) / mean(lookback);

  const hasStopLoss = orderKind === "stop-loss" && stopPrice !== undefined;
  const stopLossDistancePct = hasStopLoss && stopPrice !== undefined ? Math.abs(execPrice - stopPrice) / execPrice : null;

  return {
    positionValue: quantity * execPrice,
    portfolioValueBeforeTrade: computePortfolioValue(progress.finCoinBalance, progress.positions, tickers),
    hasStopLoss,
    stopLossDistancePct,
    momentumPct,
    recentVolatilityPct,
    streakBeforeTrade: computeTradingStats(progress, tickers).currentStreak,
    distinctPositionsAfter: new Set([...progress.positions.map((p) => p.symbol), symbol]).size,
  };
}

/** Builds a SellTradeContext from state available right before calling executeTrade. */
export function buildSellTradeContext(progress: UserProgress, symbol: string, quantity: number, execPrice: number, now: number): SellTradeContext {
  const position = progress.positions.find((p) => p.symbol === symbol);
  const wasLoss = position ? execPrice < position.avgCost : false;

  const lastBuy = [...progress.tradeHistory]
    .filter((t) => t.symbol === symbol && t.side === "buy" && t.timestamp <= now)
    .sort((a, b) => b.timestamp - a.timestamp)[0];
  const holdingMinutes = lastBuy ? (now - lastBuy.timestamp) / 60_000 : null;

  const remainingQuantity = (position?.quantity ?? 0) - quantity;
  const otherPositions = progress.positions.filter((p) => p.symbol !== symbol).length;
  const distinctPositionsAfter = otherPositions + (remainingQuantity > 0 ? 1 : 0);

  return {
    holdingMinutes,
    wasLoss,
    streakBeforeTrade: computeTradingStats(progress, []).currentStreak,
    distinctPositionsAfter,
  };
}
