"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { useProgress } from "./progress-context";
import { useProfile } from "./profile-context";
import { createBanditState, selectArm, updateArm } from "./tutor/bandit";
import {
  eligibleArms,
  MAX_NUDGES_PER_SESSION,
  MIN_MS_BETWEEN_ANY_NUDGE,
  DO_NOTHING_THRESHOLD,
  currentAlpha,
  sessionNudgeCount,
} from "./tutor/guardrails";
import { buildContextVector, CONTEXT_DIM } from "./tutor/features";
import { findPopQuizQuestion, findReviewLesson, getWeakestConcept } from "./tutor/content-lookup";
import { INTERVENTION_ACTIONS } from "./tutor/types";
import type { BanditState, InterventionAction, NudgeLogEntry, PendingDelayedReward, PendingNudge } from "./tutor/types";
import type { BuyTradeContext, SellTradeContext, TradeCritique } from "./tutor/trade-quality";
import { critiqueBuyTrade, critiqueSellTrade } from "./tutor/trade-quality";
import type { TradeRecord } from "./types";

const TICK_INTERVAL_MS = 20_000;
const NUDGE_EXPIRY_MS = 2 * 60_000;
const IMMEDIATE_REWARD = { engaged: 1, dismissed: -1, expired: -0.3 } as const;

interface PersistedTutorState {
  bandit: BanditState;
  nudgeLog: NudgeLogEntry[];
  pendingDelayedRewards: PendingDelayedReward[];
  totalNudgesShown: number;
  lastNudgeAt: number | null;
  lastNudgeByAction: Partial<Record<InterventionAction, number>>;
  tradeCritiques: Record<string, TradeCritique>;
  pendingTradeCritiqueIds: string[];
}

function emptyTutorState(): PersistedTutorState {
  return {
    bandit: createBanditState(CONTEXT_DIM),
    nudgeLog: [],
    pendingDelayedRewards: [],
    totalNudgesShown: 0,
    lastNudgeAt: null,
    lastNudgeByAction: {},
    tradeCritiques: {},
    pendingTradeCritiqueIds: [],
  };
}

interface TutorContextValue {
  pendingNudge: PendingNudge | null;
  tradeCritiques: Record<string, TradeCritique>;
  engageNudge: () => void;
  dismissNudge: () => void;
  recordBuyTradeForCritique: (trade: TradeRecord, context: BuyTradeContext) => void;
  recordSellTradeForCritique: (trade: TradeRecord, context: SellTradeContext) => void;
}

const TutorContext = createContext<TutorContextValue | null>(null);

export function TutorProvider({ username, children }: { username: string; children: ReactNode }) {
  const storageKey = `finfree.tutor.v1.${username.toLowerCase()}`;
  const pathname = usePathname();
  const { progress } = useProgress();
  const { profile } = useProfile();

  const [state, setState] = useState<PersistedTutorState>(emptyTutorState);
  const [hydrated, setHydrated] = useState(false);
  const [pendingNudge, setPendingNudgeState] = useState<PendingNudge | null>(null);

  const sessionStartAtRef = useRef<number>(0);
  const lastActivityAtRef = useRef<number>(0);
  const nudgeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevQuizAttemptCountRef = useRef<number>(0);
  // Mirrors `pendingNudge` so tick()/resolveNudge() can read the latest value synchronously without
  // nesting a setState call inside another updater (that pattern caused a real double-award bug
  // earlier in this app — see profile-context.tsx's history — so it's avoided here from the start).
  const pendingNudgeRef = useRef<PendingNudge | null>(null);

  const setNudge = useCallback((next: PendingNudge | null) => {
    pendingNudgeRef.current = next;
    setPendingNudgeState(next);
  }, []);

  useEffect(() => {
    const now = Date.now();
    sessionStartAtRef.current = now;
    lastActivityAtRef.current = now;
    prevQuizAttemptCountRef.current = progress.quizAttempts.length;

    try {
      const raw = window.localStorage.getItem(storageKey);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState(raw ? { ...emptyTutorState(), ...JSON.parse(raw) } : emptyTutorState());
    } catch {
      setState(emptyTutorState());
    } finally {
      setHydrated(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state, hydrated, storageKey]);

  // Track user activity for the idle-time feature without triggering re-renders on every event.
  useEffect(() => {
    const markActive = () => {
      lastActivityAtRef.current = Date.now();
    };
    window.addEventListener("pointerdown", markActive);
    window.addEventListener("keydown", markActive);
    window.addEventListener("scroll", markActive, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", markActive);
      window.removeEventListener("keydown", markActive);
      window.removeEventListener("scroll", markActive);
    };
  }, []);

  const clearNudgeTimeout = useCallback(() => {
    if (nudgeTimeoutRef.current) {
      clearTimeout(nudgeTimeoutRef.current);
      nudgeTimeoutRef.current = null;
    }
  }, []);

  const resolveNudge = useCallback(
    (outcome: "engaged" | "dismissed" | "expired") => {
      const current = pendingNudgeRef.current;
      if (!current) return;

      const reward = IMMEDIATE_REWARD[outcome];
      setState((prev) => {
        const nextBandit = updateArm(prev.bandit, current.action, current.context, reward);
        const nextLog = prev.nudgeLog.map((n) => (n.id === current.id ? { ...n, outcome } : n));

        let pendingDelayedRewards = prev.pendingDelayedRewards;
        if (outcome === "engaged" && current.quizConcept) {
          pendingDelayedRewards = [
            ...pendingDelayedRewards,
            { action: current.action, concept: current.quizConcept, context: current.context, timestamp: Date.now() },
          ];
        }

        let pendingTradeCritiqueIds = prev.pendingTradeCritiqueIds;
        if (current.action === "trade-critique" && current.tradeCritiqueId) {
          pendingTradeCritiqueIds = pendingTradeCritiqueIds.filter((id) => id !== current.tradeCritiqueId);
        }

        return { ...prev, bandit: nextBandit, nudgeLog: nextLog, pendingDelayedRewards, pendingTradeCritiqueIds };
      });

      clearNudgeTimeout();
      setNudge(null);
    },
    [clearNudgeTimeout, setNudge],
  );

  const engageNudge = useCallback(() => resolveNudge("engaged"), [resolveNudge]);
  const dismissNudge = useCallback(() => resolveNudge("dismissed"), [resolveNudge]);

  // The decision tick: build context, ask the bandit, apply guardrails, maybe surface a nudge.
  const tick = useCallback(() => {
    if (pendingNudgeRef.current) return; // never stack nudges

    const now = Date.now();
    if (state.lastNudgeAt !== null && now - state.lastNudgeAt < MIN_MS_BETWEEN_ANY_NUDGE) return;
    if (sessionNudgeCount(state.nudgeLog, sessionStartAtRef.current) >= MAX_NUDGES_PER_SESSION) return;

    const onTradingFloor = pathname === "/trading-floor";
    const context = buildContextVector({
      progress,
      profile,
      nudgeLog: state.nudgeLog,
      idleMs: now - lastActivityAtRef.current,
      sessionStartAt: sessionStartAtRef.current,
      lastNudgeAt: state.lastNudgeAt,
      onTradingFloor,
      now,
    });

    const weakestConcept = getWeakestConcept(progress);
    const popQuiz = weakestConcept ? findPopQuizQuestion(weakestConcept) : null;
    const reviewLesson = weakestConcept ? findReviewLesson(weakestConcept) : null;

    let eligible = eligibleArms(INTERVENTION_ACTIONS, {
      nudgeLog: state.nudgeLog,
      lastNudgeByAction: state.lastNudgeByAction,
      now,
      hasPendingTradeCritique: state.pendingTradeCritiqueIds.length > 0,
    });
    if (!popQuiz) eligible = eligible.filter((a) => a !== "micro-pop-quiz");
    if (!reviewLesson) eligible = eligible.filter((a) => a !== "suggest-lesson-review");
    if (eligible.length === 0) return;

    const alpha = currentAlpha(state.totalNudgesShown);
    const best = selectArm(state.bandit, context, eligible, alpha);
    if (best.score <= DO_NOTHING_THRESHOLD) return;

    const nudge: PendingNudge = { id: `nudge-${now}`, action: best.action, context, createdAt: now };
    if (best.action === "micro-pop-quiz" && popQuiz) {
      nudge.quizConcept = weakestConcept ?? undefined;
      nudge.quizQuestionId = popQuiz.question.id;
    }
    if (best.action === "suggest-lesson-review" && reviewLesson) {
      nudge.quizConcept = weakestConcept ?? undefined;
      nudge.reviewModuleId = reviewLesson.moduleId;
      nudge.reviewLessonId = reviewLesson.lessonId;
    }
    if (best.action === "trade-critique") {
      nudge.tradeCritiqueId = state.pendingTradeCritiqueIds[0];
    }

    setState((prev) => ({
      ...prev,
      nudgeLog: [...prev.nudgeLog, { id: nudge.id, action: nudge.action, timestamp: now, outcome: null }],
      totalNudgesShown: prev.totalNudgesShown + 1,
      lastNudgeAt: now,
      lastNudgeByAction: { ...prev.lastNudgeByAction, [nudge.action]: now },
    }));

    clearNudgeTimeout();
    nudgeTimeoutRef.current = setTimeout(() => resolveNudge("expired"), NUDGE_EXPIRY_MS);
    setNudge(nudge);
  }, [state, pathname, progress, profile, clearNudgeTimeout, resolveNudge, setNudge]);

  useEffect(() => {
    if (!hydrated) return;
    const interval = setInterval(tick, TICK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [hydrated, tick]);

  // Resolve delayed rewards: did the targeted concept's accuracy hold up on the next quiz attempt.
  useEffect(() => {
    if (!hydrated) return;
    if (progress.quizAttempts.length <= prevQuizAttemptCountRef.current) return;

    const newAttempts = progress.quizAttempts.slice(prevQuizAttemptCountRef.current);
    prevQuizAttemptCountRef.current = progress.quizAttempts.length;
    if (state.pendingDelayedRewards.length === 0) return;

    setState((prev) => {
      let bandit = prev.bandit;
      const stillPending: PendingDelayedReward[] = [];

      for (const pending of prev.pendingDelayedRewards) {
        const match = newAttempts.flatMap((a) => a.conceptResults).find((r) => r.concept === pending.concept);
        if (!match) {
          stillPending.push(pending);
          continue;
        }
        bandit = updateArm(bandit, pending.action, pending.context, match.correct ? 0.5 : -0.5);
      }

      return { ...prev, bandit, pendingDelayedRewards: stillPending };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, progress.quizAttempts]);

  const recordBuyTradeForCritique = useCallback((trade: TradeRecord, context: BuyTradeContext) => {
    const critique = critiqueBuyTrade(trade, context);
    setState((prev) => ({
      ...prev,
      tradeCritiques: { ...prev.tradeCritiques, [trade.id]: critique },
      pendingTradeCritiqueIds: [...prev.pendingTradeCritiqueIds, trade.id],
    }));
  }, []);

  const recordSellTradeForCritique = useCallback((trade: TradeRecord, context: SellTradeContext) => {
    const critique = critiqueSellTrade(trade, context);
    setState((prev) => ({
      ...prev,
      tradeCritiques: { ...prev.tradeCritiques, [trade.id]: critique },
      pendingTradeCritiqueIds: [...prev.pendingTradeCritiqueIds, trade.id],
    }));
  }, []);

  const value = useMemo(
    () => ({
      pendingNudge,
      tradeCritiques: state.tradeCritiques,
      engageNudge,
      dismissNudge,
      recordBuyTradeForCritique,
      recordSellTradeForCritique,
    }),
    [pendingNudge, state.tradeCritiques, engageNudge, dismissNudge, recordBuyTradeForCritique, recordSellTradeForCritique],
  );

  return <TutorContext.Provider value={value}>{children}</TutorContext.Provider>;
}

export function useTutor(): TutorContextValue {
  const ctx = useContext(TutorContext);
  if (!ctx) throw new Error("useTutor must be used within a TutorProvider");
  return ctx;
}
