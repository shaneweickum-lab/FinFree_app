import type { AimlCategory, MatchContext, NavTarget } from "./aiml-engine";
import { computeTradingLevel } from "../trading-levels";
import { computeOverallMasteryScore } from "../adaptive";
import { MODULES } from "../content";
import { LITERACY_LEVEL_LABELS } from "../types";
import type { UserProfile, UserProgress } from "../types";
import type { TradeCritique } from "./trade-quality";
import { findGlossaryNavTarget, findGlossaryKeyForConcept, findReviewLesson } from "./content-lookup";

export interface TutorChatContext {
  progress: UserProgress;
  profile: UserProfile;
  tradeCritiques: Record<string, TradeCritique>;
}

type Ctx = MatchContext & TutorChatContext;

/** Glossary lookups fall through the "WHAT IS *" family of wildcard patterns below, so adding a
 * term here is enough to make it answerable — no new category needed per word. */
const GLOSSARY: Record<string, string> = {
  REVENUE: "Revenue is the total amount of money a business earns from sales, before any expenses are subtracted.",
  PROFIT:
    "Profit (or net profit) is what's left after subtracting all of a company's expenses from its revenue. High revenue doesn't guarantee profit.",
  "NET LOSS": "A net loss happens when a company's expenses exceed its revenue over a period — the opposite of net profit.",
  "NET INCOME": "Net income is another name for the bottom-line profit a company reports after all expenses, interest, and taxes.",
  "CASH FLOW":
    "Cash flow is the actual movement of cash into and out of a business — separate from profit, since a company can be profitable on paper but still run short on real cash.",
  "BALANCE SHEET":
    "A balance sheet is a snapshot of what a company owns (assets) and owes (liabilities and equity) at one specific moment in time. Assets = Liabilities + Equity.",
  "INCOME STATEMENT":
    "An income statement shows a company's revenue, expenses, and profit over a period of time (like a quarter or year) — unlike the balance sheet's single-moment snapshot.",
  ASSETS: "Assets are everything a company owns that has value — cash, inventory, equipment, and more.",
  LIABILITIES: "Liabilities are everything a company owes — debts, loans, and unpaid bills.",
  EQUITY: "Equity is what's left for shareholders after subtracting liabilities from assets — the company's net worth.",
  EBITDA:
    "EBITDA (Earnings Before Interest, Taxes, Depreciation, and Amortization) strips out financing and accounting differences so analysts can compare companies' core operating performance.",
  "WORKING CAPITAL": "Working capital is current assets minus current liabilities — a measure of a company's short-term financial health.",
  "ACCOUNTS RECEIVABLE": "Accounts receivable is money that customers owe a company for goods or services already delivered.",
  "ACCOUNTS PAYABLE": "Accounts payable is money a company owes to its own suppliers.",
  DIVERSIFICATION: "Diversification means spreading money across different investments instead of concentrating it in one place, to reduce risk.",
  "MARKET CAP": "Market capitalization is a company's total share price multiplied by its number of outstanding shares.",
  "COMPOUND INTEREST": "Compound interest is interest earned on both your original amount and on interest you've already earned — growth on growth.",
  "STOP LOSS": "A stop-loss order automatically sells a position if it drops to a set price, limiting how much you can lose on a trade.",
  BID: "The bid is the highest price a buyer is currently willing to pay for a stock.",
  ASK: "The ask is the lowest price a seller is currently willing to accept for a stock.",
  SPREAD: "The spread is the gap between the bid and the ask price.",
  "MARKET ORDER": "A market order buys or sells immediately at the best currently available price.",
  "LIMIT ORDER": "A limit order only executes at a specific price or better, rather than the current market price.",
  "POSITION SIZING": "Position sizing is deciding how much of your capital to risk on a single trade — a core risk-management skill.",
  FOMO: "FOMO (Fear Of Missing Out) is buying or selling impulsively because you're afraid of missing a price move, rather than following a plan.",
  "BULL MARKET": "A bull market is a period of generally rising prices and investor optimism.",
  "BEAR MARKET": "A bear market is a period of generally falling prices and investor pessimism.",
  VOLATILITY: "Volatility measures how much and how quickly a price moves — higher volatility means bigger, faster swings.",
  LIQUIDITY: "Liquidity is how easily an asset can be bought or sold without significantly moving its price.",
  "FIN COIN": "Fin Coin is FinFree App's in-app currency — you earn it by completing lessons, quizzes, and modules, and spend it trading on the Trading Floor.",
};

/** Alternate phrasings that resolve to an existing glossary entry rather than duplicating its text.
 * (Punctuation-only variants like "stop-loss" need no entry here — the engine normalizes hyphens
 * to spaces before matching, so "STOP-LOSS" and "STOP LOSS" are already the same lookup key.) */
const GLOSSARY_ALIASES: Record<string, string> = {
  "NET PROFIT": "PROFIT",
  "MARKET CAPITALIZATION": "MARKET CAP",
};

/** Resolves a raw wildcard capture (e.g. "a stop loss" or "stop loss order") to the canonical
 * GLOSSARY key it refers to, by exact key, alias, leading article, or trailing filler word. Both
 * the definition text and the "where is this taught" lookup key off of this same resolution so
 * they never disagree about which term was actually meant. */
function resolveGlossaryKey(rawTerm: string): string | null {
  const term = rawTerm.trim().replace(/^(A|AN|THE)\s+/, "");
  if (GLOSSARY[term]) return term;
  if (GLOSSARY_ALIASES[term] && GLOSSARY[GLOSSARY_ALIASES[term]]) return GLOSSARY_ALIASES[term];

  const keys = [...Object.keys(GLOSSARY), ...Object.keys(GLOSSARY_ALIASES)].sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (new RegExp(`(^|\\s)${key}(\\s|$)`).test(term)) {
      return GLOSSARY[key] ? key : GLOSSARY_ALIASES[key];
    }
  }
  return null;
}

function lookupGlossary(rawTerm: string): string | null {
  const key = resolveGlossaryKey(rawTerm);
  return key ? GLOSSARY[key] : null;
}

function lookupGlossaryNav(rawTerm: string): NavTarget | null {
  const key = resolveGlossaryKey(rawTerm);
  return key ? findGlossaryNavTarget(key) : null;
}

function formatCoin(n: number): string {
  return new Intl.NumberFormat("en-US").format(Math.round(n));
}

/** The AI Tutor's "Assisted Mode" explainer — the piece constrained to teach the underlying
 * concept without ever stating or implying which quiz choice is correct. That constraint is
 * structural, not just a prompt instruction: this only ever pulls from the same generic
 * glossary/lesson text used everywhere else in the chat, which has no notion of a specific quiz
 * question's answer choices to leak in the first place. */
function explainConcept(concept: string): string | null {
  const glossaryKey = findGlossaryKeyForConcept(concept);
  if (glossaryKey && GLOSSARY[glossaryKey]) return GLOSSARY[glossaryKey];

  const review = findReviewLesson(concept);
  if (!review) return null;
  return `That's covered in "${review.lessonTitle}" — worth a re-read before your next attempt.`;
}

/** Builds the reply shown when the user accepts an Assisted Mode offer: one explanation per
 * concept they got wrong on their most recent failed attempt at `quizId`. */
export function buildQuizAssistanceMessage(quizId: string, progress: UserProgress): string {
  const failedAttempts = progress.quizAttempts.filter((a) => a.quizId === quizId && !a.passed);
  const latest = failedAttempts[failedAttempts.length - 1];
  const fallback = "Let's talk through the material — ask me about any term from the lesson you're unsure of.";
  if (!latest) return fallback;

  const missedConcepts = Array.from(new Set(latest.conceptResults.filter((r) => !r.correct).map((r) => r.concept)));
  const explanations = missedConcepts.map(explainConcept).filter((e): e is string => Boolean(e));
  if (explanations.length === 0) return fallback;

  const intro = "I won't hand you the answer, but let's go over what tripped you up:";
  const outro = "Think it through with that in mind, then give the quiz another shot.";
  return [intro, ...explanations.map((e) => `• ${e}`), outro].join("\n\n");
}

export const TUTOR_CATEGORIES: AimlCategory<TutorChatContext>[] = [
  // ---- Small talk ----
  {
    pattern: "HELLO",
    randomTemplates: [
      "Hi! I'm your FinFree Tutor. Ask me about a financial term, a trading concept, or your own progress.",
      "Hey there! What can I help you understand today?",
    ],
  },
  { pattern: "HI", redirectTo: "HELLO" },
  { pattern: "HEY", redirectTo: "HELLO" },
  { pattern: "HI THERE", redirectTo: "HELLO" },
  { pattern: "HELLO THERE", redirectTo: "HELLO" },
  { pattern: "GOOD MORNING", redirectTo: "HELLO" },
  { pattern: "GOOD AFTERNOON", redirectTo: "HELLO" },

  {
    pattern: "HOW ARE YOU",
    template: "I'm just a pattern-matching tutor, so no feelings to report — but I'm ready to help. What's on your mind?",
  },
  { pattern: "HOW ARE YOU DOING", redirectTo: "HOW ARE YOU" },
  { pattern: "HOW IS IT GOING", redirectTo: "HOW ARE YOU" },
  { pattern: "HOWS IT GOING", redirectTo: "HOW ARE YOU" },

  {
    pattern: "WHO ARE YOU",
    template:
      "I'm the FinFree Tutor — a rule-based assistant that can explain financial and trading terms, and answer questions about your own progress in the app.",
  },
  { pattern: "WHAT ARE YOU", redirectTo: "WHO ARE YOU" },
  { pattern: "WHAT IS YOUR NAME", redirectTo: "WHO ARE YOU" },

  {
    pattern: "WHAT CAN YOU DO",
    template:
      "Ask me things like \"what is a stop-loss\", \"what is my Fin Coin balance\", \"what trading level am I\", or \"how do I earn Fin Coin\". I can also explain most of the vocabulary from the curriculum.",
  },
  { pattern: "WHAT CAN YOU HELP WITH", redirectTo: "WHAT CAN YOU DO" },
  { pattern: "HELP", redirectTo: "WHAT CAN YOU DO" },
  { pattern: "WHAT DO YOU DO", redirectTo: "WHAT CAN YOU DO" },

  { pattern: "THANK YOU", template: "You're welcome! Let me know if anything else comes up." },
  { pattern: "THANKS", redirectTo: "THANK YOU" },
  { pattern: "THANK YOU VERY MUCH", redirectTo: "THANK YOU" },

  { pattern: "BYE", template: "See you on the Trading Floor. 👋" },
  { pattern: "GOODBYE", redirectTo: "BYE" },
  { pattern: "SEE YOU LATER", redirectTo: "BYE" },
  { pattern: "BYE BYE", redirectTo: "BYE" },

  // ---- App mechanics (personalized where the data exists) ----
  {
    pattern: "WHAT IS MY BALANCE",
    template: (ctx: Ctx) => `You currently have ${formatCoin(ctx.progress.finCoinBalance)} Fin Coin.`,
  },
  { pattern: "HOW MANY FIN COIN DO I HAVE", redirectTo: "WHAT IS MY BALANCE" },
  { pattern: "HOW MUCH FIN COIN DO I HAVE", redirectTo: "WHAT IS MY BALANCE" },
  { pattern: "WHAT IS MY FIN COIN BALANCE", redirectTo: "WHAT IS MY BALANCE" },
  { pattern: "HOW MUCH MONEY DO I HAVE", redirectTo: "WHAT IS MY BALANCE" },

  {
    pattern: "WHAT TRADING LEVEL AM I",
    template: (ctx: Ctx) => `Your highest Trading Floor level reached is ${ctx.progress.highestTradingLevel} out of 100.`,
  },
  { pattern: "WHAT LEVEL AM I", redirectTo: "WHAT TRADING LEVEL AM I" },
  { pattern: "WHAT IS MY TRADING LEVEL", redirectTo: "WHAT TRADING LEVEL AM I" },
  { pattern: "WHAT LEVEL AM I ON", redirectTo: "WHAT TRADING LEVEL AM I" },

  {
    pattern: "HOW DO TRADING LEVELS WORK",
    template:
      "The Trading Floor has 100 levels based on your portfolio value. Level 1 needs 10,000 Fin Coin; each level after that needs about 17.68% more than the last, reaching a 100 billion Fin Coin goal at level 100.",
  },
  { pattern: "HOW DOES LEVELING WORK", redirectTo: "HOW DO TRADING LEVELS WORK" },
  { pattern: "HOW DO LEVELS WORK", redirectTo: "HOW DO TRADING LEVELS WORK" },

  {
    pattern: "HOW AM I DOING",
    template: (ctx: Ctx) => {
      const modulesDone = ctx.progress.completedModuleIds.length;
      const mastery = Math.round(computeOverallMasteryScore(ctx.progress) * 100);
      const level = computeTradingLevel(ctx.progress.finCoinBalance).level;
      return `You've completed ${modulesDone} of ${MODULES.length} modules, your quiz mastery is around ${mastery}%, and you've reached Trading Floor level ${level}. Check the Analytics page for the full picture.`;
    },
  },
  { pattern: "HOW IS MY PROGRESS", redirectTo: "HOW AM I DOING" },
  { pattern: "HOW AM I PROGRESSING", redirectTo: "HOW AM I DOING" },

  {
    pattern: "WHAT IS MY LITERACY LEVEL",
    template: (ctx: Ctx) =>
      ctx.profile.selfReportedLevel
        ? `Your profile lists your financial literacy level as "${LITERACY_LEVEL_LABELS[ctx.profile.selfReportedLevel]}".`
        : "You haven't set a financial literacy level yet — you can do that, and take the placement quiz, from your Profile page.",
    navigate: () => ({ path: "/profile", label: "Profile" }),
  },

  {
    pattern: "WHY DID I GET THAT TRADE CRITIQUE",
    template: (ctx: Ctx) => {
      const critiques = Object.values(ctx.tradeCritiques);
      if (critiques.length === 0) return "You don't have any trade critiques yet — make a trade on the Trading Floor first.";
      const latest = critiques[critiques.length - 1];
      const factors = latest.factors.map((f) => f.detail).join(" ");
      return `Your most recent trade was rated "${latest.verdict}". ${factors} ${latest.suggestedReframe}`;
    },
  },
  { pattern: "WHY WAS MY TRADE RISKY", redirectTo: "WHY DID I GET THAT TRADE CRITIQUE" },
  { pattern: "EXPLAIN MY LAST TRADE", redirectTo: "WHY DID I GET THAT TRADE CRITIQUE" },

  {
    pattern: "WHAT ARE ACHIEVEMENTS",
    template: "Achievements are milestones across onboarding, learning, Fin Coin, and trading — check the Achievements page to see which you've unlocked.",
    navigate: () => ({ path: "/achievements", label: "Achievements" }),
  },
  { pattern: "WHAT IS AN ACHIEVEMENT", redirectTo: "WHAT ARE ACHIEVEMENTS" },

  {
    pattern: "WHAT IS THE TRADING FLOOR",
    template:
      "The Trading Floor is a simulated stock market where you trade using Fin Coin instead of real money, with zero real-world risk.",
    navigate: () => ({ path: "/trading-floor", label: "Trading Floor" }),
  },
  { pattern: "WHAT IS THE TRADING FLOOR SIMULATION", redirectTo: "WHAT IS THE TRADING FLOOR" },

  {
    pattern: "WHAT IS THIS APP",
    template:
      "FinFree App teaches financial literacy and day trading fundamentals through \"Building Your Financial House\" — a curriculum of 7 modules across 3 pathways, plus a gamified Trading Floor simulation.",
  },
  { pattern: "WHAT IS FINFREE", redirectTo: "WHAT IS THIS APP" },

  {
    pattern: "HOW DO I EARN FIN COIN",
    template: "You earn Fin Coin by completing lessons, passing quizzes, finishing modules, and completing your profile and placement quiz.",
  },
  { pattern: "HOW DO I GET FIN COIN", redirectTo: "HOW DO I EARN FIN COIN" },
  { pattern: "HOW DO I MAKE FIN COIN", redirectTo: "HOW DO I EARN FIN COIN" },

  // ---- Glossary wildcard fallback: covers any term not given its own category above ----
  // Each also offers a `navigate` target — if the term is taught in a lesson, the chat sends the
  // user there and highlights the exact line, instead of leaving the definition stranded in the
  // chat panel.
  {
    pattern: "WHAT IS *",
    template: (ctx: Ctx) => lookupGlossary(ctx.wildcards[0]) ?? `I don't have a definition for "${ctx.wildcards[0].toLowerCase()}" yet.`,
    navigate: (ctx: Ctx) => lookupGlossaryNav(ctx.wildcards[0]),
  },
  {
    pattern: "WHAT ARE *",
    template: (ctx: Ctx) => lookupGlossary(ctx.wildcards[0]) ?? `I don't have a definition for "${ctx.wildcards[0].toLowerCase()}" yet.`,
    navigate: (ctx: Ctx) => lookupGlossaryNav(ctx.wildcards[0]),
  },
  {
    pattern: "WHAT DOES * MEAN",
    template: (ctx: Ctx) => lookupGlossary(ctx.wildcards[0]) ?? `I don't have a definition for "${ctx.wildcards[0].toLowerCase()}" yet.`,
    navigate: (ctx: Ctx) => lookupGlossaryNav(ctx.wildcards[0]),
  },
  {
    pattern: "DEFINE *",
    template: (ctx: Ctx) => lookupGlossary(ctx.wildcards[0]) ?? `I don't have a definition for "${ctx.wildcards[0].toLowerCase()}" yet.`,
    navigate: (ctx: Ctx) => lookupGlossaryNav(ctx.wildcards[0]),
  },

  // ---- Ultimate fallback ----
  {
    pattern: "*",
    randomTemplates: [
      "I'm not sure how to answer that. Try asking about a term like \"what is a balance sheet\", or about your own progress.",
      "I didn't quite catch that. You can ask me to define a financial or trading term, or ask about your Fin Coin, level, or achievements.",
    ],
  },
];
