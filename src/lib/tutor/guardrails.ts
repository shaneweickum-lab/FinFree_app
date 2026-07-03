import type { InterventionAction, NudgeLogEntry } from "./types";

/**
 * Hard constraints that sit above the policy regardless of what it wants to try — per the design
 * doc's "Guardrails (Constrained / Safe RL)" section. These are not learned; they're fixed caps an
 * under-trained bandit cannot override.
 */
export const MAX_NUDGES_PER_SESSION = 5;
export const DISMISSAL_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes
export const MIN_MS_BETWEEN_ANY_NUDGE = 90 * 1000; // don't even consider nudging more than once per 90s
const INITIAL_ALPHA = 1.5;
const ALPHA_DECAY_PER_NUDGE = 0.08;
const MIN_ALPHA = 0.25;

/** The best-scoring real arm must clear this bar before it fires; otherwise the tick resolves to
 * "do nothing" (see types.ts for why do-nothing isn't modeled as an arm itself). */
export const DO_NOTHING_THRESHOLD = 0.4;

/** Exploration width shrinks as the bandit accumulates real feedback, per "exploration budget capped
 * and gradually reduced as confidence in the reward model grows". */
export function currentAlpha(totalNudgesShown: number): number {
  return Math.max(MIN_ALPHA, INITIAL_ALPHA - totalNudgesShown * ALPHA_DECAY_PER_NUDGE);
}

export function sessionNudgeCount(nudgeLog: NudgeLogEntry[], sessionStartAt: number): number {
  return nudgeLog.filter((n) => n.timestamp >= sessionStartAt).length;
}

export function isArmOnCooldown(
  action: InterventionAction,
  lastNudgeByAction: Partial<Record<InterventionAction, number>>,
  nudgeLog: NudgeLogEntry[],
  now: number,
): boolean {
  const lastFired = lastNudgeByAction[action];
  if (lastFired === undefined) return false;

  const lastEntry = [...nudgeLog].reverse().find((n) => n.action === action && n.timestamp === lastFired);
  if (lastEntry?.outcome !== "dismissed") return false;

  return now - lastFired < DISMISSAL_COOLDOWN_MS;
}

/** Which arms the bandit is even allowed to consider right now, before it scores any of them. */
export function eligibleArms(
  allActions: InterventionAction[],
  context: { nudgeLog: NudgeLogEntry[]; lastNudgeByAction: Partial<Record<InterventionAction, number>>; now: number; hasPendingTradeCritique: boolean },
): InterventionAction[] {
  return allActions.filter((action) => {
    if (action === "trade-critique" && !context.hasPendingTradeCritique) return false;
    if (isArmOnCooldown(action, context.lastNudgeByAction, context.nudgeLog, context.now)) return false;
    return true;
  });
}
