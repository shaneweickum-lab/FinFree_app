export type PathwayId = "foundation" | "vocabulary" | "application";

export interface Pathway {
  id: PathwayId;
  order: number;
  title: string;
  subtitle: string;
  description: string;
  moduleIds: string[];
}

export type LessonType = "explanatory" | "interactive" | "quiz" | "minigame";

export interface Lesson {
  id: string;
  moduleId: string;
  order: number;
  title: string;
  type: LessonType;
  /** Concept tags this lesson teaches, used for adaptive remediation routing. */
  concepts: string[];
  /** Short body copy shown on the lesson screen (placeholder for full curriculum content). */
  summary: string;
  bulletPoints: string[];
  finCoinReward: number;
  quiz?: Quiz;
  miniGame?: MiniGame;
}

export interface QuizQuestion {
  id: string;
  concept: string;
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  passingScore: number; // fraction 0-1
  questions: QuizQuestion[];
}

export interface MiniGame {
  id: string;
  title: string;
  description: string;
  kind: "match" | "spot-the-error" | "build-from-scratch" | "scenario" | "flashcards" | "diagnose";
}

export interface Module {
  id: string;
  number: number;
  pathwayId: PathwayId;
  houseTitle: string;
  subtitle: string;
  purpose: string;
  whyItMatters: string;
  connectionToNext?: string;
  lessonIds: string[];
}

export interface Course {
  slug: string;
  title: string;
  tagline: string;
  pathwayIds: PathwayId[];
}

/** Aggregated per-concept quiz performance, used to drive remediation and simulation difficulty. */
export interface ConceptMastery {
  concept: string;
  correct: number;
  total: number;
}

export interface QuizAttemptRecord {
  quizId: string;
  lessonId: string;
  moduleId: string;
  score: number; // fraction 0-1
  passed: boolean;
  conceptResults: { concept: string; correct: boolean }[];
  timestamp: number;
}

export interface FinCoinLedgerEntry {
  id: string;
  amount: number;
  reason: string;
  lessonId?: string;
  moduleId?: string;
  timestamp: number;
}

export type TradeSide = "buy" | "sell";
export type OrderKind = "market" | "limit" | "stop-loss";

export interface Position {
  symbol: string;
  quantity: number;
  avgCost: number;
}

export interface TradeRecord {
  id: string;
  symbol: string;
  side: TradeSide;
  orderKind: OrderKind;
  quantity: number;
  price: number;
  timestamp: number;
  /** Only set for stop-loss buys; lets the AI Tutor's trade quality model score how well downside was protected. */
  stopPrice?: number;
  /** Fin Coin balance immediately after this trade — the ground truth the Trade Ledger grades
   * "resulting cash balance" entries against, since finCoinBalance also moves from unrelated
   * lesson/quiz rewards and can't be reconstructed after the fact. */
  balanceAfter: number;
  /** Sell trades only: (execution price - avg cost at the time of sale) * quantity. */
  realizedPnL?: number;
}

/** The four classifications a Trade Ledger entry can be filed under — a simplified mapping onto
 * the curriculum's own vocabulary: buying acquires an asset (Module 2), selling generates revenue
 * (Module 1's own definition of "money earned from sales"). */
export type LedgerCategory = "asset" | "revenue" | "expense" | "liability";

export const LEDGER_CATEGORY_LABELS: Record<LedgerCategory, string> = {
  asset: "Asset",
  revenue: "Revenue",
  expense: "Expense",
  liability: "Liability",
};

/** One manually-filled row of the Trade Ledger, logging a single trade after the fact. Grading is
 * per-field so a partially-correct entry still earns partial credit. */
export interface LedgerEntry {
  id: string;
  tradeId: string;
  loggedAt: number;
  enteredTotalAmount: number;
  enteredCashBalanceAfter: number;
  enteredCategory: LedgerCategory;
  totalAmountCorrect: boolean;
  cashBalanceCorrect: boolean;
  categoryCorrect: boolean;
  pointsAwarded: number;
}

/** A periodic (auto every 24h, or on-demand) summary of Trading Floor activity, modeled loosely on
 * a real brokerage/bank statement — itself a small financial-literacy lesson in what such a
 * statement actually reports. */
export interface BankStatement {
  id: string;
  periodStart: number;
  periodEnd: number;
  generatedAt: number;
  manual: boolean;
  openingFinCoinBalance: number;
  closingFinCoinBalance: number;
  tradesExecuted: number;
  buys: number;
  sells: number;
  realizedPnL: number;
  tradesLogged: number;
  tradesMissed: number;
  recordkeepingPointsDelta: number;
  recordkeepingScoreAfter: number;
}

export interface UserProgress {
  completedLessonIds: string[];
  completedModuleIds: string[];
  quizAttempts: QuizAttemptRecord[];
  finCoinBalance: number;
  finCoinLedger: FinCoinLedgerEntry[];
  tradingFloorUnlocked: boolean;
  tradingSessionsCompleted: number;
  positions: Position[];
  tradeHistory: TradeRecord[];
  /** High-water mark, kept even if portfolio value later drops, so trading-level achievements stay earned. */
  highestTradingLevel: number;
  /** Starts at 50 (not 0) so a slow start recording trades doesn't immediately read as a failing
   * score — see recordkeeping.ts for the full scoring rationale. */
  recordkeepingScore: number;
  /** High-water mark, kept even if a later missed-trade penalty drops the live score — so, like
   * highestTradingLevel, recordkeeping achievements stay earned once reached. */
  highestRecordkeepingScore: number;
  ledgerEntries: LedgerEntry[];
  bankStatements: BankStatement[];
  /** 0 until the Trade Ledger page has been visited once; see recordkeeping.ts's shouldAutoGenerateStatement. */
  lastStatementAt: number;
}

export type LiteracyLevel = "none" | "a-little" | "beginner" | "intermediate-refreshing" | "expert-refreshing";

export const LITERACY_LEVEL_LABELS: Record<LiteracyLevel, string> = {
  none: "None",
  "a-little": "A Little",
  beginner: "Beginner",
  "intermediate-refreshing": "Intermediate but Refreshing",
  "expert-refreshing": "Expert but Refreshing",
};

export interface PlacementQuizQuestion {
  id: string;
  prompt: string;
  choices: string[];
  correctIndex: number;
}

export interface PlacementQuizResult {
  score: number;
  totalCount: number;
  computedLevel: LiteracyLevel;
  completedAt: number;
}

export interface UserProfile {
  name: string;
  birthdate: string;
  bio: string;
  selfReportedLevel: LiteracyLevel | null;
  placementQuiz: PlacementQuizResult | null;
  onboardingBonusAwarded: boolean;
}

export interface Account {
  username: string;
  passwordHash: string;
  salt: string;
  createdAt: number;
}

export type MarketDifficulty = "calm" | "moderate" | "volatile" | "chaotic";

export interface AdaptiveDifficultyProfile {
  level: MarketDifficulty;
  volatility: number; // 0-1
  spreadTightness: number; // 0-1, higher = tighter spreads
  masteryScore: number; // 0-1 overall performance driving the level
}
