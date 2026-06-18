import categories from "./categories.json";

/**
 * Lead-relevance grouping for the proposal categories.
 *
 * The classifier in `proposal.ts` tags an application by the *type* of work.
 * This file layers a second, builder-focused dimension on top: how likely a
 * category is to be an actual job worth chasing.
 *
 *  - "high"   direct building work (extensions, lofts, new builds, garages)
 *  - "medium" conversions and commercial work worth a look
 *  - "low"    admin and non-construction notices (TPO tree works, telecoms
 *             masts, advertisement consent, condition discharges) — usually
 *             noise for a builder
 *
 * The grouping lives alongside the keywords in `categories.json` so there is a
 * single source of truth; everything here is derived from that file.
 */
export type CategoryGroup = "high" | "medium" | "low";

export interface CategoryDefinition {
  group: CategoryGroup;
  keywords: string[];
  exclude?: string[];
  /** Raw case-insensitive regex sources, for matches plain keywords can't express. */
  patterns?: string[];
}

const DEFINITIONS = categories as Record<string, CategoryDefinition>;

export const CATEGORY_NAMES = Object.keys(DEFINITIONS);

export const CATEGORY_GROUP: Record<string, CategoryGroup> = Object.fromEntries(
  Object.entries(DEFINITIONS).map(([name, def]) => [name, def.group])
);

export const GROUP_ORDER: CategoryGroup[] = ["high", "medium", "low"];

export const GROUP_LABELS: Record<CategoryGroup, string> = {
  high: "Building work",
  medium: "Conversions & commercial",
  low: "Other / low priority",
};

export function groupOf(category: string): CategoryGroup {
  return CATEGORY_GROUP[category] ?? "low";
}

export function categoriesInGroup(group: CategoryGroup): string[] {
  return CATEGORY_NAMES.filter((name) => groupOf(name) === group);
}

/** Everything except the low-priority admin notices. */
export const BUILDABLE_CATEGORIES = CATEGORY_NAMES.filter(
  (name) => groupOf(name) !== "low"
);
