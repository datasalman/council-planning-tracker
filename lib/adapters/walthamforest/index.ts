import { CouncilAdapter, SearchParams } from "../types";
import { Application } from "../../types";
import { searchByDateRange, healthCheck } from "./client";
import { transformApplication } from "./transformer";

// Portal caps results at 50 per request — use 7-day chunks to stay well under
const CHUNK_DAYS = 7;

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export class WalthamForestAdapter implements CouncilAdapter {
  readonly councilId = "walthamforest";
  readonly councilName = "Waltham Forest";

  async search(
    params: SearchParams,
    onProgress?: (count: number) => void
  ): Promise<Application[]> {
    const applications: Application[] = [];
    const seen = new Set<string>();

    const rangeStart = new Date(params.dateFrom);
    const rangeEnd = new Date(params.dateTo);

    let chunkStart = new Date(rangeStart);

    while (chunkStart <= rangeEnd) {
      const chunkEnd = addDays(chunkStart, CHUNK_DAYS - 1);
      const effectiveEnd = chunkEnd > rangeEnd ? rangeEnd : chunkEnd;

      const raw = await searchByDateRange(
        toISO(chunkStart),
        toISO(effectiveEnd)
      );

      const chunkDate = new Date(chunkStart);
      for (const item of raw) {
        if (!seen.has(item.reference)) {
          seen.add(item.reference);
          applications.push(
            transformApplication(item, this.councilName, chunkDate)
          );
        }
      }

      onProgress?.(applications.length);
      chunkStart = addDays(chunkStart, CHUNK_DAYS);
    }

    return applications;
  }

  async healthCheck(): Promise<boolean> {
    return healthCheck();
  }
}
