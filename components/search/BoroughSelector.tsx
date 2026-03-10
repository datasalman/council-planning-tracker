"use client";

import { SUPPORTED_COUNCILS } from "@/lib/adapters";

interface BoroughSelectorProps {
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function BoroughSelector({ selected, onChange }: BoroughSelectorProps) {
  const toggleBorough = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((b) => b !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const selectAll = () => onChange(SUPPORTED_COUNCILS.map((c) => c.id));
  const clearAll = () => onChange([]);

  return (
    <div>
      <label className="block text-sm font-semibold text-white/90 mb-2">
        Select Boroughs
      </label>
      <div className="rounded-xl bg-white/5 border border-white/10">
        <div className="p-3 space-y-1.5">
          {SUPPORTED_COUNCILS.map((council) => (
            <label
              key={council.id}
              className="flex items-center gap-2.5 cursor-pointer hover:bg-white/5 rounded-lg px-2 py-1.5 transition-colors"
            >
              <input
                type="checkbox"
                checked={selected.includes(council.id)}
                onChange={() => toggleBorough(council.id)}
                className="dark-checkbox w-4 h-4 rounded border-white/20"
              />
              <span className="text-sm text-white/80">{council.name}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-2 px-3 pb-3">
          <button
            type="button"
            onClick={selectAll}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
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
      {selected.length === 0 && (
        <p className="text-xs text-red-400 mt-1.5">Select at least one borough</p>
      )}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selected.map((id) => {
            const council = SUPPORTED_COUNCILS.find((c) => c.id === id);
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1 bg-blue-500/20 text-blue-300 text-xs font-medium px-2 py-0.5 rounded-full border border-blue-500/20"
              >
                {council?.name}
                <button
                  type="button"
                  onClick={() => toggleBorough(id)}
                  className="hover:text-blue-200 transition-colors"
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
