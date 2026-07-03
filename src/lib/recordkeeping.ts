import type { BankStatement, LedgerCategory, LedgerEntry, TradeRecord, TradeSide, UserProgress } from "./types";

/** Starting balance for the recordkeeping score. Not 0 — a slow start logging trades shouldn't
 * immediately read as a failing/negative score, since the whole point is to build a habit, not
 * punish beginners on day one. */
export const RECORDKEEPING_BASELINE = 50;

export const POINTS_TOTAL_AMOUNT = 2;
export const POINTS_CASH_BALANCE = 2;
export const POINTS_CATEGORY = 1;
export const MAX_POINTS_PER_ENTRY = POINTS_TOTAL_AMOUNT + POINTS_CASH_BALANCE + POINTS_CATEGORY;

/** Cost of leaving a trade unlogged by the time a bank statement closes out its period. */
export const MISSED_TRADE_PENALTY = 5;

export const STATEMENT_INTERVAL_MS = 24 * 60 * 60 * 1000;

/** A simplified mapping onto the curriculum's own vocabulary: buying acquires an asset (Module 2),
 * selling generates revenue — literally Module 1's own definition of "money earned from sales". */
export function expectedLedgerCategory(side: TradeSide): LedgerCategory {
  return side === "buy" ? "asset" : "revenue";
}

/** Matches the rounding executeTrade itself uses when moving Fin Coin, so a correctly-computed
 * entry always has an exact integer match to check against, not a floating-point one. */
export function expectedTotalAmount(trade: TradeRecord): number {
  return Math.round(trade.price * trade.quantity);
}

export interface LedgerEntryInput {
  totalAmount: number;
  cashBalanceAfter: number;
  category: LedgerCategory;
}

export type GradedLedgerEntry = Omit<LedgerEntry, "id" | "tradeId" | "loggedAt">;

/** Grades a manually-entered ledger row field-by-field, so a partially-correct entry still earns
 * partial credit rather than an all-or-nothing pass/fail. */
export function gradeLedgerEntry(trade: TradeRecord, entered: LedgerEntryInput): GradedLedgerEntry {
  const totalAmountCorrect = Math.round(entered.totalAmount) === expectedTotalAmount(trade);
  const cashBalanceCorrect = Math.round(entered.cashBalanceAfter) === trade.balanceAfter;
  const categoryCorrect = entered.category === expectedLedgerCategory(trade.side);

  const pointsAwarded =
    (totalAmountCorrect ? POINTS_TOTAL_AMOUNT : 0) +
    (cashBalanceCorrect ? POINTS_CASH_BALANCE : 0) +
    (categoryCorrect ? POINTS_CATEGORY : 0);

  return {
    enteredTotalAmount: entered.totalAmount,
    enteredCashBalanceAfter: entered.cashBalanceAfter,
    enteredCategory: entered.category,
    totalAmountCorrect,
    cashBalanceCorrect,
    categoryCorrect,
    pointsAwarded,
  };
}

/** `lastStatementAt === 0` means the clock hasn't been started yet (first ever visit to the Trade
 * Ledger) — that should just start the clock, not immediately generate a statement covering "since
 * the beginning of time" for an account that may have zero trades. */
export function shouldAutoGenerateStatement(lastStatementAt: number, now: number): boolean {
  return lastStatementAt !== 0 && now - lastStatementAt >= STATEMENT_INTERVAL_MS;
}

export type StatementDraft = Omit<BankStatement, "id" | "generatedAt" | "recordkeepingScoreAfter"> & {
  /** Points the missed-trade penalty costs this period — the caller applies this to the running
   * score (clamped) and stamps the result as recordkeepingScoreAfter; kept separate here since
   * this module has no notion of "the current score", only the period's own trade activity. */
  pointsLostThisPeriod: number;
};

/** Computes everything a bank statement reports for one period, purely from trade history, the
 * Fin Coin ledger, and which trades already have a matching ledger entry — no live market data
 * needed, since realized P&L is captured on the trade itself at the moment of sale. */
export function computeStatementForPeriod(progress: UserProgress, periodStart: number, periodEnd: number, manual: boolean): StatementDraft {
  const periodTrades = progress.tradeHistory.filter((t) => t.timestamp > periodStart && t.timestamp <= periodEnd);
  const periodLedgerDelta = progress.finCoinLedger
    .filter((e) => e.timestamp > periodStart && e.timestamp <= periodEnd)
    .reduce((sum, e) => sum + e.amount, 0);
  const periodSavingsEntries = progress.savingsLedger.filter((e) => e.timestamp > periodStart && e.timestamp <= periodEnd);
  const periodSavingsDelta = periodSavingsEntries.reduce((sum, e) => sum + e.amount, 0);

  const loggedTradeIds = new Set(progress.ledgerEntries.map((e) => e.tradeId));
  const tradesLogged = periodTrades.filter((t) => loggedTradeIds.has(t.id)).length;
  const tradesMissed = periodTrades.length - tradesLogged;

  const pointsEarnedThisPeriod = progress.ledgerEntries
    .filter((e) => periodTrades.some((t) => t.id === e.tradeId))
    .reduce((sum, e) => sum + e.pointsAwarded, 0);
  const pointsLostThisPeriod = tradesMissed * MISSED_TRADE_PENALTY;

  return {
    periodStart,
    periodEnd,
    manual,
    openingFinCoinBalance: progress.finCoinBalance - periodLedgerDelta,
    closingFinCoinBalance: progress.finCoinBalance,
    tradesExecuted: periodTrades.length,
    buys: periodTrades.filter((t) => t.side === "buy").length,
    sells: periodTrades.filter((t) => t.side === "sell").length,
    realizedPnL: periodTrades.reduce((sum, t) => sum + (t.realizedPnL ?? 0), 0),
    tradesLogged,
    tradesMissed,
    recordkeepingPointsDelta: pointsEarnedThisPeriod - pointsLostThisPeriod,
    pointsLostThisPeriod,
    openingSavingsBalance: progress.savingsBalance - periodSavingsDelta,
    closingSavingsBalance: progress.savingsBalance,
    savingsDeposits: periodSavingsEntries.filter((e) => e.amount > 0).reduce((sum, e) => sum + e.amount, 0),
    savingsWithdrawals: periodSavingsEntries.filter((e) => e.amount < 0).reduce((sum, e) => sum - e.amount, 0),
  };
}

/** Recordkeeping achievements unlock every 10 points above the baseline. */
export const RECORDKEEPING_ACHIEVEMENT_THRESHOLDS = [60, 70, 80, 90, 100];
