import axios, { AxiosInstance } from "axios";

const BASE_URL = "https://planningapi.agileapplications.co.uk";
const SEARCH_ENDPOINT = "/api/application/search";
const TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS) || 30_000;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export interface RawAgileApplication {
  id: number;
  reference: string;
  webReference: string;
  applicationType: string;
  proposal: string;
  location: string;
  registrationDate: string;
  validDate: string;
  decisionDate: string | null;
  agentName: string;
  [key: string]: unknown;
}

export interface AgileSearchResponse {
  total: number;
  results: RawAgileApplication[];
}

export class AgileApplicationsClient {
  private readonly http: AxiosInstance;

  constructor(clientCode: string, portalBaseUrl?: string) {
    const origin = portalBaseUrl ? new URL(portalBaseUrl).origin : undefined;

    this.http = axios.create({
      baseURL: BASE_URL,
      timeout: TIMEOUT_MS,
      headers: {
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "en-GB,en;q=0.9",
        "User-Agent": UA,
        "x-client": clientCode,
        "x-product": "CITIZENPORTAL",
        "x-service": "PA",
        ...(origin && {
          Origin: origin,
          Referer: `${portalBaseUrl}/`,
        }),
      },
    });
  }

  async search(
    dateFrom: string,
    dateTo: string,
    onProgress?: (count: number) => void
  ): Promise<RawAgileApplication[]> {
    const response = await this.http.get<AgileSearchResponse>(
      SEARCH_ENDPOINT,
      {
        params: {
          status: "registered",
          registrationDateFrom: `${dateFrom}T00:00:00+00:00`,
          registrationDateTo: `${dateTo}T23:59:59+00:00`,
        },
      }
    );

    const results = response.data?.results ?? [];
    onProgress?.(results.length);
    return results;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.http.get("/api/system/checkserver");
      return true;
    } catch {
      return false;
    }
  }
}
