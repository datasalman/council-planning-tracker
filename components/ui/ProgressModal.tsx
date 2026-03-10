"use client";

import { ProgressBar } from "./ProgressBar";
import { ProgressInfo } from "@/hooks/useSearch";
import { SUPPORTED_COUNCILS } from "@/lib/adapters";

interface ProgressModalProps {
  isOpen: boolean;
  progress: ProgressInfo | null;
  totalBoroughs: number;
  completedBoroughs: number;
  boroughIds: string[];
  onCancel: () => void;
}

type BoroughStatus = "pending" | "fetching" | "complete";

function getBoroughStatus(
  boroughId: string,
  boroughIds: string[],
  completedBoroughs: number,
  progress: ProgressInfo | null
): BoroughStatus {
  const idx = boroughIds.indexOf(boroughId);
  if (idx < 0) return "pending";
  if (idx < completedBoroughs) return "complete";
  if (idx === completedBoroughs && progress?.status === "fetching") return "fetching";
  return "pending";
}

export function ProgressModal({
  isOpen,
  progress,
  totalBoroughs,
  completedBoroughs,
  boroughIds,
  onCancel,
}: ProgressModalProps) {
  if (!isOpen) return null;

  const percentage =
    totalBoroughs > 0
      ? Math.round(
        ((completedBoroughs + (progress?.status === "fetching" ? 0.3 : 0)) /
          totalBoroughs) *
        100
      )
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Searching Planning Records
            </h2>
            <p className="text-xs text-gray-500">
              {percentage}% complete · {progress?.count?.toLocaleString() ?? 0} applications found
            </p>
          </div>
        </div>

        <ProgressBar value={percentage} className="mb-5" />

        {/* Per-borough step list */}
        <div className="space-y-1.5 mb-6 max-h-48 overflow-y-auto">
          {boroughIds.map((id) => {
            const council = SUPPORTED_COUNCILS.find((c) => c.id === id);
            const status = getBoroughStatus(id, boroughIds, completedBoroughs, progress);

            return (
              <div
                key={id}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${status === "fetching"
                    ? "bg-blue-50 text-blue-700"
                    : status === "complete"
                      ? "bg-gray-50 text-gray-500"
                      : "text-gray-400"
                  }`}
              >
                {/* Status icon */}
                {status === "complete" && (
                  <svg className="w-4 h-4 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {status === "fetching" && (
                  <span className="inline-block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
                )}
                {status === "pending" && (
                  <span className="w-4 h-4 rounded-full border-2 border-gray-300 shrink-0" />
                )}

                <span className={status === "fetching" ? "font-medium" : ""}>
                  {council?.name ?? id}
                </span>
              </div>
            );
          })}
        </div>

        <button
          onClick={onCancel}
          className="w-full px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
        >
          Cancel Search
        </button>
      </div>
    </div>
  );
}
