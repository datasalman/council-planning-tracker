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
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Proposal Types
      </label>
      <div className="border border-gray-200 rounded-lg bg-white">
        <div className="p-3 space-y-1.5 max-h-64 overflow-y-auto">
          {ALL_CATEGORIES.map((category) => (
            <label
              key={category}
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded px-1 py-0.5"
            >
              <input
                type="checkbox"
                checked={selected.includes(category)}
                onChange={() => toggle(category)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{category}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-2 px-3 pb-3 border-t border-gray-100 pt-2">
          <button
            type="button"
            onClick={selectAll}
            className={`text-xs hover:underline ${allSelected ? "text-gray-400" : "text-blue-600"}`}
          >
            Select All
          </button>
          <span className="text-xs text-gray-400">|</span>
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-gray-500 hover:underline"
          >
            Clear
          </button>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-1">
        {selected.length === 0
          ? "No filter — all applications will be shown"
          : `${selected.length} of ${ALL_CATEGORIES.length} selected`}
      </p>
    </div>
  );
}
