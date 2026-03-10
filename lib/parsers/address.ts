import { AddressParsed } from "../types";
import {
  LONDON_LOCALITIES_SET,
  LOCALITY_PROPER_CASE,
  LOCALITIES_SORTED,
} from "./localities";

const POSTCODE_REGEX = /([A-Z]{1,2}[0-9][0-9A-Z]?)\s*([0-9][A-Z]{2})/i;

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

/** Return true if the character is an ASCII letter (A-Z after toUpperCase). */
function isLetter(ch: string): boolean {
  return ch >= "A" && ch <= "Z";
}

export function parseAddress(raw: string): AddressParsed {
  if (!raw || raw.trim() === "") {
    return { address_line_1: "", town: "", postcode: "" };
  }

  // Step 1: Extract postcode
  const postcodeMatch = raw.match(POSTCODE_REGEX);
  const postcode = postcodeMatch
    ? `${postcodeMatch[1].toUpperCase()} ${postcodeMatch[2].toUpperCase()}`
    : "";

  // Remove postcode and tidy trailing punctuation/whitespace
  let cleaned = raw
    .replace(POSTCODE_REGEX, "")
    .trim()
    .replace(/[,\s]+$/, "")
    .trim();

  // Step 2: Strip leading-prefix phrases
  // Loop until stable so stacked prefixes like "Land At Development At …"
  // are fully removed in multiple passes.
  let prev = "";
  do {
    prev = cleaned;
    for (const prefix of STRIP_PREFIXES) {
      cleaned = cleaned.replace(prefix, "").trim();
    }
  } while (cleaned !== prev);

  // Step 3: Split into comma-delimited parts
  const parts = cleaned
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return { address_line_1: "", town: "", postcode };
  }

  // Step 4: Find town — exact part match, searching from end
  let town = "";
  let townPartIndex = -1;
  let isEmbedded = false;
  let preEmbedded = ""; // address text that precedes an embedded locality

  for (let i = parts.length - 1; i >= 0; i--) {
    const upper = parts[i].toUpperCase().trim();
    if (LONDON_LOCALITIES_SET.has(upper)) {
      town = LOCALITY_PROPER_CASE.get(upper) ?? parts[i].trim();
      townPartIndex = i;
      break;
    }
  }

  // Step 5: Embedded match — locality appears as whole words inside a longer part
  // LOCALITIES_SORTED is longest-first so "South Woodford" beats "Woodford".
  if (!town) {
    outer: for (let i = parts.length - 1; i >= 0; i--) {
      const partUpper = parts[i].toUpperCase();

      for (const loc of LOCALITIES_SORTED) {
        // Skip very short tokens to avoid false matches ("Lee" etc. are fine;
        // the boundary check protects against substring collisions).
        if (loc.length < 3) continue;

        const idx = partUpper.indexOf(loc);
        if (idx < 0) continue;

        // Whole-word boundary: character before and after must not be a letter
        const charBefore = idx > 0 ? partUpper[idx - 1] : " ";
        const charAfter =
          idx + loc.length < partUpper.length
            ? partUpper[idx + loc.length]
            : " ";
        if (isLetter(charBefore) || isLetter(charAfter)) continue;

        // Valid match — extract locality and the address fragment before it
        town = LOCALITY_PROPER_CASE.get(loc) ?? toTitleCase(loc);
        townPartIndex = i;
        isEmbedded = true;
        preEmbedded = parts[i]
          .slice(0, idx)
          .replace(/[,\s]+$/, "")
          .trim();
        break outer;
      }
    }
  }

  // Step 6: Build address lines
  let addressParts: string[];

  if (townPartIndex < 0) {
    // No town found — use all parts as address
    addressParts = [...parts];
  } else if (isEmbedded) {
    // Town was embedded in a part — replace that part with the pre-locality fragment
    addressParts = [
      ...parts.slice(0, townPartIndex),
      ...(preEmbedded ? [preEmbedded] : []),
      ...parts.slice(townPartIndex + 1),
    ];
  } else {
    // Exact part match — drop the town part entirely
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
