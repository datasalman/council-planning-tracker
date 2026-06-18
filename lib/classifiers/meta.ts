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
 * Keeping this as a name -> group lookup means the matching logic and the
 * category keywords stay untouched; the UI just reads the grouping.
 */
export type CategoryGroup = "high" | "medium" | "low";

export const CATEGORY_NAMES = Object.keys(categories);

export const CATEGORY_GROUP: Record<string, CategoryGroup> = {
  "Loft Conversions": "high",
  "Rear Extensions": "high",
  "Side Extensions": "high",
  "Two-Storey Extensions": "high",
  "Front Extensions": "high",
  "Dormer Windows": "high",
  "Hip-to-Gable": "high",
  "Basement Extensions": "high",
  "New Build": "high",
  "Demolition & Rebuild": "high",
  "Garage / Outbuilding / Garden Structure": "high",
  "Change of Use": "medium",
  "Prior Approval / Permitted Development": "medium",
  "Outline & Reserved Matters": "medium",
  "Commercial / Mixed Use": "medium",
  "Certificate of Lawfulness": "low",
  "Listed Building & Heritage": "low",
  "Advertisement Consent": "low",
  "Telecommunications": "low",
  "Trees & Hedgerows (TPO)": "low",
  "Discharge of Conditions": "low",
};

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
