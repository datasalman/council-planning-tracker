import axios from "axios";
import https from "https";

const client = axios.create({
  httpsAgent: new https.Agent({ rejectUnauthorized: false })
});

const TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS) || 30_000;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

export interface RawIdoxApplication {
  keyVal: string;
  reference: string;
  description: string;
  location: string;
  applicationType: string;
  receivedDate: string; // e.g. "19 Feb 2026"
  status: string;
}

/** ISO YYYY-MM-DD to Idox DD/MM/YYYY */
function isoToIdoxSlash(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/** Break [dateFrom, dateTo] into chunks of max `maxDays` days. Returns inclusive ISO pairs [start, end]. */
function dateChunks(dateFrom: string, dateTo: string, maxDays: number = 30): [string, string][] {
  const start = new Date(dateFrom);
  const end = new Date(dateTo);
  const chunks: [string, string][] = [];

  let cur = new Date(start);
  while (cur <= end) {
    let chunkEnd = new Date(cur);
    chunkEnd.setDate(chunkEnd.getDate() + maxDays - 1);
    if (chunkEnd > end) {
      chunkEnd = new Date(end);
    }
    chunks.push([
      cur.toISOString().slice(0, 10),
      chunkEnd.toISOString().slice(0, 10)
    ]);
    cur = new Date(chunkEnd);
    cur.setDate(cur.getDate() + 1);
  }
  return chunks;
}

/** Add `days` to an ISO date, returning a new ISO date. */
function addDaysIso(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Midpoint ISO date of an inclusive [start, end] window (rounds down). */
function midpointIso(startIso: string, endIso: string): string {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  return new Date(start + Math.floor((end - start) / 2)).toISOString().slice(0, 10);
}

// Idox refuses to list a result set above its configured limit, returning this
// message instead of results. The caller narrows the date window when it sees it.
const TOO_MANY_RE = /too many results/i;

// Safety cap on how many result pages we'll walk for a single window (~10 per
// page). High enough for any sane date window, low enough to bound a runaway.
const MAX_PAGES = 100;

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
}

function parseResultsHtml(html: string): RawIdoxApplication[] {
  const results: RawIdoxApplication[] = [];

  // Each result is a <li class="searchresult"> element
  const liRegex = /<li[^>]+class="[^"]*searchresult[^"]*"[^>]*>([\s\S]*?)<\/li>/gi;
  let liMatch: RegExpExecArray | null;

  while ((liMatch = liRegex.exec(html)) !== null) {
    const item = liMatch[1];

    // Link: href contains keyVal, text contains description (sometimes with ref at end)
    const linkMatch = item.match(
      /<a[^>]+href="([^"]*applicationDetails[^"]*)"[^>]*>([\s\S]*?)<\/a>/i
    );
    if (!linkMatch) continue;

    const href = linkMatch[1];
    const linkText = stripHtml(linkMatch[2]);

    // keyVal from href (?keyVal=DCAPR_176559&... or &keyVal=...)
    const keyValMatch = href.match(/[?&]keyVal=([^&"]+)/i);
    const keyVal = keyValMatch?.[1] ?? "";

    // Address: <p class="address">
    const addrMatch = item.match(
      /<p[^>]+class="[^"]*address[^"]*"[^>]*>([\s\S]*?)<\/p>/i
    );
    const location = addrMatch ? stripHtml(addrMatch[1]) : "";

    // Meta info: <p class="metaInfo">
    const metaMatch = item.match(
      /<p[^>]+class="[^"]*metaInfo[^"]*"[^>]*>([\s\S]*?)<\/p>/i
    );
    const meta = metaMatch ? stripHtml(metaMatch[1]) : "";

    // The reference ("Ref. No: 26/0425") is most reliable when read from metaInfo.
    const refMatch = meta.match(/Ref\.?\s*No\.?\s*:?\s*([A-Z0-9][^\s|,]+)/i);
    const reference = refMatch?.[1].trim() ?? "";

    // Application type: last segment of reference (e.g. "FUL" from "26/0025/FUL")
    const typeMatch = reference.match(/\/([A-Z][A-Z0-9]+)$/i);
    const applicationType = typeMatch?.[1].toUpperCase() ?? "";

    // Description: strip trailing "Ref: XXXX/YY" that some Idox configs append
    const description = linkText
      .replace(/\s+Ref:?\s+[A-Z0-9][A-Z0-9/]+\s*$/i, "")
      .trim();

    // Received date: "Received: Thu 19 Feb 2026" → "19 Feb 2026"
    // Also matched "Validated: Thu 19 Feb 2026" as some councils sort by Validated
    const receivedMatch = meta.match(
      /(?:Received|Validated):?\s*(?:\w{3,}\s+)?(\d{1,2}\s+\w+\s+\d{4})/i
    );
    const receivedDate = receivedMatch?.[1].trim() ?? "";

    // Status: "Status: Awaiting decision"
    const statusMatch = meta.match(/Status:?\s*([^|<]+)/i);
    const status = statusMatch?.[1].trim() ?? "";

    if (reference || keyVal) {
      results.push({
        keyVal,
        reference,
        description,
        location,
        applicationType,
        receivedDate,
        status,
      });
    }
  }

  return results;
}

interface ChunkResult {
  /** True when Idox reported the window held too many results to list. */
  tooMany: boolean;
  results: RawIdoxApplication[];
}

async function fetchAdvancedSearchChunk(
  baseUrl: string,
  startSlash: string,
  endSlash: string
): Promise<ChunkResult> {
  // Public Access needs a session cookie and CSRF token before it accepts a search.
  const sessionResp = await client.get<string>(`${baseUrl}/search.do`, {
    params: { action: "advanced" },
    headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
    timeout: TIMEOUT_MS,
    responseType: "text",
  });

  const sessionCookie = ((sessionResp.headers["set-cookie"] as string[] | undefined) ?? [])
    .map((c) => c.split(";")[0])
    .join("; ");

  const csrfMatch = sessionResp.data.match(/name="_csrf"\s+value="([^"]+)"/);
  const csrfToken = csrfMatch ? csrfMatch[1] : "";

  // Submit the advanced search for the validated-date window.
  const params = new URLSearchParams();
  params.append("date(applicationValidatedStart)", startSlash);
  params.append("date(applicationValidatedEnd)", endSlash);
  params.append("searchType", "Application");
  if (csrfToken) params.append("_csrf", csrfToken);

  const firstResp = await client.post<string>(
    `${baseUrl}/advancedSearchResults.do?action=firstPage`,
    params.toString(),
    {
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml",
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: sessionCookie,
      },
      timeout: TIMEOUT_MS,
      responseType: "text",
    }
  );

  if (TOO_MANY_RE.test(firstResp.data)) {
    return { tooMany: true, results: [] };
  }

  const results: RawIdoxApplication[] = [];
  const seen = new Set<string>();
  const collect = (html: string): number => {
    let added = 0;
    for (const r of parseResultsHtml(html)) {
      const key = r.keyVal || r.reference;
      if (key && !seen.has(key)) {
        seen.add(key);
        results.push(r);
        added++;
      }
    }
    return added;
  };

  collect(firstResp.data);

  // Walk result pages in order until one adds nothing new. Reading the page
  // links off the first response (the old approach) topped out at page 10, so
  // anything past ~100 results in a busy borough was silently dropped. Pages
  // beyond the linked window are reachable directly, so step through them. A
  // one-off page error (a slow portal dropping a request) is skipped rather
  // than ending the walk early; only a run of failures, i.e. a dead session,
  // stops it.
  let failures = 0;
  for (let pg = 2; pg <= MAX_PAGES; pg++) {
    try {
      const pageResp = await client.get<string>(
        `${baseUrl}/pagedSearchResults.do`,
        {
          params: { action: "page", "searchCriteria.page": pg },
          headers: {
            "User-Agent": UA,
            Accept: "text/html,application/xhtml+xml",
            Cookie: sessionCookie,
          },
          timeout: TIMEOUT_MS,
          responseType: "text",
        }
      );
      failures = 0;
      if (collect(pageResp.data) === 0) break;
    } catch {
      if (++failures >= 3) break;
    }
  }

  return { tooMany: false, results };
}

/**
 * Fetch one date window, halving it and retrying whenever Idox says the result
 * set is too large to list. A single day can't be split further, so its
 * (rare) overflow is accepted as-is.
 */
async function searchWindow(
  baseUrl: string,
  startIso: string,
  endIso: string
): Promise<RawIdoxApplication[]> {
  const { tooMany, results } = await fetchAdvancedSearchChunk(
    baseUrl,
    isoToIdoxSlash(startIso),
    isoToIdoxSlash(endIso)
  );

  if (!tooMany || startIso >= endIso) return results;

  const mid = midpointIso(startIso, endIso);
  const left = await searchWindow(baseUrl, startIso, mid);
  const right = await searchWindow(baseUrl, addDaysIso(mid, 1), endIso);
  return [...left, ...right];
}

export async function searchByDateRange(
  baseUrl: string,
  dateFrom: string,
  dateTo: string
): Promise<RawIdoxApplication[]> {
  const chunks = dateChunks(dateFrom, dateTo, 30);
  const seen = new Set<string>();
  const results: RawIdoxApplication[] = [];

  for (const [startIso, endIso] of chunks) {
    try {
      const chunkResults = await searchWindow(baseUrl, startIso, endIso);
      for (const r of chunkResults) {
        const key = r.keyVal || r.reference;
        if (key && !seen.has(key)) {
          seen.add(key);
          results.push(r);
        }
      }
    } catch {
      // A failed window shouldn't sink the whole search; carry on with the rest.
    }
  }

  return results;
}

export async function healthCheck(baseUrl: string): Promise<boolean> {
  try {
    await client.get(`${baseUrl}/search.do`, {
      params: { action: "simple" },
      timeout: 5_000,
      responseType: "text",
    });
    return true;
  } catch {
    return false;
  }
}
