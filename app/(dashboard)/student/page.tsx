"use client";

import { useState, useRef, useEffect } from "react";

// ─── Table toolbar ────────────────────────────────────────────────────────────

function TableToolbar({
  search, onSearch, filters, activeFilter, onFilter,
}: {
  search: string; onSearch: (v: string) => void;
  filters: string[]; activeFilter: string; onFilter: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div className="flex gap-2 px-4 py-3 bg-white border-b border-[#E5E2DC]">
      <div className="relative flex-1">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A39C]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder="Search…"
          className="w-full pl-8 pr-3 py-2 text-[13px] bg-white border border-[#E5E2DC] rounded-[10px] text-[#1A1916] outline-none placeholder:text-[#A8A39C] focus:border-[#C07C0A] transition-colors"
        />
      </div>
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(o => !o)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[13px] font-semibold border cursor-pointer transition-colors ${
            activeFilter !== "All"
              ? "bg-[#C07C0A] text-white border-[#C07C0A]"
              : "bg-white text-[#6B6560] border-[#E5E2DC] hover:border-[#C07C0A] hover:text-[#C07C0A]"
          }`}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          Filter
          {activeFilter !== "All" && (
            <span className="ml-1 bg-white text-[#C07C0A] text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">{activeFilter}</span>
          )}
        </button>
        {open && (
          <div className="absolute right-0 top-[calc(100%+6px)] z-20 bg-white border border-[#E5E2DC] rounded-xl shadow-lg py-1.5 min-w-32.5">
            {filters.map(f => (
              <button
                key={f}
                onClick={() => { onFilter(f); setOpen(false); }}
                className={`w-full flex items-center justify-between px-3.5 py-2 text-[13px] font-medium text-left cursor-pointer border-none transition-colors ${
                  activeFilter === f ? "bg-[#FEF3C7] text-[#C07C0A]" : "bg-transparent text-[#1A1916] hover:bg-[#F5F4F1]"
                }`}
              >
                {f}
                {activeFilter === f && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Data table ───────────────────────────────────────────────────────────────

function DataTable({
  cols, rows, total, empty = "No results found",
  search, onSearch, filters, activeFilter, onFilter,
}: {
  cols: string[];
  rows: (string | number | React.ReactNode)[][];
  total: number;
  empty?: string;
  search?: string;        onSearch?: (v: string) => void;
  filters?: string[];     activeFilter?: string;
  onFilter?: (v: string) => void;
}) {
  return (
    <div className="rounded-[14px] border border-[#E5E2DC] overflow-hidden">
      {(onSearch || onFilter) && (
        <TableToolbar
          search={search ?? ""}
          onSearch={onSearch ?? (() => {})}
          filters={filters ?? []}
          activeFilter={activeFilter ?? "All"}
          onFilter={onFilter ?? (() => {})}
        />
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-[#FAFAF9] border-b border-[#E5E2DC]">
              {cols.map(c => (
                <th key={c} className="px-4 py-2.5 text-left text-[11px] font-bold text-[#A8A39C] tracking-[0.5px] uppercase whitespace-nowrap">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={cols.length} className="px-4 py-10 text-center text-[#A8A39C] text-[13px]">{empty}</td>
              </tr>
            ) : (
              rows.map((row, ri) => (
                <tr key={ri} className="border-b border-[#F0EEE9] last:border-none hover:bg-[#FAFAF9] transition-colors">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-4 py-3 text-[#1A1916] whitespace-nowrap">{cell}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#FAFAF9] border-t border-[#E5E2DC]">
        <p className="text-[11px] text-[#A8A39C]">
          Showing <span className="font-semibold text-[#6B6560]">{rows.length}</span> of{" "}
          <span className="font-semibold text-[#6B6560]">{total}</span>{" "}
          {total === 1 ? "entry" : "entries"}
        </p>
        {rows.length < total && (
          <p className="text-[11px] text-[#C07C0A] font-semibold">{total - rows.length} filtered out</p>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const StudentDashboardPage = () => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const rows: (string | number)[][] = [];

  return (
    <div className="max-w-350 mx-auto px-8 py-8">
      <div className="mb-5">
        <h2 className="text-[#1A1916] text-[18px] font-extrabold">My Courses</h2>
        <p className="text-[#A8A39C] text-[13px] mt-0.5">Your enrolled courses and progress</p>
      </div>

      <DataTable
        cols={["Course", "Instructor", "Progress", "Status", "Enrolled"]}
        rows={rows}
        total={rows.length}
        empty="No courses enrolled yet."
        search={search}
        onSearch={setSearch}
        filters={["All", "Active", "Completed"]}
        activeFilter={filter}
        onFilter={setFilter}
      />
    </div>
  );
};

export default StudentDashboardPage;
