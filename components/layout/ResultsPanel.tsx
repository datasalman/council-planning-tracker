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

  const categoryColors: Record<string, string> = {
    "Loft Conversions": "bg-violet-100 text-violet-700",
    "Rear Extensions": "bg-emerald-100 text-emerald-700",
    "Side Extensions": "bg-amber-100 text-amber-700",
    "Change of Use": "bg-rose-100 text-rose-700",
    "Front Extensions": "bg-sky-100 text-sky-700",
    "Dormer Windows": "bg-indigo-100 text-indigo-700",
    "Two-Storey Extensions": "bg-orange-100 text-orange-700",
    "Hip-to-Gable": "bg-teal-100 text-teal-700",
  };

  return (
    <div className="flex flex-wrap gap-2">
      {sorted.map(([cat, count]) => {
        const colorClass = categoryColors[cat] ?? "bg-gray-100 text-gray-600";
        return (
          <span key={cat} className={`text-xs font-medium px-2.5 py-1 rounded-full ${colorClass}`}>
            {cat}: <strong>{count}</strong>
          </span>
        );
      })}
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
  // Apply the same client-side filter to get the filtered count
  const filteredApps =
    proposalTypeFilter.length === 0
      ? applications
      : applications.filter((app) =>
        proposalTypeFilter.some((pt) => app.proposal_category.includes(pt))
      );
  const displayCount = filteredApps.length;
  const hasFilter = proposalTypeFilter.length > 0;

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Stats bar */}
      {applications.length > 0 && (
        <div className="rounded-xl p-4 space-y-2" style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.5)", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-gray-900">
                {displayCount.toLocaleString()} Applications{hasFilter ? " Match" : " Found"}
              </h2>
              {hasFilter && displayCount !== totalCount && (
                <span className="text-xs text-gray-400 font-normal">
                  of {totalCount.toLocaleString()} total
                </span>
              )}
              {isFromCache && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full font-medium">
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
      <div className="flex-1 rounded-xl overflow-hidden min-h-0" style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.5)", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
        <ResultsTable
          applications={applications}
          proposalTypeFilter={proposalTypeFilter}
        />
      </div>
    </div>
  );
}
