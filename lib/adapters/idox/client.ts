import axios from "axios";

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

// ─── Date helpers ────────────────────────────────────────────────────────────

/** Return the ISO YYYY-MM-DD for the Monday of the week containing `date`. */
function weekMonday(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay(); // 0 = Sun
  d.setDate(d.getDate() + (dow === 0 ? -6 : 1 - dow));
  return d;
}

/** ISO YYYY-MM-DD → Idox DD-MM-YYYY */
function isoToIdox(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
}

/** Return DD-MM-YYYY strings for all Monday week-starts overlapping [from, to]. */
function weeksInRange(dateFrom: string, dateTo: string): string[] {
  const start = weekMonday(new Date(dateFrom));
  const end = new Date(dateTo);
  const weeks: string[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    weeks.push(isoToIdox(cur.toISOString().slice(0, 10)));
    cur.setDate(cur.getDate() + 7);
  }
  return weeks;
}

// ─── HTML parser ─────────────────────────────────────────────────────────────

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

    // Reference: "Ref. No: 26/0425" — from metaInfo (most reliable)
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
    const receivedMatch = meta.match(
      /Received:?\s*(?:\w{3,}\s+)?(\d{1,2}\s+\w+\s+\d{4})/i
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

/** Extract page numbers > 1 from pagination links in HTML. */
function extractExtraPageNums(html: string): number[] {
  const nums = new Set<number>();
  const re = /searchCriteria\.page=(\d+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const n = parseInt(m[1], 10);
    if (n > 1) nums.add(n);
  }
  return Array.from(nums).sort((a, b) => a - b);
}

// ─── HTTP fetching ────────────────────────────────────────────────────────────

async function fetchOneWeek(
  baseUrl: string,
  weekDate: string
): Promise<RawIdoxApplication[]> {
  // Request 100 results per page to minimise pagination round-trips
  const firstResp = await axios.get<string>(`${baseUrl}/weeklyListResults.do`, {
    params: {
      action: "firstPage",
      week: weekDate,
      searchType: "Application",
      dateType: "DC_Validated",
      resultsPerPage: 100,
    },
    headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
    timeout: TIMEOUT_MS,
    responseType: "text",
  });

  // Capture session cookie so pagination requests stay in the same search session
  const sessionCookie = ((firstResp.headers["set-cookie"] as string[] | undefined) ?? [])
    .map((c) => c.split(";")[0])
    .join("; ");

  const results = parseResultsHtml(firstResp.data);

  // Fetch any remaining pages (shouldn't happen with resultsPerPage=100, but safe)
  const extraPages = extractExtraPageNums(firstResp.data);
  for (const pgno of extraPages) {
    try {
      const pageResp = await axios.get<string>(
        `${baseUrl}/pagedSearchResults.do`,
        {
          params: { action: "page", "searchCriteria.page": pgno },
          headers: {
            "User-Agent": UA,
            Accept: "text/html,application/xhtml+xml",
            Cookie: sessionCookie,
          },
          timeout: TIMEOUT_MS,
          responseType: "text",
        }
      );
      results.push(...parseResultsHtml(pageResp.data));
    } catch {
      break; // pagination failure → return what we have
    }
  }

  return results;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function searchByDateRange(
  baseUrl: string,
  dateFrom: string,
  dateTo: string
): Promise<RawIdoxApplication[]> {
  const weeks = weeksInRange(dateFrom, dateTo);
  const seen = new Set<string>();
  const results: RawIdoxApplication[] = [];

  for (const week of weeks) {
    try {
      const weekResults = await fetchOneWeek(baseUrl, week);
      for (const r of weekResults) {
        const key = r.keyVal || r.reference;
        if (key && !seen.has(key)) {
          seen.add(key);
          results.push(r);
        }
      }
    } catch {
      // skip failed weeks, continue with the rest
    }
  }

  return results;
}

export async function healthCheck(baseUrl: string): Promise<boolean> {
  try {
    await axios.get(`${baseUrl}/search.do`, {
      params: { action: "simple" },
      timeout: 5_000,
      responseType: "text",
    });
    return true;
  } catch {
    return false;
  }
}
