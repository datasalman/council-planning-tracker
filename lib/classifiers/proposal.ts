import categories from "./categories.json";
import type { CategoryDefinition } from "./meta";

const DEFINITIONS = categories as Record<string, CategoryDefinition>;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Build a case-insensitive whole-word matcher for a set of keywords.
 *
 * The word boundaries are asserted against ASCII alphanumerics rather than the
 * usual `\b`, for two reasons:
 *
 *  - Short use-class codes like "A1" must not match inside "A12", a reference
 *    number, or a road name. A leading/trailing `[a-z0-9]` lookaround enforces
 *    that, whereas a naive substring match (the previous behaviour) did not.
 *  - Accented keywords such as "café" break with `\b`, because `\b` sits at the
 *    transition between a word and non-word character and treats "é" as
 *    non-word. The explicit lookarounds sidestep that entirely.
 *
 * A single optional trailing "s" is allowed so plurals still match — "rear
 * extensions" hits the "rear extension" keyword. (A plain `\b` would miss that
 * too, since the "n"->"s" transition is not a boundary.)
 */
function buildMatcher(terms: string[]): RegExp | null {
  if (!terms || terms.length === 0) return null;
  const alternation = terms.map(escapeRegExp).join("|");
  return new RegExp(`(?<![a-z0-9])(?:${alternation})s?(?![a-z0-9])`, "i");
}

const MATCHERS = Object.entries(DEFINITIONS).map(([category, def]) => ({
  category,
  include: buildMatcher(def.keywords),
  patterns: (def.patterns ?? []).map((source) => new RegExp(source, "i")),
  exclude: buildMatcher(def.exclude ?? []),
}));

/**
 * Tag a proposal description with every job category it matches. A description
 * can carry several tags (e.g. a two-storey rear extension with a loft
 * conversion), and falls back to "Other/Unclassified" when nothing matches.
 */
export function classifyProposal(description: string): string[] {
  if (!description) return ["Other/Unclassified"];

  const matched: string[] = [];
  for (const { category, include, patterns, exclude } of MATCHERS) {
    const hit =
      (include?.test(description) ?? false) ||
      patterns.some((pattern) => pattern.test(description));
    if (hit && !(exclude && exclude.test(description))) {
      matched.push(category);
    }
  }

  return matched.length > 0 ? matched : ["Other/Unclassified"];
}
