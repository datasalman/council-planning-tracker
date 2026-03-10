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

// ─── Date helpers ────────────────────────────────────────────────────────────

/** ISO YYYY-MM-DD → Idox DD/MM/YYYY */
function isoToIdoxSlash(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/** Break [dateFrom, dateTo] into chunks of max `maxDays` days. Returns inclusive pairs [start, end]. */
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
      isoToIdoxSlash(cur.toISOString().slice(0, 10)),
      isoToIdoxSlash(chunkEnd.toISOString().slice(0, 10))
    ]);
    cur = new Date(chunkEnd);
    cur.setDate(cur.getDate() + 1);
  }
  return chunks;
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

async function fetchAdvancedSearchChunk(
  baseUrl: string,
  startSlash: string,
  endSlash: string
): Promise<RawIdoxApplication[]> {
  // 1. Establish session
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

  // 2. Submit advanced search POST
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

  const results = parseResultsHtml(firstResp.data);

  // 3. Fetch any remaining pages
  const extraPages = extractExtraPageNums(firstResp.data);
  for (const pgno of extraPages) {
    try {
      const pageResp = await client.get<string>(
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
  const chunks = dateChunks(dateFrom, dateTo, 30);
  const seen = new Set<string>();
  const results: RawIdoxApplication[] = [];

  for (const [startSlash, endSlash] of chunks) {
    try {
      const chunkResults = await fetchAdvancedSearchChunk(baseUrl, startSlash, endSlash);
      for (const r of chunkResults) {
        const key = r.keyVal || r.reference;
        if (key && !seen.has(key)) {
          seen.add(key);
          results.push(r);
        }
      }
    } catch (err) {
      // skip failed chunks, continue with the rest
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
