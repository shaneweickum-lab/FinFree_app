import type { UserProfile, UserProgress } from "./types";

export interface AchievementContext {
  progress: UserProgress;
  profile: UserProfile;
}

export type AchievementCategory = "onboarding" | "learning" | "coins" | "trading" | "recordkeeping";

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  isUnlocked: (ctx: AchievementContext) => boolean;
}

export interface Achievement extends Omit<AchievementDef, "isUnlocked"> {
  unlocked: boolean;
}

export function totalFinCoinEarned(progress: UserProgress): number {
  return progress.finCoinLedger.filter((entry) => entry.amount > 0).reduce((sum, entry) => sum + entry.amount, 0);
}

const ACHIEVEMENT_DEFS: AchievementDef[] = [
  {
    id: "welcome",
    title: "Welcome to FinFree",
    description: "Create your account.",
    icon: "🏠",
    category: "onboarding",
    isUnlocked: () => true,
  },
  {
    id: "know-thyself",
    title: "Know Thyself",
    description: "Complete your profile and the placement quiz.",
    icon: "🧭",
    category: "onboarding",
    isUnlocked: ({ profile }) => Boolean(profile.name.trim() && profile.birthdate && profile.selfReportedLevel && profile.placementQuiz),
  },
  {
    id: "first-lesson",
    title: "First Steps",
    description: "Complete your first lesson.",
    icon: "📖",
    category: "learning",
    isUnlocked: ({ progress }) => progress.completedLessonIds.length >= 1,
  },
  {
    id: "foundation-laid",
    title: "Foundation Laid",
    description: "Complete Module 1: The Foundation.",
    icon: "🧱",
    category: "learning",
    isUnlocked: ({ progress }) => progress.completedModuleIds.includes("m1"),
  },
  {
    id: "blueprint-master",
    title: "Blueprint Master",
    description: "Complete the entire Foundation Course (Modules 1–4).",
    icon: "📐",
    category: "learning",
    isUnlocked: ({ progress }) => ["m1", "m2", "m3", "m4"].every((id) => progress.completedModuleIds.includes(id)),
  },
  {
    id: "fluent-speaker",
    title: "Fluent Speaker",
    description: "Complete the entire Vocabulary Course (Modules 5–6).",
    icon: "🗣️",
    category: "learning",
    isUnlocked: ({ progress }) => ["m5", "m6"].every((id) => progress.completedModuleIds.includes(id)),
  },
  {
    id: "house-complete",
    title: "House Complete",
    description: "Complete all seven modules of Building Your Financial House.",
    icon: "🏡",
    category: "learning",
    isUnlocked: ({ progress }) => progress.completedModuleIds.length >= 7,
  },
  {
    id: "perfect-score",
    title: "Perfect Score",
    description: "Score 100% on any quiz.",
    icon: "💯",
    category: "learning",
    isUnlocked: ({ progress }) => progress.quizAttempts.some((a) => a.score >= 1),
  },
  {
    id: "coin-collector",
    title: "Coin Collector",
    description: "Earn 1,000 total Fin Coin.",
    icon: "🪙",
    category: "coins",
    isUnlocked: ({ progress }) => totalFinCoinEarned(progress) >= 1_000,
  },
  {
    id: "coin-hoarder",
    title: "Coin Hoarder",
    description: "Earn 10,000 total Fin Coin.",
    icon: "💰",
    category: "coins",
    isUnlocked: ({ progress }) => totalFinCoinEarned(progress) >= 10_000,
  },
  {
    id: "coin-tycoon",
    title: "Coin Tycoon",
    description: "Earn 50,000 total Fin Coin.",
    icon: "👑",
    category: "coins",
    isUnlocked: ({ progress }) => totalFinCoinEarned(progress) >= 50_000,
  },
  {
    id: "first-trade",
    title: "First Trade",
    description: "Execute your first trade on the Trading Floor.",
    icon: "📈",
    category: "trading",
    isUnlocked: ({ progress }) => progress.tradeHistory.length >= 1,
  },
  {
    id: "ten-trades",
    title: "Active Trader",
    description: "Execute 10 trades on the Trading Floor.",
    icon: "📊",
    category: "trading",
    isUnlocked: ({ progress }) => progress.tradeHistory.length >= 10,
  },
  {
    id: "trading-level-5",
    title: "Trading Level 5",
    description: "Reach Trading Floor level 5.",
    icon: "🥉",
    category: "trading",
    isUnlocked: ({ progress }) => progress.highestTradingLevel >= 5,
  },
  {
    id: "trading-level-10",
    title: "Trading Level 10",
    description: "Reach Trading Floor level 10.",
    icon: "🥈",
    category: "trading",
    isUnlocked: ({ progress }) => progress.highestTradingLevel >= 10,
  },
  {
    id: "trading-level-20",
    title: "Trading Level 20",
    description: "Reach Trading Floor level 20.",
    icon: "🥇",
    category: "trading",
    isUnlocked: ({ progress }) => progress.highestTradingLevel >= 20,
  },
  {
    id: "trading-level-50",
    title: "Trading Level 50",
    description: "Reach Trading Floor level 50.",
    icon: "🎖️",
    category: "trading",
    isUnlocked: ({ progress }) => progress.highestTradingLevel >= 50,
  },
  {
    id: "trading-level-100",
    title: "Trading Legend",
    description: "Reach the maximum Trading Floor level, 100.",
    icon: "🏆",
    category: "trading",
    isUnlocked: ({ progress }) => progress.highestTradingLevel >= 100,
  },
  {
    id: "recordkeeping-60",
    title: "Bookkeeper",
    description: "Raise your Recordkeeping Score to 60 by logging trades in the Trade Ledger.",
    icon: "📒",
    category: "recordkeeping",
    isUnlocked: ({ progress }) => progress.highestRecordkeepingScore >= 60,
  },
  {
    id: "recordkeeping-70",
    title: "Meticulous",
    description: "Raise your Recordkeeping Score to 70.",
    icon: "🔍",
    category: "recordkeeping",
    isUnlocked: ({ progress }) => progress.highestRecordkeepingScore >= 70,
  },
  {
    id: "recordkeeping-80",
    title: "Ledger Master",
    description: "Raise your Recordkeeping Score to 80.",
    icon: "📚",
    category: "recordkeeping",
    isUnlocked: ({ progress }) => progress.highestRecordkeepingScore >= 80,
  },
  {
    id: "recordkeeping-90",
    title: "Audit-Ready",
    description: "Raise your Recordkeeping Score to 90.",
    icon: "✅",
    category: "recordkeeping",
    isUnlocked: ({ progress }) => progress.highestRecordkeepingScore >= 90,
  },
  {
    id: "recordkeeping-100",
    title: "CFO-in-Training",
    description: "Raise your Recordkeeping Score to 100.",
    icon: "💼",
    category: "recordkeeping",
    isUnlocked: ({ progress }) => progress.highestRecordkeepingScore >= 100,
  },
];

export function computeAchievements(ctx: AchievementContext): Achievement[] {
  return ACHIEVEMENT_DEFS.map(({ isUnlocked, ...def }) => ({ ...def, unlocked: isUnlocked(ctx) }));
}
