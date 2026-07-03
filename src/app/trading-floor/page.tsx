"use client";

import { useEffect, useState } from "react";
import { useProgress } from "@/lib/progress-context";
import { useTutor } from "@/lib/tutor-context";
import { computeAdaptiveDifficulty } from "@/lib/adaptive";
import { advanceMarket, getBidAsk, initializeMarket, type TickerState } from "@/lib/market";
import { computePortfolioValue, computeTradingLevel, formatCompactCoins, MAX_TRADING_LEVEL } from "@/lib/trading-levels";
import { buildBuyTradeContext, buildSellTradeContext } from "@/lib/tutor/trade-quality";
import type { OrderKind, TradeSide } from "@/lib/types";
import { ProgressBar } from "@/components/progress-bar";
import { TickerSparkline } from "@/components/ticker-sparkline";
import { TickerDetailChart } from "@/components/ticker-detail-chart";

const DIFFICULTY_COPY: Record<string, { label: string; blurb: string }> = {
  calm: { label: "Calm", blurb: "Clear patterns, low volatility — a gentle place to start." },
  moderate: { label: "Moderate", blurb: "Prices move with some texture. Stay disciplined." },
  volatile: { label: "Volatile", blurb: "Swings are sharp. Position sizing matters a lot here." },
  chaotic: { label: "Chaotic", blurb: "Tight spreads, wild moves — this is the deep end." },
};

const AUTO_TICK_INTERVAL_MS = 5 * 60 * 1000;

export default function TradingFloorPage() {
  const { progress, hydrated, recordTradingSession, executeTrade } = useProgress();
  const { recordBuyTradeForCritique, recordSellTradeForCritique } = useTutor();

  const [tickers, setTickers] = useState<TickerState[]>(() => initializeMarket());
  const [selectedSymbol, setSelectedSymbol] = useState(tickers[0]?.symbol ?? "");
  const [orderKind, setOrderKind] = useState<OrderKind>("market");
  const [quantity, setQuantity] = useState(1);
  const [stopPrice, setStopPrice] = useState("");
  const [tradeError, setTradeError] = useState<string | null>(null);

  const difficulty = computeAdaptiveDifficulty(progress);

  // Simulates a real market ticking on its own — prices move every 5 minutes without user action.
  useEffect(() => {
    const interval = setInterval(() => {
      setTickers((prev) => advanceMarket(prev, difficulty.volatility, Math.random));
    }, AUTO_TICK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [difficulty.volatility]);

  if (!hydrated) return null;

  const selectedTicker = tickers.find((t) => t.symbol === selectedSymbol) ?? tickers[0];
  const { bid, ask } = getBidAsk(selectedTicker.price, difficulty.spreadTightness);
  const position = progress.positions.find((p) => p.symbol === selectedTicker.symbol);

  const portfolioValue = computePortfolioValue(progress.finCoinBalance, progress.positions, tickers);
  const levelInfo = computeTradingLevel(portfolioValue);

  function handleAdvanceMarket() {
    setTickers((prev) => advanceMarket(prev, difficulty.volatility, Math.random));
  }

  function handleTrade(side: TradeSide) {
    const execPrice = side === "buy" ? ask : bid;
    const parsedStopPrice = orderKind === "stop-loss" && stopPrice ? Number(stopPrice) : undefined;

    if (side === "buy") {
      const buyContext = buildBuyTradeContext(progress, tickers, selectedTicker.symbol, quantity, execPrice, orderKind, parsedStopPrice);
      const result = executeTrade(tickers, selectedTicker.symbol, side, orderKind, quantity, execPrice, parsedStopPrice);
      setTradeError(result.success ? null : (result.message ?? null));
      if (result.success && result.trade) recordBuyTradeForCritique(result.trade, buyContext);
    } else {
      const result = executeTrade(tickers, selectedTicker.symbol, side, orderKind, quantity, execPrice);
      setTradeError(result.success ? null : (result.message ?? null));
      if (result.success && result.trade) {
        const sellContext = buildSellTradeContext(progress, selectedTicker.symbol, quantity, execPrice, result.trade.timestamp);
        recordSellTradeForCritique(result.trade, sellContext);
      }
    }
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

      <div className="mt-4 rounded-2xl bg-gradient-to-br from-rich-gold/20 to-rich-gold/5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-bold text-rich-gold-dark">
            Trading Level {levelInfo.level}
            {levelInfo.isMaxLevel ? " (Max)" : ` of ${MAX_TRADING_LEVEL}`}
          </span>
          <span className="text-xs text-foreground/60">
            Portfolio: {formatCompactCoins(levelInfo.portfolioValue)} 🪙
          </span>
        </div>
        <div className="mt-2">
          <ProgressBar fraction={levelInfo.progressFraction} colorClass="bg-rich-gold" />
        </div>
        <p className="mt-1 text-xs text-foreground/60">
          {levelInfo.isMaxLevel
            ? "You've reached the top trading level."
            : `${formatCompactCoins(levelInfo.goal - levelInfo.portfolioValue)} 🪙 to Level ${levelInfo.level + 1} (goal: ${formatCompactCoins(levelInfo.goal)})`}
        </p>
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
            <div>
              <h2 className="font-bold text-royal-purple-dark">Ticker Tape</h2>
              <p className="text-xs text-foreground/50">Prices tick automatically every 5 minutes.</p>
            </div>
            <button
              onClick={handleAdvanceMarket}
              className="rounded-full bg-royal-purple px-4 py-1.5 text-xs font-semibold text-white"
            >
              ▶ Advance Now
            </button>
          </div>
          <div className="max-h-[30rem] space-y-2 overflow-y-auto pr-1">
            {tickers.map((ticker) => {
              const change = ticker.price - ticker.previousPrice;
              const up = change >= 0;
              return (
                <button
                  key={ticker.symbol}
                  onClick={() => setSelectedSymbol(ticker.symbol)}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl border-2 bg-white px-4 py-3 text-left text-sm transition ${
                    ticker.symbol === selectedTicker.symbol ? "border-royal-purple" : "border-transparent hover:border-royal-purple/30"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-royal-purple-dark">{ticker.symbol}</span>
                      <span className="rounded-full bg-royal-purple/10 px-2 py-0.5 text-[10px] font-semibold text-royal-purple">
                        {ticker.sector}
                      </span>
                    </div>
                    <span className="truncate text-foreground/50">{ticker.name}</span>
                  </div>
                  <div className={up ? "text-money-green-dark" : "text-red-600"}>
                    <TickerSparkline values={ticker.priceHistory} />
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-semibold text-foreground">${ticker.price.toFixed(2)}</div>
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
            {progress.tradeHistory.length === 0 ? (
              <p className="text-sm text-foreground/50">No trades yet — your journal starts here.</p>
            ) : (
              <div className="space-y-1.5 text-sm">
                {progress.tradeHistory.slice(0, 10).map((trade) => (
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
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-royal-purple-dark">{selectedTicker.symbol}</h2>
              <span className="text-xs font-semibold text-foreground/50">{selectedTicker.sector}</span>
            </div>
            <p className="text-xs text-foreground/50">{selectedTicker.name}</p>

            <div className="mt-2 text-royal-purple-dark">
              <TickerDetailChart values={selectedTicker.priceHistory} dayHigh={selectedTicker.dayHigh} dayLow={selectedTicker.dayLow} />
            </div>

            <div className="mt-2 grid grid-cols-2 gap-x-4 text-sm">
              <div className="flex justify-between">
                <span className="text-foreground/60">Bid</span>
                <span className="font-semibold">${bid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground/60">Ask</span>
                <span className="font-semibold">${ask.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground/60">Day High</span>
                <span className="font-semibold text-money-green-dark">${selectedTicker.dayHigh.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground/60">Day Low</span>
                <span className="font-semibold text-red-600">${selectedTicker.dayLow.toFixed(2)}</span>
              </div>
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

            {orderKind === "stop-loss" && (
              <>
                <label className="mt-3 block text-xs font-semibold text-foreground/60">
                  Stop Price (buy orders only)
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={stopPrice}
                  onChange={(e) => setStopPrice(e.target.value)}
                  placeholder={`e.g. ${(ask * 0.95).toFixed(2)}`}
                  className="mt-1 w-full rounded-lg border border-black/10 px-2 py-1.5 text-sm"
                />
              </>
            )}

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
            {tradeError && <p className="mt-2 text-center text-xs font-medium text-red-600">{tradeError}</p>}
            <p className="mt-2 text-center text-xs text-foreground/50">Balance: {progress.finCoinBalance} 🪙</p>
          </div>

          <div className="rounded-2xl border-2 border-royal-purple/15 bg-white p-4">
            <h2 className="font-bold text-royal-purple-dark">Positions</h2>
            {progress.positions.length === 0 ? (
              <p className="mt-2 text-sm text-foreground/50">No open positions.</p>
            ) : (
              <div className="mt-2 space-y-2 text-sm">
                {progress.positions.map((p) => (
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
