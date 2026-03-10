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
    executeSearch,
    cancelSearch,
    reset,
  } = useSearch();

  const [lastParams, setLastParams] = useState<SearchParams | null>(null);
  const [proposalTypeFilter, setProposalTypeFilter] = useState<string[]>([]);
  const [completedBoroughs] = useState(0);

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
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Council Planning Tracker</h1>
              <p className="text-xs text-gray-500">London Borough Planning Applications</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main layout */}
      <main
        className="flex-1 max-w-screen-2xl mx-auto w-full px-6 py-6 flex gap-6"
        style={{ minHeight: "calc(100vh - 73px)" }}
      >
        {/* Search Panel */}
        <aside className="w-80 shrink-0">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 h-full">
            <SearchPanel
              onSearch={handleSearch}
              isLoading={status === "fetching"}
            />
          </div>
        </aside>

        {/* Results Panel */}
        <section className="flex-1 min-w-0 overflow-hidden">
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
        onCancel={cancelSearch}
      />
    </div>
  );
}
