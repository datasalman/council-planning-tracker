"use client";

import { SortColumn, SortDirection } from "@/hooks/useSort";
import { Application } from "@/lib/types";

interface ColumnHeaderProps {
  label: string;
  column: keyof Application;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  onSort: (column: SortColumn) => void;
  className?: string;
}

export function ColumnHeader({
  label,
  column,
  sortColumn,
  sortDirection,
  onSort,
  className = "",
}: ColumnHeaderProps) {
  const isActive = sortColumn === column;

  return (
    <th
      className={`px-3 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-blue-700 select-none whitespace-nowrap ${className}`}
      onClick={() => onSort(column)}
    >
      <div className="flex items-center gap-1">
        {label}
        <span className="text-blue-300">
          {isActive ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}
        </span>
      </div>
    </th>
  );
}
