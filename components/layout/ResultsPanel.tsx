"use client";

import { Application } from "@/lib/types";
import { SearchParams } from "@/lib/adapters/types";
import { ResultsTable } from "@/components/results/ResultsTable";
import { ExportButton } from "@/components/results/ExportButton";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { BoroughError, SearchStatus } from "@/hooks/useSearch";

interface ResultsPanelProps {
  applications: Application[];
  params: SearchParams | null;
  status: SearchStatus;
  error: string | null;
  boroughErrors: BoroughError[];
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
    <div className="flex flex-wrap gap-1.5">
      {sorted.map(([cat, count]) => {
        const colorClass = categoryColors[cat] ?? "bg-slate-100 text-slate-600";
        return (
          <span key={cat} className={`text-xs font-medium px-2.5 py-1 rounded-full ${colorClass}`}>
            {cat}: <strong>{count}</strong>
          </span>
        );
      })}
    </div>
  );
}

function PartialFailureBanner({ failures }: { failures: BoroughError[] }) {
  if (failures.length === 0) return null;
  return (
    <div className="surface-card rounded-xl px-4 py-3 flex items-start gap-3 animate-fade-in-up">
      <svg className="w-5 h-5 mt-0.5 shrink-0 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      <div className="text-sm">
        <p className="font-semibold text-slate-800">
          Couldn&apos;t reach {failures.length} {failures.length === 1 ? "council" : "councils"}
        </p>
        <p className="text-slate-500 mt-0.5">
          {failures.map((f) => f.borough).join(", ")} didn&apos;t respond. The results below cover the rest.
        </p>
      </div>
    </div>
  );
}

export function ResultsPanel({
  applications,
  params,
  error,
  boroughErrors,
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
      {applications.length > 0 && (
        <div className="surface-card rounded-xl p-4 space-y-2.5 animate-fade-in-up">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-baseline gap-2.5">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {displayCount.toLocaleString()}
              </h2>
              <span className="text-sm font-medium text-slate-500">
                {hasFilter ? "matching applications" : "applications found"}
              </span>
              {hasFilter && displayCount !== totalCount && (
                <span className="text-xs text-slate-400">
                  of {totalCount.toLocaleString()} total
                </span>
              )}
              {isFromCache && (
                <span className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-full font-medium border border-indigo-100">
                  Cached
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

      {error && <ErrorBanner message={error} onDismiss={onDismissError} />}
      <PartialFailureBanner failures={boroughErrors} />

      <div className="surface-card flex-1 rounded-xl overflow-hidden min-h-0">
        <ResultsTable
          applications={applications}
          proposalTypeFilter={proposalTypeFilter}
        />
      </div>
    </div>
  );
}
