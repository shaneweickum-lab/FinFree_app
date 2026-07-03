/**
 * A small AIML-style ("Artificial Intelligence Markup Language") pattern-matching chat engine, in
 * the tradition of ALICE-era bots: a flat list of categories, each a pattern (with `*` / `_`
 * wildcards) mapped to a template. No machine learning, no external API — just pattern matching
 * over a curated knowledge base, which is exactly what the user asked for.
 *
 * Deviations from "real" AIML, and why: templates here can be plain strings OR functions of the
 * match context, so a pattern can answer with live app data (Fin Coin balance, trading level, the
 * last trade critique) instead of only static text. `redirectTo` stands in for AIML's `<srai>` —
 * many phrasings of the same question collapse onto one canonical pattern's template, without
 * needing a full template markup parser. `<that>` (matching against the bot's previous line) is
 * intentionally not implemented; it's the main real AIML feature missing here.
 */

export interface MatchContext {
  /** The raw words captured by each wildcard, in left-to-right order. */
  wildcards: string[];
  /** The user's normalized input, for templates that want the whole thing. */
  input: string;
}

export type Template<TExtra> = string | ((ctx: MatchContext & TExtra) => string);

/** A page the bot can send the user to, so an answer doesn't just sit in the chat panel when the
 * material actually lives somewhere in the app (a lesson, the Trading Floor, etc). */
export interface NavTarget {
  /** App-relative path, e.g. "/modules/m1/lessons/m1-l1". */
  path: string;
  /** Shown in the chat bubble, e.g. "Module 1 — Revenue, Profit & Cash Flow". */
  label: string;
  /** Index into the target lesson's bulletPoints array to scroll to and highlight, if known. */
  highlightIndex?: number;
}

export type NavigateFn<TExtra> = (ctx: MatchContext & TExtra) => NavTarget | null | undefined;

export interface AimlCategory<TExtra> {
  /** Space-separated words; `*` matches one-or-more words (low priority), `_` matches
   * one-or-more words (higher priority, matched before `*` on ties). Case-insensitive. */
  pattern: string;
  template?: Template<TExtra>;
  /** Redirects to another category's pattern (AIML's <srai>). Wildcards are NOT forwarded —
   * redirects are for phrasing variants of a fixed question, not free substitution. */
  redirectTo?: string;
  /** A few templates to pick from at random, for the small-talk categories that would feel
   * robotic if they always said exactly the same thing. */
  randomTemplates?: Template<TExtra>[];
  /** Optional page to send the user to alongside the template's text answer. */
  navigate?: NavigateFn<TExtra>;
}

export interface BotReply {
  text: string;
  navigate?: NavTarget;
}

interface CompiledToken {
  literal: string | null; // null means wildcard
  isWildcard: boolean;
  priority: number; // '_' = 2, '*' = 1, literal = irrelevant (handled separately)
}

interface Compiled<TExtra> {
  category: AimlCategory<TExtra>;
  tokens: CompiledToken[];
}

function normalize(input: string): string {
  return input
    .toUpperCase()
    .replace(/[^A-Z0-9*_' \n]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compile<TExtra>(categories: AimlCategory<TExtra>[]): Compiled<TExtra>[] {
  return categories.map((category) => ({
    category,
    tokens: normalize(category.pattern)
      .split(" ")
      .map((word) => {
        if (word === "*") return { literal: null, isWildcard: true, priority: 1 };
        if (word === "_") return { literal: null, isWildcard: true, priority: 2 };
        return { literal: word, isWildcard: false, priority: 0 };
      }),
  }));
}

interface Attempt {
  matched: boolean;
  wildcards: string[];
  literalCount: number;
  wildcardPriority: number;
}

/** Tries to align `words` against `tokens` allowing each wildcard to greedily absorb one-or-more
 * words, backtracking if a later literal token needs some of them back. */
function tryMatch(tokens: CompiledToken[], words: string[]): Attempt {
  const wildcards: string[] = [];

  function recurse(tokenIndex: number, wordIndex: number): boolean {
    if (tokenIndex === tokens.length) return wordIndex === words.length;
    const token = tokens[tokenIndex];

    if (!token.isWildcard) {
      if (wordIndex >= words.length || words[wordIndex] !== token.literal) return false;
      return recurse(tokenIndex + 1, wordIndex + 1);
    }

    // Wildcard: try longest match first (greedy), backtrack downward.
    const remainingTokens = tokens.length - tokenIndex - 1;
    const maxTake = words.length - wordIndex - remainingTokens;
    for (let take = maxTake; take >= 1; take--) {
      if (take < 1) break;
      const captured = words.slice(wordIndex, wordIndex + take);
      if (recurse(tokenIndex + 1, wordIndex + take)) {
        wildcards.push(captured.join(" "));
        return true;
      }
    }
    return false;
  }

  const matched = words.length > 0 && recurse(0, 0);
  const literalCount = tokens.filter((t) => !t.isWildcard).length;
  const wildcardPriority = tokens.reduce((sum, t) => sum + (t.isWildcard ? t.priority : 0), 0);
  return { matched, wildcards: wildcards.reverse(), literalCount, wildcardPriority };
}

export function createAimlBot<TExtra>(categories: AimlCategory<TExtra>[]) {
  const compiled = compile(categories);
  const byPattern = new Map(categories.map((c) => [normalize(c.pattern), c]));

  /** Follows the redirectTo chain (AIML's <srai>) to the category that actually holds the
   * template/navigate to use for rendering — a redirect's own navigate/template, if any, would be
   * unreachable dead weight, so redirects always defer fully to their target. */
  function resolveFinal(category: AimlCategory<TExtra>): AimlCategory<TExtra> {
    if (category.redirectTo) {
      const target = byPattern.get(normalize(category.redirectTo));
      if (target) return resolveFinal(target);
    }
    return category;
  }

  function renderText(category: AimlCategory<TExtra>, ctx: MatchContext & TExtra): string | null {
    if (category.randomTemplates && category.randomTemplates.length > 0) {
      const pick = category.randomTemplates[Math.floor(Math.random() * category.randomTemplates.length)];
      return typeof pick === "function" ? pick(ctx) : pick;
    }
    if (category.template) {
      return typeof category.template === "function" ? category.template(ctx) : category.template;
    }
    return null;
  }

  function render(category: AimlCategory<TExtra>, ctx: MatchContext & TExtra): BotReply {
    const final = resolveFinal(category);
    const text = renderText(final, ctx) ?? "I'm not sure how to answer that yet.";
    const navigate = final.navigate?.(ctx) ?? undefined;
    return navigate ? { text, navigate } : { text };
  }

  function respond(rawInput: string, extra: TExtra): BotReply {
    const normalized = normalize(rawInput);
    const words = normalized.split(" ").filter(Boolean);

    let best: { compiled: Compiled<TExtra>; attempt: Attempt } | null = null;

    for (const entry of compiled) {
      const attempt = tryMatch(entry.tokens, words);
      if (!attempt.matched) continue;
      if (
        !best ||
        attempt.literalCount > best.attempt.literalCount ||
        (attempt.literalCount === best.attempt.literalCount && attempt.wildcardPriority > best.attempt.wildcardPriority)
      ) {
        best = { compiled: entry, attempt };
      }
    }

    if (!best) {
      const fallback = byPattern.get("*");
      if (!fallback) return { text: "I'm not sure how to answer that yet." };
      return render(fallback, { wildcards: [], input: normalized, ...extra });
    }

    const ctx: MatchContext & TExtra = { wildcards: best.attempt.wildcards, input: normalized, ...extra };
    return render(best.compiled.category, ctx);
  }

  return { respond };
}
