"use client";

interface SearchButtonProps {
  onClick: () => void;
  disabled: boolean;
  isLoading: boolean;
}

export function SearchButton({ onClick, disabled, isLoading }: SearchButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`w-full px-4 py-3 text-white font-semibold rounded-xl flex items-center justify-center gap-2 disabled:cursor-not-allowed ${
        disabled || isLoading ? "bg-slate-600/60 opacity-70" : "btn-primary"
      }`}
    >
      {isLoading ? (
        <>
          <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Searching...
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Search
        </>
      )}
    </button>
  );
}
