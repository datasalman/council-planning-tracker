import { CouncilAdapter, SearchParams } from "../types";
import { Application } from "../../types";
import { searchByDateRange, healthCheck } from "./client";
import { transformApplication } from "./transformer";

export class IdoxAdapter implements CouncilAdapter {
  readonly councilId: string;
  readonly councilName: string;
  private readonly baseUrl: string;

  /**
   * @param councilId   Machine-readable ID, e.g. "towerhamlets"
   * @param councilName Display name, e.g. "Tower Hamlets"
   * @param baseUrl     Idox online-applications root, e.g.
   *                    "https://development.towerhamlets.gov.uk/online-applications"
   */
  constructor(councilId: string, councilName: string, baseUrl: string) {
    this.councilId = councilId;
    this.councilName = councilName;
    this.baseUrl = baseUrl;
  }

  async search(
    params: SearchParams,
    onProgress?: (count: number) => void
  ): Promise<Application[]> {
    const rangeStart = new Date(params.dateFrom);
    const rangeEnd = new Date(params.dateTo);

    const raw = await searchByDateRange(
      this.baseUrl,
      params.dateFrom,
      params.dateTo
    );

    const results: Application[] = [];
    for (const item of raw) {
      // Filter to exact date range — weekly fetches can include edge-of-week results
      const date = item.receivedDate ? new Date(item.receivedDate) : null;
      if (date && (date < rangeStart || date > rangeEnd)) continue;

      results.push(transformApplication(item, this.councilName, this.baseUrl));
    }

    onProgress?.(results.length);
    return results;
  }

  async healthCheck(): Promise<boolean> {
    return healthCheck(this.baseUrl);
  }
}
