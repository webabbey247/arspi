"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { SubscriptionStatus } from "@/services/subscription.service"
import { downloadCsv } from "@/lib/csv"
import { TableSkeletonRows, SkeletonCardList } from "@/components/ui/skeleton"

type SubscriberRow = {
  id: string
  email: string
  status: SubscriptionStatus
  subscribedAt: string
  unsubscribedAt: string | null
}

const STATUS_COLORS: Record<SubscriptionStatus, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700",
  UNSUBSCRIBED: "bg-slate-100 text-slate-600",
}

function fmtDate(iso: string | null) {
  if (!iso) return "-"
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  })
}

function FilterDropdown({
  value,
  onChange,
}: {
  value: SubscriptionStatus | "ALL"
  onChange: (value: SubscriptionStatus | "ALL") => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const activeLabel = value === "ALL" ? "All" : value === "ACTIVE" ? "Active" : "Unsubscribed"

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((current) => !current)}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[13px] font-semibold border cursor-pointer transition-colors ${
          value !== "ALL"
            ? "bg-[#6655DF] text-white border-[#6655DF]"
            : "bg-white text-[#69708A] border-[#DFE2ED] hover:border-[#6655DF] hover:text-[#6655DF]"
        }`}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
        Status
        {value !== "ALL" && (
          <span className="ml-1 bg-white text-[#6655DF] text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
            {activeLabel}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-20 bg-white border border-[#DFE2ED] rounded-xl shadow-lg py-1.5 min-w-36">
          {[
            { value: "ALL", label: "All" },
            { value: "ACTIVE", label: "Active" },
            { value: "UNSUBSCRIBED", label: "Unsubscribed" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value as SubscriptionStatus | "ALL")
                setOpen(false)
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2 text-[13px] font-medium text-left cursor-pointer border-none transition-colors ${
                value === option.value ? "bg-[#EEECFF] text-[#6655DF]" : "bg-transparent text-[#171C35] hover:bg-[#F5F6FB]"
              }`}
            >
              {option.label}
              {value === option.value && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AdminSubscribersPage() {
  const [subscribers, setSubscribers] = useState<SubscriberRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | "ALL">("ALL")
  const PAGE_SIZE = 20
  const [page, setPage] = useState(1)

  const fetchSubscribers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (statusFilter !== "ALL") params.set("status", statusFilter)

      const res = await fetch(`/api/admin/subscribers?${params.toString()}`)
      const data = await res.json().catch(() => [])
      if (res.ok) setSubscribers(Array.isArray(data) ? data : [])
      else setSubscribers([])
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  useEffect(() => {
    fetchSubscribers()
  }, [fetchSubscribers])

  useEffect(() => { setPage(1) }, [search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(subscribers.length / PAGE_SIZE))
  const paginated  = subscribers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-350 mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <span className="block text-[12px] tracking-[0.12em] uppercase font-extrabold text-[#6655DF] mb-1.5">Administrator</span>
          <h1 className="text-[clamp(28px,3.4vw,40px)] leading-[1.1] tracking-[-0.035em] font-extrabold text-[#171C35]">Subscribers</h1>
          <p className="text-[#69708A] text-[15px] mt-1.5 max-w-180">Monitor newsletter signups and subscription status</p>
        </div>
      </div>

      <div className="rounded-[16px] border border-[#DFE2ED] overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-3 sm:px-4 py-3 bg-white border-b border-[#DFE2ED]">
          <div className="relative w-full sm:max-w-100">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A90A6]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by email..."
              className="w-full pl-8 pr-3 py-2 text-[13px] bg-white border border-[#DFE2ED] rounded-[10px] text-[#171C35] outline-none placeholder:text-[#8A90A6] focus:border-[#6655DF] transition-colors"
            />
          </div>
          <div className="sm:ml-auto flex flex-wrap items-center gap-2">
            <FilterDropdown value={statusFilter} onChange={setStatusFilter} />
            <button
              onClick={() => downloadCsv(
                `subscribers-${new Date().toISOString().slice(0, 10)}.csv`,
                [
                  { header: "Email",        value: (row: SubscriberRow) => row.email },
                  { header: "Status",       value: (row: SubscriberRow) => row.status === "ACTIVE" ? "Active" : "Unsubscribed" },
                  { header: "Subscribed",   value: (row: SubscriberRow) => new Date(row.subscribedAt).toISOString() },
                  { header: "Unsubscribed", value: (row: SubscriberRow) => row.unsubscribedAt ? new Date(row.unsubscribedAt).toISOString() : "" },
                ],
                subscribers,
              )}
              disabled={loading || subscribers.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[13px] font-semibold border border-[#DFE2ED] bg-white text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors whitespace-nowrap"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-[#FAFAFF] border-b border-[#DFE2ED]">
                {["Email", "Status", "Subscribed", "Unsubscribed"].map((col) => (
                  <th key={col} className="px-4 py-2.5 text-left text-[11px] font-bold text-[#8A90A6] tracking-[0.5px] uppercase whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonRows colSpan={4} />
              ) : subscribers.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-[#8A90A6]">No subscribers found.</td></tr>
              ) : paginated.map((subscriber) => (
                <tr key={subscriber.id} className="border-b border-[#F0EFFA] last:border-none hover:bg-[#FAFAFF] transition-colors">
                  <td className="px-4 py-3 font-semibold text-[#171C35] whitespace-nowrap">{subscriber.email}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_COLORS[subscriber.status]}`}>
                      {subscriber.status === "ACTIVE" ? "Active" : "Unsubscribed"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#69708A] whitespace-nowrap">{fmtDate(subscriber.subscribedAt)}</td>
                  <td className="px-4 py-3 text-[#69708A] whitespace-nowrap">{fmtDate(subscriber.unsubscribedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cards — mobile */}
        <div className="md:hidden flex flex-col">
          {loading ? (
            <SkeletonCardList />
          ) : subscribers.length === 0 ? (
            <div className="px-4 py-10 text-center text-[#8A90A6] text-[13px]">No subscribers found.</div>
          ) : paginated.map((subscriber) => (
            <div key={subscriber.id} className="px-4 py-4 border-b border-[#F0EFFA] last:border-none flex flex-col gap-3">
              <p className="font-semibold text-[#171C35] text-[14px] leading-tight truncate">{subscriber.email}</p>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_COLORS[subscriber.status]}`}>
                  {subscriber.status === "ACTIVE" ? "Active" : "Unsubscribed"}
                </span>
              </div>

              <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[12px]">
                <div>
                  <dt className="text-[10px] uppercase tracking-wide text-[#8A90A6] font-semibold">Subscribed</dt>
                  <dd className="text-[#171C35] font-medium">{fmtDate(subscriber.subscribedAt)}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-wide text-[#8A90A6] font-semibold">Unsubscribed</dt>
                  <dd className="text-[#171C35] font-medium">{fmtDate(subscriber.unsubscribedAt)}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-3 sm:px-4 py-2.5 bg-[#FAFAFF] border-t border-[#DFE2ED]">
          <p className="text-[11px] text-[#8A90A6]">
            {subscribers.length === 0 ? (
              <>Showing <span className="font-semibold text-[#69708A]">0</span> subscribers</>
            ) : (
              <>Showing <span className="font-semibold text-[#69708A]">{(page - 1) * PAGE_SIZE + 1}</span>–<span className="font-semibold text-[#69708A]">{Math.min(page * PAGE_SIZE, subscribers.length)}</span> of <span className="font-semibold text-[#69708A]">{subscribers.length}</span> {subscribers.length === 1 ? "subscriber" : "subscribers"}</>
            )}
          </p>
          {subscribers.length > 0 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded-[8px] text-[12px] font-semibold border border-[#DFE2ED] bg-white text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                Prev
              </button>
              <span className="text-[11px] font-semibold text-[#69708A] px-2">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1 rounded-[8px] text-[12px] font-semibold border border-[#DFE2ED] bg-white text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
