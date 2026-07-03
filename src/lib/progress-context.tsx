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
import { computeStatementForPeriod, gradeLedgerEntry, RECORDKEEPING_BASELINE, type LedgerEntryInput } from "./recordkeeping";
import type { TickerState } from "./market";
import type { BankStatement, Lesson, LedgerEntry, OrderKind, QuizAttemptRecord, TradeRecord, TradeSide, UserProgress } from "./types";

const EMPTY_PROGRESS: UserProgress = {
  completedLessonIds: [],
  completedModuleIds: [],
  quizAttempts: [],
  finCoinBalance: 0,
  finCoinLedger: [],
  savingsBalance: 0,
  savingsLedger: [],
  // Unlocked by default for now so the Trading Floor can be worked on without clearing all 7 modules first.
  tradingFloorUnlocked: true,
  tradingSessionsCompleted: 0,
  positions: [],
  tradeHistory: [],
  highestTradingLevel: 1,
  recordkeepingScore: RECORDKEEPING_BASELINE,
  highestRecordkeepingScore: RECORDKEEPING_BASELINE,
  ledgerEntries: [],
  bankStatements: [],
  lastStatementAt: 0,
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

interface TransferResult {
  success: boolean;
  message?: string;
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
  logLedgerEntry: (tradeId: string, entered: LedgerEntryInput) => LedgerEntry | null;
  generateBankStatement: (manual: boolean) => BankStatement | null;
  depositToSavings: (amount: number) => TransferResult;
  withdrawFromSavings: (amount: number) => TransferResult;
  resetProgress: () => void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

let ledgerIdCounter = 0;
function nextId(prefix: string) {
  ledgerIdCounter += 1;
  return `${prefix}-${ledgerIdCounter}-${Math.floor(performance.now())}`;
}

/** The statement clock starts at whichever Fin Coin Bank activity — a trade, a deposit, a
 * withdrawal — happens first, not whenever the Trade Ledger page happens to first be visited.
 * Otherwise activity before that first visit would fall before every statement's period and could
 * never be logged or counted as missed. `eventTimestamp - 1` keeps the triggering event itself
 * strictly inside the resulting period (periods are filtered with `> periodStart`). */
function startStatementClockIfNeeded(draft: UserProgress, eventTimestamp: number) {
  if (draft.lastStatementAt === 0) {
    draft.lastStatementAt = eventTimestamp - 1;
  }
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

  /** Moves Fin Coin from checking to savings. Recorded on both ledgers — as a negative checking
   * entry and a positive savings entry — so bank statements can report the transfer on either side
   * without any special-casing beyond summing each ledger for the period. */
  const depositToSavings = useCallback(
    (amount: number): TransferResult => {
      if (amount <= 0) return { success: false, message: "Enter an amount greater than zero." };
      let result: TransferResult = { success: true };
      setProgress((prev) => {
        if (prev.finCoinBalance < amount) {
          result = { success: false, message: "Not enough in checking to deposit that much." };
          return prev;
        }
        const draft: UserProgress = { ...prev, finCoinLedger: [...prev.finCoinLedger], savingsLedger: [...prev.savingsLedger] };
        const timestamp = Date.now();
        awardFinCoin(draft, -amount, "Transferred to Savings");
        draft.savingsBalance = prev.savingsBalance + amount;
        draft.savingsLedger.push({ id: nextId("sv"), amount, reason: "Deposit from Checking", timestamp });
        startStatementClockIfNeeded(draft, timestamp);
        return draft;
      });
      return result;
    },
    [awardFinCoin],
  );

  /** The mirror image of depositToSavings — moves Fin Coin from savings back to checking. */
  const withdrawFromSavings = useCallback(
    (amount: number): TransferResult => {
      if (amount <= 0) return { success: false, message: "Enter an amount greater than zero." };
      let result: TransferResult = { success: true };
      setProgress((prev) => {
        if (prev.savingsBalance < amount) {
          result = { success: false, message: "Not enough in savings to withdraw that much." };
          return prev;
        }
        const draft: UserProgress = { ...prev, finCoinLedger: [...prev.finCoinLedger], savingsLedger: [...prev.savingsLedger] };
        const timestamp = Date.now();
        awardFinCoin(draft, amount, "Transferred from Savings");
        draft.savingsBalance = prev.savingsBalance - amount;
        draft.savingsLedger.push({ id: nextId("sv"), amount: -amount, reason: "Withdrawal to Checking", timestamp });
        startStatementClockIfNeeded(draft, timestamp);
        return draft;
      });
      return result;
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

        let realizedPnL: number | undefined;

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
          // existingPosition is guaranteed here by the guard above.
          realizedPnL = (execPrice - existingPosition!.avgCost) * quantity;
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
          balanceAfter: draft.finCoinBalance,
          ...(stopPrice !== undefined ? { stopPrice } : {}),
          ...(realizedPnL !== undefined ? { realizedPnL } : {}),
        };
        draft.tradeHistory = [newTrade, ...prev.tradeHistory];
        result = { success: true, trade: newTrade };

        startStatementClockIfNeeded(draft, newTrade.timestamp);

        const portfolioValue = computePortfolioValue(draft.finCoinBalance, draft.positions, tickers);
        draft.highestTradingLevel = Math.max(draft.highestTradingLevel, computeTradingLevel(portfolioValue).level);

        return draft;
      });

      return result;
    },
    [awardFinCoin],
  );

  /** Grades and files one Trade Ledger row. A trade can only be logged once — resubmitting an
   * already-logged trade is a no-op, so there's no way to game the score by re-grading an entry
   * after seeing the result. */
  const logLedgerEntry = useCallback((tradeId: string, entered: LedgerEntryInput): LedgerEntry | null => {
    let created: LedgerEntry | null = null;
    setProgress((prev) => {
      if (prev.ledgerEntries.some((e) => e.tradeId === tradeId)) return prev;
      const trade = prev.tradeHistory.find((t) => t.id === tradeId);
      if (!trade) return prev;

      const graded = gradeLedgerEntry(trade, entered);
      const entry: LedgerEntry = { id: nextId("ledger"), tradeId, loggedAt: Date.now(), ...graded };
      created = entry;
      const recordkeepingScore = prev.recordkeepingScore + graded.pointsAwarded;

      return {
        ...prev,
        ledgerEntries: [...prev.ledgerEntries, entry],
        recordkeepingScore,
        highestRecordkeepingScore: Math.max(prev.highestRecordkeepingScore, recordkeepingScore),
      };
    });
    return created;
  }, []);

  /** Closes out the period since the last statement (or since the clock was started, for the
   * first one), applying the missed-trade penalty for anything left unlogged. Used both by the
   * 24h auto-check and the "Generate Statement Now" button — the only difference is `manual`. */
  const generateBankStatement = useCallback((manual: boolean): BankStatement | null => {
    let created: BankStatement | null = null;
    setProgress((prev) => {
      if (!prev.lastStatementAt) return prev;
      const now = Date.now();
      const draft = computeStatementForPeriod(prev, prev.lastStatementAt, now, manual);
      const recordkeepingScoreAfter = Math.max(0, prev.recordkeepingScore - draft.pointsLostThisPeriod);

      const statement: BankStatement = {
        id: nextId("statement"),
        generatedAt: now,
        recordkeepingScoreAfter,
        periodStart: draft.periodStart,
        periodEnd: draft.periodEnd,
        manual: draft.manual,
        openingFinCoinBalance: draft.openingFinCoinBalance,
        closingFinCoinBalance: draft.closingFinCoinBalance,
        tradesExecuted: draft.tradesExecuted,
        buys: draft.buys,
        sells: draft.sells,
        realizedPnL: draft.realizedPnL,
        tradesLogged: draft.tradesLogged,
        tradesMissed: draft.tradesMissed,
        recordkeepingPointsDelta: draft.recordkeepingPointsDelta,
        openingSavingsBalance: draft.openingSavingsBalance,
        closingSavingsBalance: draft.closingSavingsBalance,
        savingsDeposits: draft.savingsDeposits,
        savingsWithdrawals: draft.savingsWithdrawals,
      };
      created = statement;

      return {
        ...prev,
        bankStatements: [statement, ...prev.bankStatements],
        recordkeepingScore: recordkeepingScoreAfter,
        highestRecordkeepingScore: Math.max(prev.highestRecordkeepingScore, recordkeepingScoreAfter),
        lastStatementAt: now,
      };
    });
    return created;
  }, []);

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
      logLedgerEntry,
      generateBankStatement,
      depositToSavings,
      withdrawFromSavings,
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
      logLedgerEntry,
      generateBankStatement,
      depositToSavings,
      withdrawFromSavings,
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
