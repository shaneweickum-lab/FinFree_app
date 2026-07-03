import { getLesson } from "../content";
import type { UserProgress } from "../types";

export interface QuizGateState {
  quizId: string;
  lessonTitle: string;
  /** How many times the user has failed *this* quiz so far. */
  failedAttempts: number;
  /** True while the chat should refuse to answer — lifts once failedAttempts reaches the minimum. */
  blocked: boolean;
}

/** The chat won't help on the first couple of misses — a real test should be attempted honestly
 * first — but opens up once it's clear the user is genuinely stuck. */
export const MIN_FAILURES_BEFORE_HELP = 2;

/** Detects whether `pathname` is an unpassed quiz lesson, and how many times the user has failed
 * it. Returns null once the quiz has been passed (or the route isn't a quiz lesson at all) — an
 * already-passed test isn't "live" anymore, so there's nothing to gate. */
export function getQuizGateState(pathname: string, progress: UserProgress): QuizGateState | null {
  const match = pathname.match(/^\/modules\/[^/]+\/lessons\/([^/]+)/);
  if (!match) return null;

  const lesson = getLesson(match[1]);
  if (!lesson || lesson.type !== "quiz" || !lesson.quiz) return null;

  const quizId = lesson.quiz.id;
  const attempts = progress.quizAttempts.filter((a) => a.quizId === quizId);
  if (attempts.some((a) => a.passed)) return null;

  const failedAttempts = attempts.filter((a) => !a.passed).length;
  return {
    quizId,
    lessonTitle: lesson.title,
    failedAttempts,
    blocked: failedAttempts < MIN_FAILURES_BEFORE_HELP,
  };
}
