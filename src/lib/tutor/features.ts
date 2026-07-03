import { computeTradingStats } from "../analytics";
import type { LiteracyLevel, UserProfile, UserProgress } from "../types";
import type { NudgeLogEntry } from "./types";

export const CONTEXT_DIM = 9;

export const CONTEXT_FEATURE_NAMES = [
  "bias",
  "idleMinutes",
  "rollingQuizAccuracy",
  "sessionMinutes",
  "tradingStreak",
  "minutesSinceLastNudge",
  "recentDismissalRate",
  "onTradingFloor",
  "literacyLevel",
] as const;

const LITERACY_ORDINAL: Record<LiteracyLevel, number> = {
  none: 0,
  "a-little": 1,
  beginner: 2,
  "intermediate-refreshing": 3,
  "expert-refreshing": 4,
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Average score over the most recent `windowSize` quiz attempts — a *rolling* accuracy, not lifetime. */
export function computeRollingQuizAccuracy(progress: UserProgress, windowSize = 5): number {
  const recent = [...progress.quizAttempts].sort((a, b) => b.timestamp - a.timestamp).slice(0, windowSize);
  if (recent.length === 0) return 0.5; // neutral prior before any quiz data
  return recent.reduce((sum, a) => sum + a.score, 0) / recent.length;
}

/** Fraction of the last `windowSize` shown nudges the learner dismissed outright. */
export function computeRecentDismissalRate(nudgeLog: NudgeLogEntry[], windowSize = 5): number {
  const recent = [...nudgeLog].sort((a, b) => b.timestamp - a.timestamp).slice(0, windowSize);
  if (recent.length === 0) return 0;
  const dismissed = recent.filter((n) => n.outcome === "dismissed").length;
  return dismissed / recent.length;
}

export interface ContextInputs {
  progress: UserProgress;
  profile: UserProfile;
  nudgeLog: NudgeLogEntry[];
  idleMs: number;
  sessionStartAt: number;
  lastNudgeAt: number | null;
  onTradingFloor: boolean;
  tickers?: import("../market").TickerState[];
  now: number;
}

/**
 * Builds the LinUCB context vector. Every feature is normalized to a roughly [-1, 1] / [0, 1] band
 * so no single raw-scaled feature (e.g. session length in ms) dominates the ridge regression.
 */
export function buildContextVector(inputs: ContextInputs): number[] {
  const { progress, profile, nudgeLog, idleMs, sessionStartAt, lastNudgeAt, onTradingFloor, tickers, now } = inputs;

  const idleMinutes = clamp(idleMs / 60_000, 0, 30) / 30;
  const rollingAccuracy = computeRollingQuizAccuracy(progress);
  const sessionMinutes = clamp((now - sessionStartAt) / 60_000, 0, 60) / 60;
  const streak = computeTradingStats(progress, tickers ?? []).currentStreak;
  const tradingStreak = clamp(streak, -5, 5) / 5;
  const minutesSinceLastNudge = lastNudgeAt === null ? 1 : clamp((now - lastNudgeAt) / 60_000, 0, 60) / 60;
  const recentDismissalRate = computeRecentDismissalRate(nudgeLog);
  const literacyLevel = (profile.selfReportedLevel ? LITERACY_ORDINAL[profile.selfReportedLevel] : 2) / 4;

  return [
    1, // bias
    idleMinutes,
    rollingAccuracy,
    sessionMinutes,
    tradingStreak,
    minutesSinceLastNudge,
    recentDismissalRate,
    onTradingFloor ? 1 : 0,
    literacyLevel,
  ];
}
