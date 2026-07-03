"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  MODULES,
  MODULE_COMPLETION_BONUS,
  QUIZ_HIGH_SCORE_BONUS,
  QUIZ_HIGH_SCORE_THRESHOLD,
  getLessonsByModule,
} from "./content";
import { computePortfolioValue, computeTradingLevel } from "./trading-levels";
import type { TickerState } from "./market";
import type { Lesson, OrderKind, QuizAttemptRecord, TradeRecord, TradeSide, UserProgress } from "./types";

const EMPTY_PROGRESS: UserProgress = {
  completedLessonIds: [],
  completedModuleIds: [],
  quizAttempts: [],
  finCoinBalance: 0,
  finCoinLedger: [],
  // Unlocked by default for now so the Trading Floor can be worked on without clearing all 7 modules first.
  tradingFloorUnlocked: true,
  tradingSessionsCompleted: 0,
  positions: [],
  tradeHistory: [],
  highestTradingLevel: 1,
};

interface QuizSubmissionResult {
  score: number;
  passed: boolean;
  correctCount: number;
  totalCount: number;
}

interface TradeResult {
  success: boolean;
  message?: string;
  trade?: TradeRecord;
}

interface ProgressContextValue {
  progress: UserProgress;
  hydrated: boolean;
  isLessonComplete: (lessonId: string) => boolean;
  isModuleComplete: (moduleId: string) => boolean;
  completeLesson: (lesson: Lesson) => void;
  submitQuiz: (lesson: Lesson, answers: number[]) => QuizSubmissionResult;
  recordAdHocQuizAnswer: (concept: string, correct: boolean, meta: { lessonId: string; moduleId: string; quizId: string }) => void;
  recordTradingSession: () => void;
  adjustFinCoin: (amount: number, reason: string) => void;
  executeTrade: (
    tickers: TickerState[],
    symbol: string,
    side: TradeSide,
    orderKind: OrderKind,
    quantity: number,
    execPrice: number,
    stopPrice?: number,
  ) => TradeResult;
  resetProgress: () => void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

let ledgerIdCounter = 0;
function nextId(prefix: string) {
  ledgerIdCounter += 1;
  return `${prefix}-${ledgerIdCounter}-${Math.floor(performance.now())}`;
}

export function ProgressProvider({ username, children }: { username: string; children: ReactNode }) {
  const storageKey = `finfree.progress.v1.${username.toLowerCase()}`;
  const [progress, setProgress] = useState<UserProgress>(EMPTY_PROGRESS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // One-time load from localStorage on mount: server and first client render must match
    // (both start from EMPTY_PROGRESS), so the real value is applied here rather than as
    // useState's initializer, which would cause a hydration mismatch.
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setProgress({ ...EMPTY_PROGRESS, ...JSON.parse(raw) });
      } else {
        setProgress(EMPTY_PROGRESS);
      }
    } catch {
      setProgress(EMPTY_PROGRESS);
    } finally {
      setHydrated(true);
    }
    // Re-run whenever the logged-in account changes so switching accounts loads that account's data.
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(storageKey, JSON.stringify(progress));
  }, [progress, hydrated, storageKey]);

  const isLessonComplete = useCallback(
    (lessonId: string) => progress.completedLessonIds.includes(lessonId),
    [progress.completedLessonIds],
  );

  const isModuleComplete = useCallback(
    (moduleId: string) => progress.completedModuleIds.includes(moduleId),
    [progress.completedModuleIds],
  );

  const awardFinCoin = useCallback(
    (draft: UserProgress, amount: number, reason: string, meta?: { lessonId?: string; moduleId?: string }) => {
      draft.finCoinBalance += amount;
      draft.finCoinLedger = [
        ...draft.finCoinLedger,
        {
          id: nextId("fc"),
          amount,
          reason,
          timestamp: Date.now(),
          ...meta,
        },
      ];
    },
    [],
  );

  const finalizeModuleAndCourseState = useCallback(
    (draft: UserProgress, moduleId: string) => {
      const moduleLessons = getLessonsByModule(moduleId);
      const allLessonsDone = moduleLessons.every((l) => draft.completedLessonIds.includes(l.id));

      if (allLessonsDone && !draft.completedModuleIds.includes(moduleId)) {
        draft.completedModuleIds = [...draft.completedModuleIds, moduleId];
        awardFinCoin(draft, MODULE_COMPLETION_BONUS, "Module completion bonus", { moduleId });
      }

      if (MODULES.every((m) => draft.completedModuleIds.includes(m.id))) {
        draft.tradingFloorUnlocked = true;
      }
    },
    [awardFinCoin],
  );

  const completeLesson = useCallback(
    (lesson: Lesson) => {
      setProgress((prev) => {
        if (prev.completedLessonIds.includes(lesson.id)) return prev;
        const draft: UserProgress = {
          ...prev,
          completedLessonIds: [...prev.completedLessonIds, lesson.id],
          finCoinLedger: [...prev.finCoinLedger],
          completedModuleIds: [...prev.completedModuleIds],
        };
        awardFinCoin(draft, lesson.finCoinReward, `Completed lesson: ${lesson.title}`, {
          lessonId: lesson.id,
          moduleId: lesson.moduleId,
        });
        finalizeModuleAndCourseState(draft, lesson.moduleId);
        return draft;
      });
    },
    [awardFinCoin, finalizeModuleAndCourseState],
  );

  const submitQuiz = useCallback(
    (lesson: Lesson, answers: number[]): QuizSubmissionResult => {
      const quiz = lesson.quiz;
      if (!quiz) {
        return { score: 0, passed: false, correctCount: 0, totalCount: 0 };
      }

      const conceptResults = quiz.questions.map((q, i) => ({
        concept: q.concept,
        correct: answers[i] === q.correctIndex,
      }));
      const correctCount = conceptResults.filter((r) => r.correct).length;
      const totalCount = quiz.questions.length;
      const score = totalCount === 0 ? 0 : correctCount / totalCount;
      const passed = score >= quiz.passingScore;

      setProgress((prev) => {
        const attempt: QuizAttemptRecord = {
          quizId: quiz.id,
          lessonId: lesson.id,
          moduleId: lesson.moduleId,
          score,
          passed,
          conceptResults,
          timestamp: Date.now(),
        };

        const draft: UserProgress = {
          ...prev,
          quizAttempts: [...prev.quizAttempts, attempt],
          finCoinLedger: [...prev.finCoinLedger],
          completedModuleIds: [...prev.completedModuleIds],
          completedLessonIds: [...prev.completedLessonIds],
        };

        if (passed) {
          if (!draft.completedLessonIds.includes(lesson.id)) {
            draft.completedLessonIds = [...draft.completedLessonIds, lesson.id];
          }
          awardFinCoin(draft, lesson.finCoinReward, `Passed quiz: ${lesson.title}`, {
            lessonId: lesson.id,
            moduleId: lesson.moduleId,
          });
          if (score >= QUIZ_HIGH_SCORE_THRESHOLD) {
            awardFinCoin(draft, QUIZ_HIGH_SCORE_BONUS, `High score bonus: ${lesson.title}`, {
              lessonId: lesson.id,
              moduleId: lesson.moduleId,
            });
          }
          finalizeModuleAndCourseState(draft, lesson.moduleId);
        }

        return draft;
      });

      return { score, passed, correctCount, totalCount };
    },
    [awardFinCoin, finalizeModuleAndCourseState],
  );

  /** Records a single AI Tutor pop-quiz answer as a one-question attempt, so it feeds the same
   * concept-mastery and adaptive-difficulty tracking as regular lesson quizzes. */
  const recordAdHocQuizAnswer = useCallback(
    (concept: string, correct: boolean, meta: { lessonId: string; moduleId: string; quizId: string }) => {
      setProgress((prev) => {
        const attempt: QuizAttemptRecord = {
          quizId: meta.quizId,
          lessonId: meta.lessonId,
          moduleId: meta.moduleId,
          score: correct ? 1 : 0,
          passed: correct,
          conceptResults: [{ concept, correct }],
          timestamp: Date.now(),
        };
        return { ...prev, quizAttempts: [...prev.quizAttempts, attempt] };
      });
    },
    [],
  );

  const recordTradingSession = useCallback(() => {
    setProgress((prev) => ({
      ...prev,
      tradingSessionsCompleted: prev.tradingSessionsCompleted + 1,
    }));
  }, []);

  /** Caller must check progress.finCoinBalance + amount >= 0 before calling with a negative amount. */
  const adjustFinCoin = useCallback(
    (amount: number, reason: string) => {
      setProgress((prev) => {
        const draft: UserProgress = { ...prev, finCoinLedger: [...prev.finCoinLedger] };
        awardFinCoin(draft, amount, reason);
        return draft;
      });
    },
    [awardFinCoin],
  );

  const executeTrade = useCallback(
    (
      tickers: TickerState[],
      symbol: string,
      side: TradeSide,
      orderKind: OrderKind,
      quantity: number,
      execPrice: number,
      stopPrice?: number,
    ): TradeResult => {
      const cost = execPrice * quantity;
      let result: TradeResult = { success: true };

      setProgress((prev) => {
        const existingPosition = prev.positions.find((p) => p.symbol === symbol);

        if (side === "buy" && prev.finCoinBalance < cost) {
          result = { success: false, message: "Not enough Fin Coin for this order." };
          return prev;
        }
        if (side === "sell" && (!existingPosition || existingPosition.quantity < quantity)) {
          result = { success: false, message: "Not enough shares to sell." };
          return prev;
        }

        const draft: UserProgress = {
          ...prev,
          finCoinLedger: [...prev.finCoinLedger],
          positions: [...prev.positions],
        };

        if (side === "buy") {
          awardFinCoin(draft, -Math.round(cost), `Bought ${quantity} ${symbol}`);
          if (!existingPosition) {
            draft.positions.push({ symbol, quantity, avgCost: execPrice });
          } else {
            const totalQty = existingPosition.quantity + quantity;
            const avgCost = (existingPosition.avgCost * existingPosition.quantity + cost) / totalQty;
            draft.positions = draft.positions.map((p) => (p.symbol === symbol ? { ...p, quantity: totalQty, avgCost } : p));
          }
        } else {
          awardFinCoin(draft, Math.round(cost), `Sold ${quantity} ${symbol}`);
          draft.positions = draft.positions
            .map((p) => (p.symbol === symbol ? { ...p, quantity: p.quantity - quantity } : p))
            .filter((p) => p.quantity > 0);
        }

        const newTrade: TradeRecord = {
          id: nextId("trade"),
          symbol,
          side,
          orderKind,
          quantity,
          price: execPrice,
          timestamp: Date.now(),
          ...(stopPrice !== undefined ? { stopPrice } : {}),
        };
        draft.tradeHistory = [newTrade, ...prev.tradeHistory];
        result = { success: true, trade: newTrade };

        const portfolioValue = computePortfolioValue(draft.finCoinBalance, draft.positions, tickers);
        draft.highestTradingLevel = Math.max(draft.highestTradingLevel, computeTradingLevel(portfolioValue).level);

        return draft;
      });

      return result;
    },
    [awardFinCoin],
  );

  const resetProgress = useCallback(() => {
    setProgress(EMPTY_PROGRESS);
  }, []);

  const value = useMemo(
    () => ({
      progress,
      hydrated,
      isLessonComplete,
      isModuleComplete,
      completeLesson,
      submitQuiz,
      recordAdHocQuizAnswer,
      recordTradingSession,
      adjustFinCoin,
      executeTrade,
      resetProgress,
    }),
    [
      progress,
      hydrated,
      isLessonComplete,
      isModuleComplete,
      completeLesson,
      submitQuiz,
      recordAdHocQuizAnswer,
      recordTradingSession,
      adjustFinCoin,
      executeTrade,
      resetProgress,
    ],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used within a ProgressProvider");
  return ctx;
}
