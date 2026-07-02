import type {
  AdaptiveDifficultyProfile,
  ConceptMastery,
  MarketDifficulty,
  UserProgress,
} from "./types";

const WEAK_CONCEPT_THRESHOLD = 0.6;

export function computeConceptMastery(progress: UserProgress): ConceptMastery[] {
  const byConcept = new Map<string, ConceptMastery>();

  for (const attempt of progress.quizAttempts) {
    for (const result of attempt.conceptResults) {
      const existing = byConcept.get(result.concept) ?? {
        concept: result.concept,
        correct: 0,
        total: 0,
      };
      existing.total += 1;
      if (result.correct) existing.correct += 1;
      byConcept.set(result.concept, existing);
    }
  }

  return Array.from(byConcept.values());
}

/** Concepts a learner has repeatedly gotten wrong — used to route remediation back to the source lesson. */
export function getWeakConcepts(progress: UserProgress): string[] {
  return computeConceptMastery(progress)
    .filter((c) => c.total > 0 && c.correct / c.total < WEAK_CONCEPT_THRESHOLD)
    .map((c) => c.concept);
}

export function computeOverallMasteryScore(progress: UserProgress): number {
  const mastery = computeConceptMastery(progress);
  if (mastery.length === 0) return 0.5; // neutral starting point before any quiz data exists

  const totalCorrect = mastery.reduce((sum, c) => sum + c.correct, 0);
  const totalAttempts = mastery.reduce((sum, c) => sum + c.total, 0);
  return totalAttempts === 0 ? 0.5 : totalCorrect / totalAttempts;
}

/**
 * Drives the Trading Floor Simulation's difficulty. Strong quiz/module performance pushes
 * volatility and spread tightness up; weak performance starts gentler. Difficulty also creeps
 * upward with each completed session regardless of starting point, so the challenge never
 * plateaus.
 */
export function computeAdaptiveDifficulty(progress: UserProgress): AdaptiveDifficultyProfile {
  const masteryScore = computeOverallMasteryScore(progress);
  const sessionRamp = Math.min(progress.tradingSessionsCompleted * 0.05, 0.4);

  const volatility = clamp01(0.25 + masteryScore * 0.5 + sessionRamp);
  const spreadTightness = clamp01(0.2 + masteryScore * 0.6 + sessionRamp);

  const level = volatilityToLevel(volatility);

  return { level, volatility, spreadTightness, masteryScore };
}

function volatilityToLevel(volatility: number): MarketDifficulty {
  if (volatility < 0.35) return "calm";
  if (volatility < 0.6) return "moderate";
  if (volatility < 0.85) return "volatile";
  return "chaotic";
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}
