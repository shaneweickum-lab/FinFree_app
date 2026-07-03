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

export interface UserProgress {
  completedLessonIds: string[];
  completedModuleIds: string[];
  quizAttempts: QuizAttemptRecord[];
  finCoinBalance: number;
  finCoinLedger: FinCoinLedgerEntry[];
  tradingFloorUnlocked: boolean;
  tradingSessionsCompleted: number;
}

export type MarketDifficulty = "calm" | "moderate" | "volatile" | "chaotic";

export interface AdaptiveDifficultyProfile {
  level: MarketDifficulty;
  volatility: number; // 0-1
  spreadTightness: number; // 0-1, higher = tighter spreads
  masteryScore: number; // 0-1 overall performance driving the level
}
