import { AddressParsed } from "../types";
import {
  LONDON_LOCALITIES_SET,
  LOCALITY_PROPER_CASE,
  LOCALITIES_SORTED,
} from "./localities";

const POSTCODE_REGEX = /([A-Z]{1,2}[0-9][0-9A-Z]?)\s*([0-9][A-Z]{2})/i;

// Planning portals often prefix the site description onto the address
// ("Land at 12 High Street"). Strip these so the address starts at the premises.
const STRIP_PREFIXES: RegExp[] = [
  /^DEVELOPMENT\s+AT[\s,]+/i,
  /^SITE\s+AT[\s,]+/i,
  /^LAND\s+AT[\s,]+/i,
  /^LAND\s+TO\s+REAR\s+OF[\s,]+/i,
  /^LAND\s+ADJACENT\s+TO[\s,]+/i,
  /^LAND\s+REAR\s+OF[\s,]+/i,
  /^REAR\s+OF[\s,]+/i,
  /^LAND\s+TO\s+THE\s+REAR\s+OF[\s,]+/i,
  /^LAND\s+TO\s+SIDE\s+OF[\s,]+/i,
  /^LAND\s+TO\s+FRONT\s+OF[\s,]+/i,
  /^GARAGE\s+AT[\s,]+/i,
  /^FLAT\s+AT[\s,]+/i,
  /^LAND\s+FRONTING[\s,]+/i,
  /^LAND\s+BEHIND[\s,]+/i,
  /^LAND\s+NORTH\s+OF[\s,]+/i,
  /^LAND\s+SOUTH\s+OF[\s,]+/i,
  /^LAND\s+EAST\s+OF[\s,]+/i,
  /^LAND\s+WEST\s+OF[\s,]+/i,
];

function toTitleCase(s: string): string {
  return s.toLowerCase().replace(/(?:^|\s)(\S)/g, (m) => m.toUpperCase());
}

function isLetter(ch: string): boolean {
  return ch >= "A" && ch <= "Z";
}

// True when `loc` sits at `idx` as a standalone word (not part of a longer word).
function isWholeWord(haystack: string, loc: string, idx: number): boolean {
  const before = idx > 0 ? haystack[idx - 1] : " ";
  const after =
    idx + loc.length < haystack.length ? haystack[idx + loc.length] : " ";
  return !isLetter(before) && !isLetter(after);
}

// Find the locality that sits furthest to the right in `part` (closest to where
// the postcode was). Idox-style addresses are space-delimited with the town just
// before the postcode, so the rightmost match is almost always the real town.
// Matching the longest name anywhere in the string instead would pick up street
// names like "Oakwood Drive" by mistake. Returns the match and the text before it.
function findRightmostLocality(
  part: string
): { town: string; index: number } | null {
  const upper = part.toUpperCase();
  let bestIdx = -1;
  let bestEnd = -1;
  let bestLoc = "";

  // Compare matches by where they end, so the one closest to the postcode wins.
  // When two overlap ("South Woodford" contains "Woodford") they share an end
  // position and the longer name is kept.
  for (const loc of LOCALITIES_SORTED) {
    if (loc.length < 3) continue;

    let from = upper.length;
    let idx = -1;
    while (true) {
      idx = upper.lastIndexOf(loc, from);
      if (idx < 0) break;
      if (isWholeWord(upper, loc, idx)) break;
      from = idx - 1;
    }
    if (idx < 0) continue;

    const end = idx + loc.length;
    if (end > bestEnd || (end === bestEnd && loc.length > bestLoc.length)) {
      bestEnd = end;
      bestIdx = idx;
      bestLoc = loc;
    }
  }

  if (bestIdx < 0) return null;
  return {
    town: LOCALITY_PROPER_CASE.get(bestLoc) ?? toTitleCase(bestLoc),
    index: bestIdx,
  };
}

export function parseAddress(raw: string): AddressParsed {
  if (!raw || raw.trim() === "") {
    return { address_line_1: "", town: "", postcode: "" };
  }

  const postcodeMatch = raw.match(POSTCODE_REGEX);
  const postcode = postcodeMatch
    ? `${postcodeMatch[1].toUpperCase()} ${postcodeMatch[2].toUpperCase()}`
    : "";

  let cleaned = raw
    .replace(POSTCODE_REGEX, "")
    .trim()
    .replace(/[,\s]+$/, "")
    .trim();

  // Loop so stacked prefixes ("Land at Site at ...") are removed in full.
  let prev = "";
  do {
    prev = cleaned;
    for (const prefix of STRIP_PREFIXES) {
      cleaned = cleaned.replace(prefix, "").trim();
    }
  } while (cleaned !== prev);

  const parts = cleaned
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return { address_line_1: "", town: "", postcode };
  }

  let town = "";
  let townPartIndex = -1;
  let isEmbedded = false;
  let preEmbedded = "";

  // First choice: a whole comma-separated segment that is exactly a locality
  // (the clean case, e.g. "106, The Glade, Ilford"). Search from the end.
  for (let i = parts.length - 1; i >= 0; i--) {
    const upper = parts[i].toUpperCase().trim();
    if (LONDON_LOCALITIES_SET.has(upper)) {
      town = LOCALITY_PROPER_CASE.get(upper) ?? parts[i].trim();
      townPartIndex = i;
      break;
    }
  }

  // Otherwise look for a locality embedded inside a segment, taking the
  // rightmost segment that yields one. Skip a match that would leave no address
  // text in front of it, which means the "locality" is really the start of a
  // building or landmark name (e.g. "Golders Green Crematorium ...").
  if (!town) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const match = findRightmostLocality(parts[i]);
      if (!match) continue;

      const before = parts[i].slice(0, match.index).replace(/[,\s]+$/, "").trim();
      const earlierText = parts.slice(0, i).some((p) => p.length > 0);
      if (!before && !earlierText) continue;

      town = match.town;
      townPartIndex = i;
      isEmbedded = true;
      preEmbedded = before;
      break;
    }
  }

  let addressParts: string[];
  if (townPartIndex < 0) {
    addressParts = [...parts];
  } else if (isEmbedded) {
    addressParts = [
      ...parts.slice(0, townPartIndex),
      ...(preEmbedded ? [preEmbedded] : []),
      ...parts.slice(townPartIndex + 1),
    ];
  } else {
    addressParts = parts.filter((_, i) => i !== townPartIndex);
  }

  const [line1 = "", line2 = "", ...rest] = addressParts;
  return {
    address_line_1: line1,
    address_line_2: line2 || undefined,
    address_line_3: rest.length > 0 ? rest.join(", ") : undefined,
    town,
    postcode,
  };
}
