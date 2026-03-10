"use client";

import { useState } from "react";
import { BoroughSelector } from "@/components/search/BoroughSelector";
import { DateRangePicker } from "@/components/search/DateRangePicker";
import { ProposalTypeFilter } from "@/components/search/ProposalTypeFilter";
import { SearchButton } from "@/components/search/SearchButton";
import { SearchParams } from "@/lib/adapters/types";

function toISODate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function subDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

interface SearchPanelProps {
  onSearch: (params: SearchParams, proposalFilter: string[]) => void;
  isLoading: boolean;
}

export function SearchPanel({ onSearch, isLoading }: SearchPanelProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [selectedBoroughs, setSelectedBoroughs] = useState<string[]>(["redbridge"]);
  const [dateFrom, setDateFrom] = useState(toISODate(subDays(today, 30)));
  const [dateTo, setDateTo] = useState(toISODate(today));
  const [proposalTypes, setProposalTypes] = useState<string[]>([]);

  const canSearch = selectedBoroughs.length > 0 && dateFrom && dateTo && !isLoading;

  const handleSearch = () => {
    if (!canSearch) return;
    const params: SearchParams = {
      boroughs: selectedBoroughs,
      dateFrom,
      dateTo,
    };
    onSearch(params, proposalTypes);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-1 pb-2">
        <BoroughSelector
          selected={selectedBoroughs}
          onChange={setSelectedBoroughs}
        />

        <div className="h-px bg-white/10 shrink-0" />

        <DateRangePicker
          dateFrom={dateFrom}
          dateTo={dateTo}
          onChange={(from, to) => {
            setDateFrom(from);
            setDateTo(to);
          }}
        />

        <div className="h-px bg-white/10 shrink-0" />

        <ProposalTypeFilter
          selected={proposalTypes}
          onChange={setProposalTypes}
        />
      </div>

      <div className="shrink-0 pt-3 border-t border-white/10">
        <SearchButton
          onClick={handleSearch}
          disabled={!canSearch}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
