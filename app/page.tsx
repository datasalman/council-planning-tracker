"use client";

import { useState, useCallback } from "react";
import { SearchPanel } from "@/components/layout/SearchPanel";
import { ResultsPanel } from "@/components/layout/ResultsPanel";
import { ProgressModal } from "@/components/ui/ProgressModal";
import { useSearch } from "@/hooks/useSearch";
import { SearchParams } from "@/lib/adapters/types";

export default function Home() {
  const {
    status,
    applications,
    progress,
    error,
    isFromCache,
    totalCount,
    completedBoroughs,
    executeSearch,
    cancelSearch,
    reset,
  } = useSearch();

  const [lastParams, setLastParams] = useState<SearchParams | null>(null);
  const [proposalTypeFilter, setProposalTypeFilter] = useState<string[]>([]);

  const handleSearch = useCallback(
    (params: SearchParams, proposalFilter: string[]) => {
      setLastParams(params);
      setProposalTypeFilter(proposalFilter);
      executeSearch(params);
    },
    [executeSearch]
  );

  const totalBoroughs = lastParams?.boroughs.length ?? 1;

  return (
    <div className="h-screen overflow-hidden flex flex-col" style={{ background: "linear-gradient(135deg, #f0f4ff 0%, #e8edf5 50%, #f5f3ff 100%)" }}>
      {/* Header */}
      <header className="mx-4 mt-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.5)", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">Council Planning Tracker</h1>
              <p className="text-xs text-gray-500 font-medium">London Borough Planning Applications</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main layout */}
      <main className="flex-1 max-w-screen-2xl mx-auto w-full px-4 py-4 flex gap-4 min-h-0">
        {/* Search Panel — dark sidebar */}
        <aside className="w-80 shrink-0">
          <div className="p-5 h-full rounded-2xl overflow-hidden" style={{ background: "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 4px 24px rgba(0,0,0,0.12)" }}>
            <SearchPanel
              onSearch={handleSearch}
              isLoading={status === "fetching"}
            />
          </div>
        </aside>

        {/* Results Panel */}
        <section className="flex-1 min-w-0 overflow-auto">
          <ResultsPanel
            applications={applications}
            params={lastParams}
            status={status}
            error={error}
            isFromCache={isFromCache}
            totalCount={totalCount}
            proposalTypeFilter={proposalTypeFilter}
            onDismissError={reset}
          />
        </section>
      </main>

      {/* Progress Modal */}
      <ProgressModal
        isOpen={status === "fetching"}
        progress={progress}
        totalBoroughs={totalBoroughs}
        completedBoroughs={completedBoroughs}
        boroughIds={lastParams?.boroughs ?? []}
        onCancel={cancelSearch}
      />
    </div>
  );
}
