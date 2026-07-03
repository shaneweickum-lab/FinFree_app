export type Sector =
  | "Technology"
  | "Automotive"
  | "Food"
  | "Agriculture"
  | "Energy"
  | "Retail"
  | "Healthcare"
  | "Finance"
  | "Materials";

export interface TickerSeed {
  symbol: string;
  name: string;
  sector: Sector;
  startPrice: number;
}

export interface TickerState {
  symbol: string;
  name: string;
  sector: Sector;
  price: number;
  previousPrice: number;
  priceHistory: number[];
  dayHigh: number;
  dayLow: number;
}

export const TICKER_SEEDS: TickerSeed[] = [
  { symbol: "NMBS", name: "NimbusSoft Technologies", sector: "Technology", startPrice: 210 },
  { symbol: "CLDV", name: "CloudHarbor Devices", sector: "Technology", startPrice: 155 },
  { symbol: "VLTD", name: "VoltDrive Motors", sector: "Automotive", startPrice: 65 },
  { symbol: "IRAG", name: "Ironclad Auto Group", sector: "Automotive", startPrice: 38 },
  { symbol: "BRWG", name: "Brightwing Foods Co.", sector: "Food", startPrice: 42 },
  { symbol: "HTBL", name: "Harvest Table Kitchens", sector: "Food", startPrice: 22 },
  { symbol: "GFLD", name: "Golden Field Agritech", sector: "Agriculture", startPrice: 54 },
  { symbol: "RTSK", name: "Rootstock Farms Co-op", sector: "Agriculture", startPrice: 19 },
  { symbol: "NRGX", name: "Nova Renewable Grid", sector: "Energy", startPrice: 88 },
  { symbol: "SMOG", name: "Summit Oil & Gas", sector: "Energy", startPrice: 71 },
  { symbol: "TFAB", name: "ThreadFab Apparel", sector: "Retail", startPrice: 17 },
  { symbol: "MKTP", name: "MarketPlace Commerce", sector: "Retail", startPrice: 96 },
  { symbol: "VTCR", name: "VitalCore Health", sector: "Healthcare", startPrice: 130 },
  { symbol: "LDGR", name: "Ledger Point Bank", sector: "Finance", startPrice: 47 },
  { symbol: "BDRK", name: "Bedrock Materials Inc.", sector: "Materials", startPrice: 28 },
];

export function initializeMarket(): TickerState[] {
  return TICKER_SEEDS.map((seed) => ({
    symbol: seed.symbol,
    name: seed.name,
    sector: seed.sector,
    price: seed.startPrice,
    previousPrice: seed.startPrice,
    priceHistory: [seed.startPrice],
    dayHigh: seed.startPrice,
    dayLow: seed.startPrice,
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
    const nextPrice = Math.round(Math.max(1, ticker.price * (1 + drift)) * 100) / 100;
    return {
      ...ticker,
      previousPrice: ticker.price,
      price: nextPrice,
      priceHistory: [...ticker.priceHistory.slice(-29), nextPrice],
      dayHigh: Math.max(ticker.dayHigh, nextPrice),
      dayLow: Math.min(ticker.dayLow, nextPrice),
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
