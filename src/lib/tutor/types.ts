/**
 * System 1's real action space, matching the design doc's table (minus "do-nothing" — see below).
 */
export type InterventionAction =
  | "micro-pop-quiz"
  | "encouragement"
  | "trade-critique"
  | "suggest-lesson-review"
  | "suggest-a-break";

export const INTERVENTION_ACTIONS: InterventionAction[] = [
  "micro-pop-quiz",
  "encouragement",
  "trade-critique",
  "suggest-lesson-review",
  "suggest-a-break",
];

/**
 * "Do nothing" is deliberately NOT modeled as a bandit arm. If it were an arm with the same
 * uninitialized (A=I, b=0) starting parameters as every other arm, it would score identically to
 * them at cold start and win every tie forever (never explored, so never updated, so always tied) —
 * the bandit would never fire a single nudge. Instead the best real arm must clear a fixed score
 * threshold (see guardrails.ts) before it fires; otherwise the tick resolves to no action.
 */

/** Linear-model bandit parameters for one arm: A (d x d) and b (d), per the LinUCB update rule. */
export interface ArmParams {
  a: number[][];
  b: number[];
}

export type BanditState = Record<InterventionAction, ArmParams>;

export interface NudgeLogEntry {
  id: string;
  action: InterventionAction;
  timestamp: number;
  outcome: "engaged" | "dismissed" | "expired" | null;
}

/** A pending delayed-reward record: did quiz accuracy on `concept` improve after this nudge fired. */
export interface PendingDelayedReward {
  action: InterventionAction;
  concept: string;
  context: number[];
  timestamp: number;
}

export interface PendingNudge {
  id: string;
  action: InterventionAction;
  context: number[];
  createdAt: number;
  /** Populated only for "micro-pop-quiz" */
  quizConcept?: string;
  quizQuestionId?: string;
  /** Populated only for "suggest-lesson-review" */
  reviewLessonId?: string;
  reviewModuleId?: string;
  /** Populated only for "trade-critique" */
  tradeCritiqueId?: string;
}

export interface TutorState {
  bandit: BanditState;
  nudgeLog: NudgeLogEntry[];
  pendingDelayedRewards: PendingDelayedReward[];
  totalNudgesShown: number;
  lastNudgeAt: number | null;
  lastNudgeByAction: Partial<Record<InterventionAction, number>>;
}
