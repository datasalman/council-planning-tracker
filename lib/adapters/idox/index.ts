import { CouncilAdapter, SearchParams } from "../types";
import { Application } from "../../types";
import { searchByDateRange, healthCheck } from "./client";
import { transformApplication } from "./transformer";

/**
 * Whether an Idox "received" date (e.g. "19 May 2026") falls within the
 * inclusive [fromIso, toIso] window, where the bounds are "YYYY-MM-DD".
 *
 * The comparison is done on the calendar day rather than on Date objects: an
 * Idox date parses to local midnight while "2026-05-19" parses to UTC midnight,
 * and during BST that hour of slack used to drop applications received on the
 * first day of the window. An empty or unparseable date is kept (not excluded),
 * matching the portal's own behaviour of listing it.
 */
export function inDateWindow(
  receivedDate: string,
  fromIso: string,
  toIso: string
): boolean {
  if (!receivedDate) return true;
  const d = new Date(receivedDate);
  if (isNaN(d.getTime())) return true;
  const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return iso >= fromIso && iso <= toIso;
}

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
    const raw = await searchByDateRange(
      this.baseUrl,
      params.dateFrom,
      params.dateTo
    );

    const results: Application[] = [];
    for (const item of raw) {
      // The validated-date search can spill past the requested window, so trim
      // to the exact range on the application's received date.
      if (!inDateWindow(item.receivedDate, params.dateFrom, params.dateTo)) continue;

      results.push(transformApplication(item, this.councilName, this.baseUrl));
    }

    onProgress?.(results.length);
    return results;
  }

  async healthCheck(): Promise<boolean> {
    return healthCheck(this.baseUrl);
  }
}
