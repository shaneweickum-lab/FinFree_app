export interface TickerSeed {
  symbol: string;
  name: string;
  startPrice: number;
}

export interface TickerState {
  symbol: string;
  name: string;
  price: number;
  previousPrice: number;
  priceHistory: number[];
}

export const TICKER_SEEDS: TickerSeed[] = [
  { symbol: "BRWG", name: "Brightwing Foods Co.", startPrice: 42 },
  { symbol: "NRGX", name: "Nova Renewable Grid", startPrice: 88 },
  { symbol: "TFAB", name: "ThreadFab Apparel", startPrice: 17 },
  { symbol: "CLDV", name: "CloudHarbor Devices", startPrice: 155 },
];

export function initializeMarket(): TickerState[] {
  return TICKER_SEEDS.map((seed) => ({
    symbol: seed.symbol,
    name: seed.name,
    price: seed.startPrice,
    previousPrice: seed.startPrice,
    priceHistory: [seed.startPrice],
  }));
}

/**
 * Advances every ticker by one tick. `volatility` (0-1) widens the possible percentage swing;
 * `rand` is injected so callers can supply Math.random (kept out of this pure function for testability).
 */
export function advanceMarket(tickers: TickerState[], volatility: number, rand: () => number): TickerState[] {
  const maxSwingPct = 0.01 + volatility * 0.08; // 1% calm markets up to ~9% chaotic swings per tick
  return tickers.map((ticker) => {
    const drift = (rand() * 2 - 1) * maxSwingPct;
    const nextPrice = Math.max(1, ticker.price * (1 + drift));
    return {
      ...ticker,
      previousPrice: ticker.price,
      price: Math.round(nextPrice * 100) / 100,
      priceHistory: [...ticker.priceHistory.slice(-19), Math.round(nextPrice * 100) / 100],
    };
  });
}

/** Spread widens as spreadTightness decreases; tighter markets (higher value) quote closer to the mid price. */
export function getBidAsk(price: number, spreadTightness: number): { bid: number; ask: number } {
  const spreadPct = 0.02 - spreadTightness * 0.015; // ranges roughly 0.5%-2%
  const half = (price * spreadPct) / 2;
  return {
    bid: Math.round((price - half) * 100) / 100,
    ask: Math.round((price + half) * 100) / 100,
  };
}
