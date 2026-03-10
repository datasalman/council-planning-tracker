import { createHash } from "crypto";
import { Application } from "../types";
import { SearchParams } from "../adapters/types";

interface CacheEntry {
  key: string;
  data: Application[];
  timestamp: number;
}

const TTL_MS = Number(process.env.CACHE_TTL_MS) || 300_000; // 5 minutes
const MAX_ENTRIES = Number(process.env.CACHE_MAX_ENTRIES) || 20;

const store = new Map<string, CacheEntry>();

function buildCacheKey(params: SearchParams): string {
  const normalized = JSON.stringify({
    boroughs: [...params.boroughs].sort(),
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  });
  return createHash("sha256").update(normalized).digest("hex");
}

export function getCached(params: SearchParams): Application[] | null {
  const key = buildCacheKey(params);
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > TTL_MS) {
    store.delete(key);
    return null;
  }
  return entry.data;
}

export function setCached(params: SearchParams, data: Application[]): void {
  const key = buildCacheKey(params);

  // LRU eviction: remove oldest if at capacity
  if (store.size >= MAX_ENTRIES) {
    const oldestKey = store.keys().next().value;
    if (oldestKey) store.delete(oldestKey);
  }

  store.set(key, { key, data, timestamp: Date.now() });
}

export function clearCache(): void {
  store.clear();
}
