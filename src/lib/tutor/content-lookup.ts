import { LESSONS } from "../content";
import { computeConceptMastery } from "../adaptive";
import type { QuizQuestion, UserProgress } from "../types";

/** The concept with the lowest observed accuracy so far, or null if there's no quiz data yet. */
export function getWeakestConcept(progress: UserProgress): string | null {
  const mastery = computeConceptMastery(progress).filter((c) => c.total > 0);
  if (mastery.length === 0) return null;
  return mastery.reduce((worst, c) => (c.correct / c.total < worst.correct / worst.total ? c : worst)).concept;
}

export interface PopQuizPick {
  moduleId: string;
  lessonId: string;
  question: QuizQuestion;
}

/** Finds a quiz question tagged with `concept` to use as a micro pop-quiz nudge. */
export function findPopQuizQuestion(concept: string): PopQuizPick | null {
  for (const lesson of LESSONS) {
    const question = lesson.quiz?.questions.find((q) => q.concept === concept);
    if (question) return { moduleId: lesson.moduleId, lessonId: lesson.id, question };
  }
  return null;
}

export interface ReviewLessonPick {
  moduleId: string;
  lessonId: string;
  lessonTitle: string;
}

/** Finds the explanatory lesson that first teaches `concept`, for a "review this lesson" nudge. */
export function findReviewLesson(concept: string): ReviewLessonPick | null {
  const lesson = LESSONS.find((l) => l.type === "explanatory" && l.concepts.includes(concept));
  if (!lesson) return null;
  return { moduleId: lesson.moduleId, lessonId: lesson.id, lessonTitle: lesson.title };
}
