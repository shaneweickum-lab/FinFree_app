import { dot, identity, outerAddInPlace, solve, zeros } from "./linalg";
import { INTERVENTION_ACTIONS, type ArmParams, type BanditState, type InterventionAction } from "./types";

/**
 * LinUCB (Li et al., 2010) — one of the two algorithms the design doc calls for. Each arm keeps a
 * ridge-regression estimate (A, b) of its reward as a linear function of the context vector; the
 * arm is picked by upper-confidence-bound: estimated reward + an exploration bonus that shrinks as
 * that arm accumulates data. "do nothing" is not one of these arms — see types.ts — so the caller
 * compares the winning arm's score against a fixed threshold to decide whether to act at all.
 */
export function createBanditState(dim: number): BanditState {
  const state = {} as BanditState;
  for (const action of INTERVENTION_ACTIONS) {
    state[action] = { a: identity(dim), b: zeros(dim) };
  }
  return state;
}

export interface ArmScore {
  action: InterventionAction;
  estimate: number;
  bonus: number;
  score: number;
}

/**
 * Scores every arm in `eligible`. `alpha` controls exploration width — callers decay it over time
 * (see tutor-context.tsx) per the design doc's "exploration budget capped and gradually reduced".
 */
export function scoreArms(bandit: BanditState, context: number[], eligible: InterventionAction[], alpha: number): ArmScore[] {
  return eligible.map((action) => {
    const { a, b } = bandit[action];
    const theta = solve(a, b);
    const estimate = dot(theta, context);
    const confidenceVec = solve(a, context);
    const bonus = alpha * Math.sqrt(Math.max(0, dot(context, confidenceVec)));
    return { action, estimate, bonus, score: estimate + bonus };
  });
}

export function selectArm(bandit: BanditState, context: number[], eligible: InterventionAction[], alpha: number): ArmScore {
  const scores = scoreArms(bandit, context, eligible, alpha);
  return scores.reduce((best, current) => (current.score > best.score ? current : best));
}

/** Applies one (context, reward) observation to a single arm's ridge-regression parameters. */
export function updateArm(bandit: BanditState, action: InterventionAction, context: number[], reward: number): BanditState {
  const current = bandit[action];
  const nextA = current.a.map((row) => [...row]);
  outerAddInPlace(nextA, context);
  const nextB = current.b.map((value, i) => value + reward * context[i]);
  const updated: ArmParams = { a: nextA, b: nextB };
  return { ...bandit, [action]: updated };
}
