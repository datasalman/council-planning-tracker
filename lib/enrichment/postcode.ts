import axios from "axios";
import { Application } from "../types";

// --- In-process postcode cache ---
// Keys are lowercased address query strings → resolved postcode (or "" if not found).
// Persists for the lifetime of the server process.
const cache = new Map<string, string>();

// --- Throttle (Nominatim policy: max 1 req/sec) ---
let lastRequestAt = 0;
const MIN_GAP_MS = 1_100;

async function waitForSlot(): Promise<void> {
  const wait = MIN_GAP_MS - (Date.now() - lastRequestAt);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequestAt = Date.now();
}

/** Build the best query string from a parsed Application. */
function buildQuery(app: Application): string {
  const parts = [app.address_line_1, app.town, "London"].filter(Boolean);
  // If parsing failed badly (no line1 or town) fall back to raw_address
  return parts.length >= 2 ? parts.join(", ") + ", UK" : app.raw_address + " UK";
}

interface NominatimResult {
  lat?: string;
  lon?: string;
  address?: { postcode?: string };
}

interface PostcodesIoResult {
  status: number;
  result?: Array<{ postcode: string }> | null;
}

/**
 * Ask postcodes.io for the nearest Royal Mail postcode to a lat/lon coordinate.
 * postcodes.io uses PAF data and has near-100% UK coverage — no throttle needed.
 */
async function nearestPostcode(lat: string, lon: string): Promise<string> {
  try {
    const res = await axios.get<PostcodesIoResult>(
      "https://api.postcodes.io/postcodes",
      {
        params: { lon, lat, limit: 1 },
        timeout: 5_000,
      }
    );
    return res.data?.result?.[0]?.postcode ?? "";
  } catch {
    return "";
  }
}

/** Look up postcode for one address string via Nominatim, with postcodes.io fallback. */
async function fetchPostcode(query: string): Promise<string> {
  const key = query.toLowerCase().trim();
  if (cache.has(key)) return cache.get(key)!;

  await waitForSlot();

  try {
    const res = await axios.get<NominatimResult[]>(
      "https://nominatim.openstreetmap.org/search",
      {
        params: {
          q: query,
          format: "json",
          addressdetails: 1,
          countrycodes: "gb",
          limit: 1,
        },
        headers: { "User-Agent": "CouncilPlanningTracker/1.0" },
        timeout: 6_000,
      }
    );

    const hit = res.data?.[0];

    // Primary: Nominatim has postcode in OSM data
    const osmPostcode = hit?.address?.postcode ?? "";
    if (osmPostcode) {
      cache.set(key, osmPostcode);
      return osmPostcode;
    }

    // Fallback: Nominatim has coordinates but no postcode — use postcodes.io
    // (Royal Mail PAF data — much more complete than OSM for postcodes)
    if (hit?.lat && hit?.lon) {
      const pc = await nearestPostcode(hit.lat, hit.lon);
      cache.set(key, pc);
      return pc;
    }
  } catch {
    // fall through to cache empty
  }

  cache.set(key, "");
  return "";
}

/**
 * Mutates each Application in `apps` that has an empty postcode,
 * filling it in via Nominatim + postcodes.io fallback.
 * Caps at POSTCODE_LOOKUP_MAX lookups per call to bound wait time.
 */
export async function enrichPostcodes(apps: Application[]): Promise<void> {
  const max = Number(process.env.POSTCODE_LOOKUP_MAX) || 50;
  let count = 0;

  for (const app of apps) {
    if (app.postcode) continue;
    if (count >= max) break;

    const query = buildQuery(app);
    const postcode = await fetchPostcode(query);
    if (postcode) app.postcode = postcode;
    count++;
  }
}
