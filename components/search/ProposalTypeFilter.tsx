"use client";

import categories from "@/lib/classifiers/categories.json";

const ALL_CATEGORIES = Object.keys(categories);

interface ProposalTypeFilterProps {
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function ProposalTypeFilter({ selected, onChange }: ProposalTypeFilterProps) {
  const allSelected = selected.length === ALL_CATEGORIES.length;

  const toggle = (category: string) => {
    if (selected.includes(category)) {
      onChange(selected.filter((c) => c !== category));
    } else {
      onChange([...selected, category]);
    }
  };

  const selectAll = () => onChange([...ALL_CATEGORIES]);
  const clearAll = () => onChange([]);

  return (
    <div>
      <label className="block text-sm font-semibold text-white/90 mb-2">
        Proposal Types
      </label>
      <div className="rounded-xl bg-white/5 border border-white/10">
        <div className="p-3 space-y-1.5 max-h-52 overflow-y-auto">
          {ALL_CATEGORIES.map((category) => (
            <label
              key={category}
              className="flex items-center gap-2.5 cursor-pointer hover:bg-white/5 rounded-lg px-2 py-1 transition-colors"
            >
              <input
                type="checkbox"
                checked={selected.includes(category)}
                onChange={() => toggle(category)}
                className="dark-checkbox w-4 h-4 rounded border-white/20"
              />
              <span className="text-sm text-white/80">{category}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-2 px-3 pb-3 border-t border-white/10 pt-2">
          <button
            type="button"
            onClick={selectAll}
            className={`text-xs transition-colors ${allSelected ? "text-white/30" : "text-blue-400 hover:text-blue-300"}`}
          >
            Select All
          </button>
          <span className="text-xs text-white/20">|</span>
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-white/40 hover:text-white/60 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
      <p className="text-xs text-white/30 mt-1">
        {selected.length === 0
          ? "No filter — all applications shown"
          : `${selected.length} of ${ALL_CATEGORIES.length} selected`}
      </p>
    </div>
  );
}
