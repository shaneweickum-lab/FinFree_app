"use client";

import { useState } from "react";
import Link from "next/link";
import { useProgress } from "@/lib/progress-context";

function fmt(n: number): string {
  return new Intl.NumberFormat("en-US").format(Math.round(n));
}

export default function FinCoinBankPage() {
  const { progress, hydrated, depositToSavings, withdrawFromSavings } = useProgress();
  const [amount, setAmount] = useState("");
  const [transferError, setTransferError] = useState<string | null>(null);

  if (!hydrated) return null;

  function handleTransfer(direction: "deposit" | "withdraw") {
    const parsed = Number(amount);
    const result = direction === "deposit" ? depositToSavings(parsed) : withdrawFromSavings(parsed);
    setTransferError(result.success ? null : (result.message ?? null));
    if (result.success) setAmount("");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-royal-purple-dark">🏦 Fin Coin Bank</h1>
      <p className="mt-1 text-sm text-foreground/60">
        Manage your Fin Coin across accounts — everything here shows up on your{" "}
        <Link href="/trade-ledger" className="font-semibold text-royal-purple hover:underline">
          bank statements
        </Link>
        .
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border-2 border-money-green/30 bg-white p-4">
          <h2 className="font-bold text-money-green-dark">Checking Account</h2>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{fmt(progress.finCoinBalance)} 🪙</p>
          <p className="mt-1 text-xs text-foreground/50">Your everyday balance — used for lessons, quizzes, and trades.</p>
          {progress.finCoinLedger.length > 0 && (
            <div className="mt-3 space-y-1 text-xs text-foreground/60">
              {progress.finCoinLedger
                .slice(-4)
                .reverse()
                .map((e) => (
                  <div key={e.id} className="flex justify-between">
                    <span className="truncate pr-2">{e.reason}</span>
                    <span className={e.amount >= 0 ? "text-money-green-dark" : "text-red-600"}>
                      {e.amount >= 0 ? "+" : ""}
                      {fmt(e.amount)}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border-2 border-royal-purple/20 bg-white p-4">
          <h2 className="font-bold text-royal-purple-dark">Savings Account</h2>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{fmt(progress.savingsBalance)} 🪙</p>
          <p className="mt-1 text-xs text-foreground/50">Move Fin Coin here to set it aside.</p>

          <div className="mt-3 flex gap-2">
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
              className="w-full rounded-lg border border-black/10 px-2 py-1.5 text-sm"
            />
            <button
              onClick={() => handleTransfer("deposit")}
              className="shrink-0 rounded-full bg-royal-purple px-3 py-1.5 text-xs font-semibold text-white"
            >
              Deposit
            </button>
            <button
              onClick={() => handleTransfer("withdraw")}
              className="shrink-0 rounded-full border-2 border-royal-purple px-3 py-1.5 text-xs font-semibold text-royal-purple"
            >
              Withdraw
            </button>
          </div>
          {transferError && <p className="mt-2 text-xs font-medium text-red-600">{transferError}</p>}

          {progress.savingsLedger.length > 0 && (
            <div className="mt-3 space-y-1 text-xs text-foreground/60">
              {progress.savingsLedger
                .slice(-4)
                .reverse()
                .map((e) => (
                  <div key={e.id} className="flex justify-between">
                    <span className="truncate pr-2">{e.reason}</span>
                    <span className={e.amount >= 0 ? "text-money-green-dark" : "text-red-600"}>
                      {e.amount >= 0 ? "+" : ""}
                      {fmt(e.amount)}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border-2 border-dashed border-black/10 bg-white/60 p-4">
          <h2 className="font-bold text-foreground/70">💳 Credit Card</h2>
          <p className="mt-1 text-sm text-foreground/50">You don&apos;t have a credit card yet.</p>
          <button
            disabled
            className="mt-3 w-full cursor-not-allowed rounded-full border-2 border-black/10 px-4 py-2 text-sm font-semibold text-foreground/40"
          >
            Apply for a Credit Card (Coming Soon)
          </button>
        </div>

        <div className="rounded-2xl border-2 border-dashed border-black/10 bg-white/60 p-4">
          <h2 className="font-bold text-foreground/70">🏷️ Loans</h2>
          <p className="mt-1 text-sm text-foreground/50">No active loans.</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              disabled
              className="cursor-not-allowed rounded-full border-2 border-black/10 px-3 py-2 text-xs font-semibold text-foreground/40"
            >
              Get a Loan (Coming Soon)
            </button>
            <button
              disabled
              className="cursor-not-allowed rounded-full border-2 border-black/10 px-3 py-2 text-xs font-semibold text-foreground/40"
            >
              Pay Back a Loan (Coming Soon)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
