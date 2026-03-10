import categories from "./categories.json";

export function classifyProposal(description: string): string[] {
  if (!description) return ["Other/Unclassified"];

  const lower = description.toLowerCase();
  const matched: string[] = [];

  for (const [category, keywords] of Object.entries(categories)) {
    if ((keywords as string[]).some((kw) => lower.includes(kw.toLowerCase()))) {
      matched.push(category);
    }
  }

  return matched.length > 0 ? matched : ["Other/Unclassified"];
}
