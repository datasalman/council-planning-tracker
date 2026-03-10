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
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Select Boroughs
      </label>
      <div className="border border-gray-200 rounded-lg bg-white">
        <div className="p-3 space-y-2">
          {SUPPORTED_COUNCILS.map((council) => (
            <label
              key={council.id}
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded px-1 py-0.5"
            >
              <input
                type="checkbox"
                checked={selected.includes(council.id)}
                onChange={() => toggleBorough(council.id)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{council.name}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-2 px-3 pb-3">
          <button
            type="button"
            onClick={selectAll}
            className="text-xs text-blue-600 hover:underline"
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
      {selected.length === 0 && (
        <p className="text-xs text-red-500 mt-1">Select at least one borough</p>
      )}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selected.map((id) => {
            const council = SUPPORTED_COUNCILS.find((c) => c.id === id);
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full"
              >
                {council?.name}
                <button
                  type="button"
                  onClick={() => toggleBorough(id)}
                  className="hover:text-blue-600"
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
