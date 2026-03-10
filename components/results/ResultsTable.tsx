"use client";

import { useMemo, useState } from "react";
import { Application } from "@/lib/types";
import { useSort } from "@/hooks/useSort";
import { ColumnHeader } from "./ColumnHeader";
import { TablePagination } from "./TablePagination";

const PAGE_SIZE = 50;

function formatDate(date: Date | string): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return String(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

interface ResultsTableProps {
  applications: Application[];
  proposalTypeFilter: string[];
}

export function ResultsTable({ applications, proposalTypeFilter }: ResultsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // Apply proposal type filter client-side
  const filtered = useMemo(() => {
    if (proposalTypeFilter.length === 0) return applications;
    return applications.filter((app) =>
      proposalTypeFilter.some((pt) => app.proposal_category.includes(pt))
    );
  }, [applications, proposalTypeFilter]);

  const { sorted, sortColumn, sortDirection, handleSort } = useSort(filtered);

  // Reset to page 1 when sort/filter changes
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const safePage = Math.min(currentPage, Math.max(1, totalPages));
  const pageSlice = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-sm">No results yet. Run a search to see planning applications.</p>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <p className="text-sm">No applications match the selected proposal types.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="overflow-x-auto flex-1">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-blue-600 sticky top-0">
            <tr>
              <ColumnHeader label="Reference" column="reference_number" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
              <ColumnHeader label="Date" column="registration_date" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
              <ColumnHeader label="Type" column="application_type" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
              <ColumnHeader label="Proposal" column="proposal_description" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} className="min-w-[200px]" />
              <ColumnHeader label="Category" column="proposal_category" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
              <ColumnHeader label="Address" column="address_line_1" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
              <ColumnHeader label="Town" column="town" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
              <ColumnHeader label="Postcode" column="postcode" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {pageSlice.map((app, index) => (
              <tr
                key={`${app.reference_number}-${index}`}
                className={index % 2 === 0 ? "bg-white hover:bg-blue-50" : "bg-gray-50 hover:bg-blue-50"}
              >
                <td className="px-3 py-3 text-xs font-mono text-blue-700 whitespace-nowrap">
                  {app.url ? (
                    <a
                      href={app.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline decoration-blue-400"
                    >
                      {app.reference_number}
                    </a>
                  ) : (
                    app.reference_number
                  )}
                </td>
                <td className="px-3 py-3 text-xs text-gray-700 whitespace-nowrap">
                  {formatDate(app.registration_date)}
                </td>
                <td className="px-3 py-3 text-xs text-gray-700 max-w-[140px] truncate" title={app.application_type}>
                  {app.application_type}
                </td>
                <td className="px-3 py-3 text-xs text-gray-700 max-w-[240px]">
                  <span className="line-clamp-2" title={app.proposal_description}>
                    {app.proposal_description}
                  </span>
                </td>
                <td className="px-3 py-3 text-xs">
                  <div className="flex flex-wrap gap-1">
                    {app.proposal_category.map((cat) => (
                      <span
                        key={cat}
                        className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${
                          cat === "Other/Unclassified"
                            ? "bg-gray-100 text-gray-500"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-3 text-xs text-gray-700">
                  <div>
                    {app.address_line_1}
                    {app.address_line_2 && <div className="text-gray-500">{app.address_line_2}</div>}
                  </div>
                </td>
                <td className="px-3 py-3 text-xs text-gray-700 whitespace-nowrap">
                  {app.town}
                </td>
                <td className="px-3 py-3 text-xs font-mono text-gray-700 whitespace-nowrap">
                  {app.postcode}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TablePagination
        currentPage={safePage}
        totalPages={totalPages}
        totalItems={filtered.length}
        pageSize={PAGE_SIZE}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
