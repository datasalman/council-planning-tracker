"use client";

import { ProgressBar } from "./ProgressBar";
import { ProgressInfo } from "@/hooks/useSearch";

interface ProgressModalProps {
  isOpen: boolean;
  progress: ProgressInfo | null;
  totalBoroughs: number;
  completedBoroughs: number;
  onCancel: () => void;
}

export function ProgressModal({
  isOpen,
  progress,
  totalBoroughs,
  completedBoroughs,
  onCancel,
}: ProgressModalProps) {
  if (!isOpen) return null;

  const percentage =
    totalBoroughs > 0
      ? Math.round(
          ((completedBoroughs + (progress?.status === "fetching" ? 0.5 : 0)) /
            totalBoroughs) *
            100
        )
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Searching Planning Records
        </h2>

        <ProgressBar value={percentage} className="mb-3" />
        <p className="text-sm text-gray-500 text-right mb-4">{percentage}% complete</p>

        {progress && (
          <div className="space-y-3 mb-6">
            {progress.status === "fetching" && (
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <span className="inline-block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span>
                  Querying <strong>{progress.borough}</strong>...
                </span>
              </div>
            )}
            {progress.count > 0 && (
              <p className="text-sm text-gray-600">
                Applications found so far:{" "}
                <strong className="text-gray-900">{progress.count.toLocaleString()}</strong>
              </p>
            )}
          </div>
        )}

        {!progress && (
          <div className="flex items-center gap-3 text-sm text-gray-600 mb-6">
            <span className="inline-block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Connecting to council portal...</span>
          </div>
        )}

        <button
          onClick={onCancel}
          className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Cancel Search
        </button>
      </div>
    </div>
  );
}
