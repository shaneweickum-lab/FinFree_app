import { LESSONS, getLesson, getModule } from "../content";
import { computeConceptMastery } from "../adaptive";
import type { QuizQuestion, UserProgress } from "../types";
import type { NavTarget } from "./aiml-engine";

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

/** Maps a glossary term to the concept slug that teaches it plus a plain-language phrase to search
 * for within that lesson's bulletPoints, so the chat can highlight the exact line that answers the
 * question instead of just dropping the user on the lesson. Terms with no curriculum home (app
 * currency, terms only covered off-hand) are simply absent — the chat still answers, it just has
 * nowhere useful to send the user. */
const GLOSSARY_CONCEPT_LOCATIONS: Record<string, { concept: string; phrase: string }> = {
  REVENUE: { concept: "revenue", phrase: "revenue" },
  PROFIT: { concept: "net-profit", phrase: "profit" },
  "NET LOSS": { concept: "net-loss", phrase: "net loss" },
  "NET INCOME": { concept: "net-income", phrase: "net income" },
  "CASH FLOW": { concept: "cash-flow", phrase: "cash flow" },
  "BALANCE SHEET": { concept: "balance-sheet", phrase: "balance sheet" },
  "INCOME STATEMENT": { concept: "income-statement", phrase: "income statement" },
  ASSETS: { concept: "assets", phrase: "assets" },
  LIABILITIES: { concept: "liabilities", phrase: "liabilities" },
  EQUITY: { concept: "equity", phrase: "equity" },
  EBITDA: { concept: "ebitda", phrase: "ebitda" },
  "WORKING CAPITAL": { concept: "working-capital", phrase: "working capital" },
  "ACCOUNTS RECEIVABLE": { concept: "accounts-receivable", phrase: "accounts receivable" },
  "ACCOUNTS PAYABLE": { concept: "accounts-receivable", phrase: "accounts payable" },
  "STOP LOSS": { concept: "order-types", phrase: "stop-loss order" },
  BID: { concept: "bid-ask", phrase: "bid, ask, and spread" },
  ASK: { concept: "bid-ask", phrase: "bid, ask, and spread" },
  SPREAD: { concept: "bid-ask", phrase: "bid, ask, and spread" },
  "MARKET ORDER": { concept: "order-types", phrase: "market order" },
  "LIMIT ORDER": { concept: "order-types", phrase: "limit order" },
  "POSITION SIZING": { concept: "position-sizing", phrase: "position sizing" },
  "BULL MARKET": { concept: "candlesticks", phrase: "bull market" },
  "BEAR MARKET": { concept: "candlesticks", phrase: "bull market" },
  VOLATILITY: { concept: "candlesticks", phrase: "volatility, liquidity" },
  LIQUIDITY: { concept: "candlesticks", phrase: "volatility, liquidity" },
};

/** Given a resolved glossary key (see knowledge-base.ts's lookupGlossary), finds the lesson that
 * teaches it and, if possible, which bulletPoint answers it — so the chat can jump straight there
 * and highlight the line instead of just naming the module. */
export function findGlossaryNavTarget(glossaryKey: string): NavTarget | null {
  const location = GLOSSARY_CONCEPT_LOCATIONS[glossaryKey];
  if (!location) return null;

  const review = findReviewLesson(location.concept);
  if (!review) return null;

  const lesson = getLesson(review.lessonId);
  const mod = getModule(review.moduleId);
  const bulletIndex = lesson?.bulletPoints.findIndex((point) => point.toLowerCase().includes(location.phrase.toLowerCase()));

  return {
    path: `/modules/${review.moduleId}/lessons/${review.lessonId}`,
    label: `${mod?.houseTitle ?? "Module"} — ${review.lessonTitle}`,
    highlightIndex: bulletIndex !== undefined && bulletIndex >= 0 ? bulletIndex : undefined,
  };
}
