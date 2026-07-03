"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useProgress } from "@/lib/progress-context";
import {
  MAX_POINTS_PER_ENTRY,
  MISSED_TRADE_PENALTY,
  RECORDKEEPING_ACHIEVEMENT_THRESHOLDS,
  STATEMENT_INTERVAL_MS,
  expectedLedgerCategory,
  expectedTotalAmount,
  shouldAutoGenerateStatement,
} from "@/lib/recordkeeping";
import { LEDGER_CATEGORY_LABELS, type LedgerCategory, type TradeRecord } from "@/lib/types";

const CATEGORY_OPTIONS: LedgerCategory[] = ["asset", "revenue", "expense", "liability"];

function fmt(n: number): string {
  return new Intl.NumberFormat("en-US").format(Math.round(n));
}

function fmtDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

interface DraftRow {
  totalAmount: string;
  cashBalanceAfter: string;
  category: LedgerCategory;
}

export default function TradeLedgerPage() {
  const { progress, hydrated, logLedgerEntry, generateBankStatement } = useProgress();
  const [drafts, setDrafts] = useState<Record<string, DraftRow>>({});
  const [now] = useState(() => Date.now());

  useEffect(() => {
    if (!hydrated) return;
    if (shouldAutoGenerateStatement(progress.lastStatementAt, Date.now())) {
      generateBankStatement(false);
    }
    // No background jobs in this app — "every 24h" means "checked the next time this page loads",
    // not a live countdown that fires mid-session.
  }, [hydrated, progress.lastStatementAt, generateBankStatement]);

  if (!hydrated) return null;

  const entryByTradeId = new Map(progress.ledgerEntries.map((e) => [e.tradeId, e]));
  const latestStatementPeriodEnd = progress.bankStatements[0]?.periodEnd ?? -Infinity;

  function draftFor(tradeId: string): DraftRow {
    return drafts[tradeId] ?? { totalAmount: "", cashBalanceAfter: "", category: "asset" };
  }

  function updateDraft(tradeId: string, patch: Partial<DraftRow>) {
    setDrafts((prev) => ({ ...prev, [tradeId]: { ...draftFor(tradeId), ...patch } }));
  }

  function submitEntry(trade: TradeRecord) {
    const draft = draftFor(trade.id);
    if (draft.totalAmount === "" || draft.cashBalanceAfter === "") return;
    logLedgerEntry(trade.id, {
      totalAmount: Number(draft.totalAmount),
      cashBalanceAfter: Number(draft.cashBalanceAfter),
      category: draft.category,
    });
  }

  const nextThreshold = RECORDKEEPING_ACHIEVEMENT_THRESHOLDS.find((t) => t > progress.recordkeepingScore);
  const msUntilNextStatement = progress.lastStatementAt
    ? Math.max(0, progress.lastStatementAt + STATEMENT_INTERVAL_MS - now)
    : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link href="/trading-floor" className="text-sm font-medium text-royal-purple hover:underline">
        ← Trading Floor
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-royal-purple-dark">📒 Trade Ledger</h1>
      <p className="mt-1 text-sm text-foreground/60">
        Every buy and sell from the Trading Floor shows up below. Log each one yourself — the total amount, your resulting Fin
        Coin balance, and how it classifies — to build your Recordkeeping Score and keep the concepts from every module fresh.
      </p>

      <div className="mt-4 rounded-2xl bg-royal-purple/5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-bold text-royal-purple-dark">Recordkeeping Score: {progress.recordkeepingScore}</span>
          <span className="text-xs text-foreground/60">
            +{MAX_POINTS_PER_ENTRY} max per correct entry · −{MISSED_TRADE_PENALTY} for a trade left unlogged
          </span>
        </div>
        <p className="mt-1 text-xs text-foreground/60">
          {nextThreshold ? `Next achievement unlocks at ${nextThreshold}.` : "You've reached the top recordkeeping tier."}
        </p>
      </div>

      <div className="mt-6">
        <h2 className="mb-2 font-bold text-royal-purple-dark">Your Trades</h2>
        {progress.tradeHistory.length === 0 ? (
          <p className="text-sm text-foreground/50">Make a trade on the Trading Floor, then come log it here.</p>
        ) : (
          <div className="space-y-3">
            {progress.tradeHistory.map((trade) => {
              const entry = entryByTradeId.get(trade.id);
              const missed = !entry && trade.timestamp <= latestStatementPeriodEnd;
              const draft = draftFor(trade.id);

              return (
                <div
                  key={trade.id}
                  className={`rounded-2xl border-2 bg-white p-4 text-sm ${
                    entry
                      ? "border-money-green/30"
                      : missed
                        ? "border-red-300 bg-red-50/50"
                        : "border-royal-purple/15"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-royal-purple-dark">
                      {trade.side === "buy" ? "🟢 Bought" : "🔴 Sold"} {trade.quantity} {trade.symbol} @ ${trade.price.toFixed(2)}
                    </span>
                    <span className="text-xs text-foreground/50">{new Date(trade.timestamp).toLocaleString()}</span>
                  </div>

                  {entry ? (
                    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <FieldResult
                        label="Total Amount"
                        correct={entry.totalAmountCorrect}
                        entered={fmt(entry.enteredTotalAmount)}
                        expected={fmt(expectedTotalAmount(trade))}
                      />
                      <FieldResult
                        label="Cash Balance After"
                        correct={entry.cashBalanceCorrect}
                        entered={fmt(entry.enteredCashBalanceAfter)}
                        expected={fmt(trade.balanceAfter)}
                      />
                      <FieldResult
                        label="Category"
                        correct={entry.categoryCorrect}
                        entered={LEDGER_CATEGORY_LABELS[entry.enteredCategory]}
                        expected={LEDGER_CATEGORY_LABELS[expectedLedgerCategory(trade.side)]}
                      />
                      <p className="col-span-full text-xs font-semibold text-money-green-dark">
                        +{entry.pointsAwarded} recordkeeping {entry.pointsAwarded === 1 ? "point" : "points"}
                      </p>
                    </div>
                  ) : missed ? (
                    <p className="mt-2 text-xs font-semibold text-red-600">
                      Missed — this trade&apos;s statement period already closed without it being logged (−{MISSED_TRADE_PENALTY} points).
                    </p>
                  ) : (
                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <label className="text-xs">
                        <span className="mb-1 block font-semibold text-foreground/60">Total Amount (🪙)</span>
                        <input
                          type="number"
                          value={draft.totalAmount}
                          onChange={(e) => updateDraft(trade.id, { totalAmount: e.target.value })}
                          className="w-full rounded-lg border border-black/10 px-2 py-1.5"
                        />
                      </label>
                      <label className="text-xs">
                        <span className="mb-1 block font-semibold text-foreground/60">Cash Balance After (🪙)</span>
                        <input
                          type="number"
                          value={draft.cashBalanceAfter}
                          onChange={(e) => updateDraft(trade.id, { cashBalanceAfter: e.target.value })}
                          className="w-full rounded-lg border border-black/10 px-2 py-1.5"
                        />
                      </label>
                      <label className="text-xs">
                        <span className="mb-1 block font-semibold text-foreground/60">Category</span>
                        <select
                          value={draft.category}
                          onChange={(e) => updateDraft(trade.id, { category: e.target.value as LedgerCategory })}
                          className="w-full rounded-lg border border-black/10 px-2 py-1.5"
                        >
                          {CATEGORY_OPTIONS.map((c) => (
                            <option key={c} value={c}>
                              {LEDGER_CATEGORY_LABELS[c]}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        onClick={() => submitEntry(trade)}
                        disabled={draft.totalAmount === "" || draft.cashBalanceAfter === ""}
                        className="col-span-full mt-1 rounded-full bg-royal-purple px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                      >
                        Log This Trade
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-bold text-royal-purple-dark">Bank Statements</h2>
          <button
            onClick={() => generateBankStatement(true)}
            disabled={!progress.lastStatementAt}
            className="rounded-full bg-money-green px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
          >
            Generate Statement Now
          </button>
        </div>
        <p className="mt-1 text-xs text-foreground/50">
          {msUntilNextStatement !== null
            ? `Next automatic statement in about ${fmtDuration(msUntilNextStatement)}, or generate one now.`
            : "Statements start once you've made your first trade or Fin Coin Bank transaction."}
        </p>

        {progress.bankStatements.length === 0 ? (
          <p className="mt-3 text-sm text-foreground/50">No statements yet.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {progress.bankStatements.map((s) => (
              <div key={s.id} className="rounded-2xl border-2 border-royal-purple/15 bg-white p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-royal-purple-dark">
                    {new Date(s.periodStart).toLocaleDateString()} – {new Date(s.periodEnd).toLocaleDateString()}
                  </span>
                  <span className="text-xs text-foreground/50">{s.manual ? "Generated on demand" : "Auto-generated"}</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-3">
                  <span>Opening balance: {fmt(s.openingFinCoinBalance)} 🪙</span>
                  <span>Closing balance: {fmt(s.closingFinCoinBalance)} 🪙</span>
                  <span>Trades: {s.tradesExecuted} ({s.buys} buys, {s.sells} sells)</span>
                  <span>Realized P&L: {s.realizedPnL >= 0 ? "+" : ""}{fmt(s.realizedPnL)} 🪙</span>
                  <span>Logged: {s.tradesLogged} · Missed: {s.tradesMissed}</span>
                  <span>
                    Recordkeeping: {s.recordkeepingPointsDelta >= 0 ? "+" : ""}
                    {s.recordkeepingPointsDelta} (now {s.recordkeepingScoreAfter})
                  </span>
                  {(s.savingsDeposits > 0 || s.savingsWithdrawals > 0) && (
                    <span className="col-span-full">
                      Savings: {fmt(s.openingSavingsBalance)} → {fmt(s.closingSavingsBalance)} 🪙 (+{fmt(s.savingsDeposits)}{" "}
                      deposited, −{fmt(s.savingsWithdrawals)} withdrawn)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FieldResult({ label, correct, entered, expected }: { label: string; correct: boolean; entered: string; expected: string }) {
  return (
    <div className="text-xs">
      <span className="block font-semibold text-foreground/60">{label}</span>
      <span className={correct ? "text-money-green-dark" : "text-red-600"}>
        {correct ? "✅" : "❌"} {entered}
      </span>
      {!correct && <span className="block text-foreground/50">Correct: {expected}</span>}
    </div>
  );
}
