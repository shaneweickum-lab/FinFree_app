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
import type { Lesson, QuizAttemptRecord, UserProgress } from "./types";

const STORAGE_KEY = "finfree.progress.v1";

const EMPTY_PROGRESS: UserProgress = {
  completedLessonIds: [],
  completedModuleIds: [],
  quizAttempts: [],
  finCoinBalance: 0,
  finCoinLedger: [],
  tradingFloorUnlocked: false,
  tradingSessionsCompleted: 0,
};

interface QuizSubmissionResult {
  score: number;
  passed: boolean;
  correctCount: number;
  totalCount: number;
}

interface ProgressContextValue {
  progress: UserProgress;
  hydrated: boolean;
  isLessonComplete: (lessonId: string) => boolean;
  isModuleComplete: (moduleId: string) => boolean;
  completeLesson: (lesson: Lesson) => void;
  submitQuiz: (lesson: Lesson, answers: number[]) => QuizSubmissionResult;
  recordTradingSession: () => void;
  adjustFinCoin: (amount: number, reason: string) => void;
  resetProgress: () => void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

let ledgerIdCounter = 0;
function nextId(prefix: string) {
  ledgerIdCounter += 1;
  return `${prefix}-${ledgerIdCounter}-${Math.floor(performance.now())}`;
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<UserProgress>(EMPTY_PROGRESS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // One-time load from localStorage on mount: server and first client render must match
    // (both start from EMPTY_PROGRESS), so the real value is applied here rather than as
    // useState's initializer, which would cause a hydration mismatch.
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setProgress({ ...EMPTY_PROGRESS, ...JSON.parse(raw) });
      }
    } catch {
      // corrupted or inaccessible storage — fall back to empty progress
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress, hydrated]);

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
      recordTradingSession,
      adjustFinCoin,
      resetProgress,
    }),
    [
      progress,
      hydrated,
      isLessonComplete,
      isModuleComplete,
      completeLesson,
      submitQuiz,
      recordTradingSession,
      adjustFinCoin,
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
