"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useProgress } from "@/lib/progress-context";
import { computeAdaptiveDifficulty } from "@/lib/adaptive";
import {
  advanceMarket,
  getBidAsk,
  initializeMarket,
  type OrderKind,
  type Position,
  type TickerState,
  type TradeRecord,
  type TradeSide,
} from "@/lib/market";
import { ProgressBar } from "@/components/progress-bar";

const TRADING_STORAGE_KEY = "finfree.tradingFloor.v1";

const DIFFICULTY_COPY: Record<string, { label: string; blurb: string }> = {
  calm: { label: "Calm", blurb: "Clear patterns, low volatility — a gentle place to start." },
  moderate: { label: "Moderate", blurb: "Prices move with some texture. Stay disciplined." },
  volatile: { label: "Volatile", blurb: "Swings are sharp. Position sizing matters a lot here." },
  chaotic: { label: "Chaotic", blurb: "Tight spreads, wild moves — this is the deep end." },
};

let tradeIdCounter = 0;
function nextTradeId() {
  tradeIdCounter += 1;
  return `trade-${tradeIdCounter}-${Math.floor(performance.now())}`;
}

export default function TradingFloorPage() {
  const { progress, hydrated, adjustFinCoin, recordTradingSession } = useProgress();

  const [tickers, setTickers] = useState<TickerState[]>(() => initializeMarket());
  const [positions, setPositions] = useState<Position[]>([]);
  const [history, setHistory] = useState<TradeRecord[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState(tickers[0]?.symbol ?? "");
  const [orderKind, setOrderKind] = useState<OrderKind>("market");
  const [quantity, setQuantity] = useState(1);
  const [loadedLocal, setLoadedLocal] = useState(false);

  const difficulty = computeAdaptiveDifficulty(progress);

  useEffect(() => {
    // One-time load on mount, mirroring the same hydration pattern as ProgressProvider.
    try {
      const raw = window.localStorage.getItem(TRADING_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (parsed.positions) setPositions(parsed.positions);
        if (parsed.history) setHistory(parsed.history);
      }
    } catch {
      // ignore corrupted local trading state
    } finally {
      setLoadedLocal(true);
    }
  }, []);

  useEffect(() => {
    if (!loadedLocal) return;
    window.localStorage.setItem(TRADING_STORAGE_KEY, JSON.stringify({ positions, history }));
  }, [positions, history, loadedLocal]);

  if (!hydrated) return null;

  if (!progress.tradingFloorUnlocked) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-4xl">🏛️🔒</p>
        <h1 className="mt-4 text-xl font-bold text-royal-purple-dark">The Trading Floor is still under construction</h1>
        <p className="mt-2 text-foreground/60">
          Complete all seven modules of Building Your Financial House to unlock the capstone simulation.
        </p>
        <Link href="/" className="mt-6 inline-block rounded-full bg-royal-purple px-5 py-2 text-sm font-semibold text-white">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const selectedTicker = tickers.find((t) => t.symbol === selectedSymbol) ?? tickers[0];
  const { bid, ask } = getBidAsk(selectedTicker.price, difficulty.spreadTightness);
  const position = positions.find((p) => p.symbol === selectedTicker.symbol);

  function handleAdvanceMarket() {
    setTickers((prev) => advanceMarket(prev, difficulty.volatility, Math.random));
  }

  function handleTrade(side: TradeSide) {
    const execPrice = side === "buy" ? ask : bid;
    const cost = execPrice * quantity;

    if (side === "buy") {
      if (progress.finCoinBalance < cost) return;
      adjustFinCoin(-Math.round(cost), `Bought ${quantity} ${selectedTicker.symbol}`);
      setPositions((prev) => {
        const existing = prev.find((p) => p.symbol === selectedTicker.symbol);
        if (!existing) {
          return [...prev, { symbol: selectedTicker.symbol, quantity, avgCost: execPrice }];
        }
        const totalQty = existing.quantity + quantity;
        const avgCost = (existing.avgCost * existing.quantity + cost) / totalQty;
        return prev.map((p) => (p.symbol === selectedTicker.symbol ? { ...p, quantity: totalQty, avgCost } : p));
      });
    } else {
      if (!position || position.quantity < quantity) return;
      adjustFinCoin(Math.round(cost), `Sold ${quantity} ${selectedTicker.symbol}`);
      setPositions((prev) =>
        prev
          .map((p) => (p.symbol === selectedTicker.symbol ? { ...p, quantity: p.quantity - quantity } : p))
          .filter((p) => p.quantity > 0),
      );
    }

    setHistory((prev) => [
      {
        id: nextTradeId(),
        symbol: selectedTicker.symbol,
        side,
        orderKind,
        quantity,
        price: execPrice,
        timestamp: Date.now(),
      },
      ...prev,
    ]);
  }

  const difficultyCopy = DIFFICULTY_COPY[difficulty.level];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-royal-purple-dark">🏛️ The Trading Floor Simulation</h1>
          <p className="text-sm text-foreground/60">Practice with Fin Coin — zero real-world risk.</p>
        </div>
        <button
          onClick={() => recordTradingSession()}
          className="rounded-full border-2 border-royal-purple px-4 py-2 text-xs font-semibold text-royal-purple"
        >
          End Session ({progress.tradingSessionsCompleted} completed)
        </button>
      </div>

      <div className="mt-4 rounded-2xl bg-royal-purple/5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-semibold text-royal-purple-dark">
            Market Mode: {difficultyCopy.label}
          </span>
          <span className="text-xs text-foreground/60">
            Mastery score: {Math.round(difficulty.masteryScore * 100)}%
          </span>
        </div>
        <p className="mt-1 text-xs text-foreground/60">{difficultyCopy.blurb}</p>
        <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="mb-1 flex justify-between text-foreground/50">
              <span>Volatility</span>
              <span>{Math.round(difficulty.volatility * 100)}%</span>
            </div>
            <ProgressBar fraction={difficulty.volatility} colorClass="bg-rich-gold" />
          </div>
          <div>
            <div className="mb-1 flex justify-between text-foreground/50">
              <span>Spread Tightness</span>
              <span>{Math.round(difficulty.spreadTightness * 100)}%</span>
            </div>
            <ProgressBar fraction={difficulty.spreadTightness} colorClass="bg-money-green" />
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-royal-purple-dark">Ticker Tape</h2>
            <button
              onClick={handleAdvanceMarket}
              className="rounded-full bg-royal-purple px-4 py-1.5 text-xs font-semibold text-white"
            >
              ▶ Advance Market
            </button>
          </div>
          <div className="space-y-2">
            {tickers.map((ticker) => {
              const change = ticker.price - ticker.previousPrice;
              const up = change >= 0;
              return (
                <button
                  key={ticker.symbol}
                  onClick={() => setSelectedSymbol(ticker.symbol)}
                  className={`flex w-full items-center justify-between rounded-xl border-2 bg-white px-4 py-3 text-left text-sm transition ${
                    ticker.symbol === selectedTicker.symbol ? "border-royal-purple" : "border-transparent hover:border-royal-purple/30"
                  }`}
                >
                  <div>
                    <span className="font-bold text-royal-purple-dark">{ticker.symbol}</span>
                    <span className="ml-2 text-foreground/50">{ticker.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${ticker.price.toFixed(2)}</div>
                    <div className={up ? "text-money-green-dark" : "text-red-600"}>
                      {up ? "▲" : "▼"} {Math.abs(change).toFixed(2)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-6">
            <h2 className="mb-2 font-bold text-royal-purple-dark">Trade History</h2>
            {history.length === 0 ? (
              <p className="text-sm text-foreground/50">No trades yet — your journal starts here.</p>
            ) : (
              <div className="space-y-1.5 text-sm">
                {history.slice(0, 10).map((trade) => (
                  <div key={trade.id} className="flex justify-between rounded-lg bg-white px-3 py-2 shadow-sm">
                    <span>
                      {trade.side === "buy" ? "🟢 Bought" : "🔴 Sold"} {trade.quantity} {trade.symbol}
                    </span>
                    <span className="text-foreground/60">@ ${trade.price.toFixed(2)} ({trade.orderKind})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border-2 border-royal-purple/15 bg-white p-4">
            <h2 className="font-bold text-royal-purple-dark">{selectedTicker.symbol} Order Ticket</h2>
            <div className="mt-2 flex justify-between text-sm">
              <span className="text-foreground/60">Bid</span>
              <span className="font-semibold">${bid.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-foreground/60">Ask</span>
              <span className="font-semibold">${ask.toFixed(2)}</span>
            </div>

            <label className="mt-3 block text-xs font-semibold text-foreground/60">Order Type</label>
            <select
              value={orderKind}
              onChange={(e) => setOrderKind(e.target.value as OrderKind)}
              className="mt-1 w-full rounded-lg border border-black/10 px-2 py-1.5 text-sm"
            >
              <option value="market">Market</option>
              <option value="limit">Limit</option>
              <option value="stop-loss">Stop-Loss</option>
            </select>

            <label className="mt-3 block text-xs font-semibold text-foreground/60">Quantity</label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
              className="mt-1 w-full rounded-lg border border-black/10 px-2 py-1.5 text-sm"
            />

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => handleTrade("buy")}
                disabled={progress.finCoinBalance < ask * quantity}
                className="rounded-full bg-money-green px-3 py-2 text-sm font-bold text-white disabled:opacity-40"
              >
                Buy
              </button>
              <button
                onClick={() => handleTrade("sell")}
                disabled={!position || position.quantity < quantity}
                className="rounded-full bg-rich-gold px-3 py-2 text-sm font-bold text-white disabled:opacity-40"
              >
                Sell
              </button>
            </div>
            <p className="mt-2 text-center text-xs text-foreground/50">Balance: {progress.finCoinBalance} 🪙</p>
          </div>

          <div className="rounded-2xl border-2 border-royal-purple/15 bg-white p-4">
            <h2 className="font-bold text-royal-purple-dark">Positions</h2>
            {positions.length === 0 ? (
              <p className="mt-2 text-sm text-foreground/50">No open positions.</p>
            ) : (
              <div className="mt-2 space-y-2 text-sm">
                {positions.map((p) => (
                  <div key={p.symbol} className="flex justify-between">
                    <span className="font-semibold">{p.symbol}</span>
                    <span className="text-foreground/60">
                      {p.quantity} @ avg ${p.avgCost.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
