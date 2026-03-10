import axios from "axios";

const BASE_URL =
  "https://placehub.walthamforest.gov.uk/planning/index.html";
const TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS) || 30_000;

export interface RawWalthamForestApplication {
  reference: string;
  applicationType: string;
  location: string;
  proposal: string;
  ward: string;
}

/** Convert ISO YYYY-MM-DD to the portal's DD-MM-YYYY format */
function toPortalDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}-${month}-${year}`;
}

/** Parse the HTML results table into raw application objects */
function parseResultsHTML(html: string): RawWalthamForestApplication[] {
  const results: RawWalthamForestApplication[] = [];

  // Target specifically the application results table (not nav/form tables)
  const tableMatch = html.match(
    /<table[^>]+id="application_results_table"[^>]*>([\s\S]*?)<\/table>/i
  );
  if (!tableMatch) {
    // Detect actual WAF challenge pages (short responses with no portal chrome).
    // Normal portal pages always contain "Waltham Forest Direct" in their title;
    // a real AWS WAF challenge page is much shorter and won't have portal content.
    const isChallengePage =
      html.length < 20_000 &&
      !html.includes("Waltham Forest Direct") &&
      (html.includes("AWSWAFChallengeResponse") ||
        html.includes("awswaf-challenge") ||
        html.includes("Request blocked"));
    if (isChallengePage) {
      throw new Error(
        "Waltham Forest: WAF challenge page received — retry later"
      );
    }
    return results; // genuine empty result set
  }

  const tbodyMatch = tableMatch[1].match(/<tbody>([\s\S]*?)<\/tbody>/i);
  if (!tbodyMatch) return results;

  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch: RegExpExecArray | null;

  while ((rowMatch = rowRegex.exec(tbodyMatch[1])) !== null) {
    const rowHtml = rowMatch[1];
    const cells: Record<string, string> = {};

    const cellRegex =
      /<td[^>]*data-label="([^"]+)"[^>]*>([\s\S]*?)<\/td>/gi;
    let cellMatch: RegExpExecArray | null;

    while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
      const label = cellMatch[1];
      const content = cellMatch[2]
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      cells[label] = content;
    }

    const ref = cells["Application Reference"]?.trim();
    if (ref) {
      results.push({
        reference: ref,
        applicationType: cells["Application Type"] || "",
        location: cells["Location Details"] || "",
        proposal: cells["Proposal"] || "",
        ward: cells["Ward"] || "",
      });
    }
  }

  return results;
}

export async function searchByDateRange(
  dateFrom: string,
  dateTo: string
): Promise<RawWalthamForestApplication[]> {
  const body = new URLSearchParams({
    fa: "search",
    submitted: "true",
    received_date_from: toPortalDate(dateFrom),
    received_date_to: toPortalDate(dateTo),
  });

  const response = await axios.post<string>(BASE_URL, body.toString(), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "text/html,application/xhtml+xml",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    timeout: TIMEOUT_MS,
    responseType: "text",
  });

  return parseResultsHTML(response.data);
}

export async function healthCheck(): Promise<boolean> {
  try {
    await axios.get(BASE_URL, { timeout: 5_000, responseType: "text" });
    return true;
  } catch {
    return false;
  }
}
