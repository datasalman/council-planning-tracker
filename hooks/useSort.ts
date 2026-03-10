"use client";

import { useState, useMemo } from "react";
import { Application } from "@/lib/types";

export type SortDirection = "asc" | "desc";
export type SortColumn = keyof Application;

export function useSort(applications: Application[]) {
  const [sortColumn, setSortColumn] = useState<SortColumn>("registration_date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const sorted = useMemo(() => {
    return [...applications].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      let comparison = 0;

      if (aVal instanceof Date && bVal instanceof Date) {
        comparison = aVal.getTime() - bVal.getTime();
      } else if (Array.isArray(aVal) && Array.isArray(bVal)) {
        comparison = aVal.join(",").localeCompare(bVal.join(","));
      } else if (typeof aVal === "string" && typeof bVal === "string") {
        comparison = aVal.localeCompare(bVal);
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [applications, sortColumn, sortDirection]);

  const handleSort = (column: SortColumn) => {
    if (column === sortColumn) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  return { sorted, sortColumn, sortDirection, handleSort };
}
