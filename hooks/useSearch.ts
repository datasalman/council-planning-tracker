"use client";

import { useState, useCallback, useRef } from "react";
import { Application } from "@/lib/types";
import { SearchParams } from "@/lib/adapters/types";

export type SearchStatus = "idle" | "fetching" | "complete" | "error";

export interface ProgressInfo {
  borough: string;
  status: "fetching" | "complete";
  count: number;
}

export interface SearchState {
  status: SearchStatus;
  applications: Application[];
  progress: ProgressInfo | null;
  error: string | null;
  isFromCache: boolean;
  totalCount: number;
  completedBoroughs: number;
}

export function useSearch() {
  const [state, setState] = useState<SearchState>({
    status: "idle",
    applications: [],
    progress: null,
    error: null,
    isFromCache: false,
    totalCount: 0,
    completedBoroughs: 0,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const executeSearch = useCallback(async (params: SearchParams) => {
    // Cancel any in-flight search
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setState({
      status: "fetching",
      applications: [],
      progress: null,
      error: null,
      isFromCache: false,
      totalCount: 0,
      completedBoroughs: 0,
    });

    try {
      const encoded = encodeURIComponent(JSON.stringify(params));
      const response = await fetch(`/api/search?params=${encoded}`, {
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Search request failed: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;

          let event: Record<string, unknown>;
          try {
            event = JSON.parse(trimmed.slice(6));
          } catch {
            continue;
          }

          switch (event.type) {
            case "cached":
              setState({
                status: "complete",
                applications: event.data as Application[],
                progress: null,
                error: null,
                isFromCache: true,
                totalCount: (event.total as number) || 0,
                completedBoroughs: 0,
              });
              break;

            case "progress": {
              const progStatus = event.status as "fetching" | "complete" | "enriching";
              setState((s) => ({
                ...s,
                progress: {
                  borough: event.borough as string,
                  status: progStatus === "enriching" ? "fetching" : progStatus,
                  count: event.count as number,
                },
                completedBoroughs:
                  progStatus === "complete"
                    ? s.completedBoroughs + 1
                    : s.completedBoroughs,
              }));
              break;
            }

            case "complete":
              setState((s) => ({
                ...s,
                status: "complete",
                applications: event.data as Application[],
                progress: null,
                error: null,
                isFromCache: false,
                totalCount: (event.total as number) || 0,
              }));
              break;

            case "error":
              setState((s) => ({
                ...s,
                status: "error",
                error: event.message as string,
              }));
              break;
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        setState((s) => ({ ...s, status: "idle" }));
        return;
      }
      const message = err instanceof Error ? err.message : "Search failed";
      setState((s) => ({ ...s, status: "error", error: message }));
    }
  }, []);

  const cancelSearch = useCallback(() => {
    abortControllerRef.current?.abort();
    setState((s) => ({ ...s, status: "idle", progress: null, completedBoroughs: 0 }));
  }, []);

  const reset = useCallback(() => {
    setState({
      status: "idle",
      applications: [],
      progress: null,
      error: null,
      isFromCache: false,
      totalCount: 0,
      completedBoroughs: 0,
    });
  }, []);

  return { ...state, executeSearch, cancelSearch, reset };
}
