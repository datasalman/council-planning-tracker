"use client";

import {
  CATEGORY_NAMES,
  BUILDABLE_CATEGORIES,
  GROUP_ORDER,
  GROUP_LABELS,
  categoriesInGroup,
  type CategoryGroup,
} from "@/lib/classifiers/meta";

interface ProposalTypeFilterProps {
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function ProposalTypeFilter({ selected, onChange }: ProposalTypeFilterProps) {
  const selectedSet = new Set(selected);
  const allSelected = selected.length === CATEGORY_NAMES.length;
  const buildableActive =
    selected.length === BUILDABLE_CATEGORIES.length &&
    BUILDABLE_CATEGORIES.every((c) => selectedSet.has(c));

  const toggle = (category: string) => {
    if (selectedSet.has(category)) {
      onChange(selected.filter((c) => c !== category));
    } else {
      onChange([...selected, category]);
    }
  };

  const toggleGroup = (group: CategoryGroup) => {
    const inGroup = categoriesInGroup(group);
    const allOn = inGroup.every((c) => selectedSet.has(c));
    if (allOn) {
      onChange(selected.filter((c) => !inGroup.includes(c)));
    } else {
      onChange([...new Set([...selected, ...inGroup])]);
    }
  };

  const buildableOnly = () => onChange([...BUILDABLE_CATEGORIES]);
  const selectAll = () => onChange([...CATEGORY_NAMES]);
  const clearAll = () => onChange([]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-semibold text-white/90">
          Proposal Types
        </label>
        <button
          type="button"
          onClick={buildableOnly}
          className={`text-xs font-medium px-2 py-0.5 rounded-full border transition-colors ${
            buildableActive
              ? "bg-emerald-400/20 border-emerald-300/40 text-emerald-200"
              : "border-white/15 text-white/60 hover:text-white/90 hover:border-white/30"
          }`}
        >
          Buildable jobs only
        </button>
      </div>

      <div className="rounded-xl bg-white/5 border border-white/10">
        <div className="p-3 space-y-3 max-h-60 overflow-y-auto">
          {GROUP_ORDER.map((group) => {
            const inGroup = categoriesInGroup(group);
            const groupCount = inGroup.filter((c) => selectedSet.has(c)).length;
            const allOn = groupCount === inGroup.length;
            return (
              <div key={group}>
                <button
                  type="button"
                  onClick={() => toggleGroup(group)}
                  className="w-full flex items-center justify-between text-left mb-1 group/header"
                >
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-white/40 group-hover/header:text-white/70 transition-colors">
                    {GROUP_LABELS[group]}
                  </span>
                  <span className="text-[11px] text-white/30 group-hover/header:text-white/60 transition-colors">
                    {allOn ? "Clear" : "All"} · {groupCount}/{inGroup.length}
                  </span>
                </button>
                <div className="space-y-1.5">
                  {inGroup.map((category) => (
                    <label
                      key={category}
                      className="flex items-center gap-2.5 cursor-pointer hover:bg-white/5 rounded-lg px-2 py-1 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSet.has(category)}
                        onChange={() => toggle(category)}
                        className="dark-checkbox w-4 h-4 rounded border-white/20"
                      />
                      <span className="text-sm text-white/80">{category}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-2 px-3 pb-3 border-t border-white/10 pt-2">
          <button
            type="button"
            onClick={selectAll}
            className={`text-xs transition-colors ${allSelected ? "text-white/30" : "text-indigo-300 hover:text-indigo-200"}`}
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
      <p className="text-xs text-white/40 mt-1.5">
        {selected.length === 0
          ? "No filter applied, showing every application"
          : `${selected.length} of ${CATEGORY_NAMES.length} selected`}
      </p>
    </div>
  );
}
