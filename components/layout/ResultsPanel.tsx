"use client";

import { Application } from "@/lib/types";
import { SearchParams } from "@/lib/adapters/types";
import { ResultsTable } from "@/components/results/ResultsTable";
import { ExportButton } from "@/components/results/ExportButton";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { SearchStatus } from "@/hooks/useSearch";

interface ResultsPanelProps {
  applications: Application[];
  params: SearchParams | null;
  status: SearchStatus;
  error: string | null;
  isFromCache: boolean;
  totalCount: number;
  proposalTypeFilter: string[];
  onDismissError: () => void;
}

function CategoryBreakdown({ applications }: { applications: Application[] }) {
  const counts: Record<string, number> = {};
  for (const app of applications) {
    for (const cat of app.proposal_category) {
      counts[cat] = (counts[cat] || 0) + 1;
    }
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  if (sorted.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {sorted.map(([cat, count]) => (
        <span key={cat} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
          {cat}: <strong>{count}</strong>
        </span>
      ))}
    </div>
  );
}

export function ResultsPanel({
  applications,
  params,
  status,
  error,
  isFromCache,
  totalCount,
  proposalTypeFilter,
  onDismissError,
}: ResultsPanelProps) {
  return (
    <div className="h-full flex flex-col gap-3">
      {/* Stats bar */}
      {applications.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-gray-900">
                {totalCount.toLocaleString()} Applications Found
              </h2>
              {isFromCache && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                  From cache
                </span>
              )}
            </div>
            {params && (
              <ExportButton
                applications={applications}
                params={params}
              />
            )}
          </div>
          <CategoryBreakdown applications={applications} />
        </div>
      )}

      {/* Error */}
      {error && (
        <ErrorBanner message={error} onDismiss={onDismissError} />
      )}

      {/* Results table */}
      <div className="flex-1 bg-white border border-gray-200 rounded-lg overflow-hidden min-h-0">
        <ResultsTable
          applications={applications}
          proposalTypeFilter={proposalTypeFilter}
        />
      </div>
    </div>
  );
}
