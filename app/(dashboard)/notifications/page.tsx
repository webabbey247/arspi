"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Dialog as DialogPrimitive } from "radix-ui"
import { Bell, Check, ChevronRight, FileSpreadsheet, Search, X, ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { TableSkeletonRows, SkeletonCardList } from "@/components/ui/skeleton"
import { FilterSelect, RowActions, RowIcon } from "@/components/admin/AdminKit"
import {
  NOTIFICATION_TYPES, TypePill, TypeTile, fetchNotifications, fmtReceived, markNotificationsRead, relatedTo, typeMeta,
  type NotificationItem,
} from "@/components/notifications/meta"

const PAGE_SIZE = 20

function exportCsv(rows: NotificationItem[]) {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`
  const header = ["Notification", "Message", "Type", "Related to", "Status", "Received"]
  const body = rows.map(n => [
    n.title, n.body ?? "", typeMeta(n.type).label, relatedTo(n)?.label ?? "",
    n.read ? "Read" : "Unread", fmtReceived(n.createdAt),
  ])
  const csv = [header, ...body].map(r => r.map(esc).join(",")).join("\n")
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }))
  const a = document.createElement("a")
  a.href = url
  a.download = `notifications-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Details drawer ───────────────────────────────────────────────────────────

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] tracking-[0.1em] uppercase font-bold text-[#8A90A6]">{label}</dt>
      <dd className="mt-1 text-[14px] font-bold text-[#171C35]">{children}</dd>
    </div>
  )
}

function DetailsDrawer({ item, onClose, onMarkRead, onOpen }: {
  item: NotificationItem | null
  onClose: () => void
  onMarkRead: (n: NotificationItem) => void
  onOpen: (n: NotificationItem) => void
}) {
  const rel = item ? relatedTo(item) : null
  return (
    <DialogPrimitive.Root open={!!item} onOpenChange={o => { if (!o) onClose() }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-200 bg-[#171C35]/40" />
        <DialogPrimitive.Content className="fixed inset-y-0 right-0 z-200 w-full max-w-[440px] bg-white shadow-2xl flex flex-col outline-none">
          <div className="shrink-0 flex items-start justify-between gap-3 px-5 py-4 border-b border-[#F0EFFA]">
            <div>
              <p className="text-[11px] tracking-[0.12em] uppercase font-extrabold text-[#6655DF]">Notification</p>
              <DialogPrimitive.Title className="text-[20px] font-extrabold text-[#171C35] mt-0.5">Details</DialogPrimitive.Title>
            </div>
            <DialogPrimitive.Close aria-label="Close" className="w-8 h-8 rounded-full grid place-items-center text-[#69708A] hover:bg-[#F5F6FB] cursor-pointer">
              <X className="w-4 h-4" />
            </DialogPrimitive.Close>
          </div>
          {item && (
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
              <div className="flex gap-3">
                <TypeTile type={item.type} size="lg" />
                <div className="min-w-0">
                  <TypePill type={item.type} />
                  <p className="mt-1.5 text-[18px] font-extrabold leading-snug text-[#171C35]">{item.title}</p>
                </div>
              </div>
              {item.body && (
                <DialogPrimitive.Description className="rounded-[12px] border border-[#DFE2ED] bg-[#FAFAFF] px-4 py-3 text-[14px] text-[#171C35] leading-relaxed">
                  {item.body}
                </DialogPrimitive.Description>
              )}
              {!item.body && <DialogPrimitive.Description className="sr-only">Notification details</DialogPrimitive.Description>}
              <dl className="grid grid-cols-2 gap-x-5 gap-y-4">
                <Fact label="Type">{typeMeta(item.type).label}</Fact>
                <Fact label="Received">{fmtReceived(item.createdAt)}</Fact>
                <Fact label="Related to">
                  {rel?.href ? (
                    <Link href={rel.href} onClick={() => onOpen(item)} className="inline-flex items-center gap-1 hover:text-[#6655DF]">
                      <span className="line-clamp-2">{rel.label}</span> <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                    </Link>
                  ) : rel ? <span className="line-clamp-2">{rel.label}</span> : "—"}
                </Fact>
                <Fact label="Status">{item.read ? "Read" : "Unread"}</Fact>
              </dl>
              <div className="flex flex-wrap gap-2 pt-1">
                {item.link && (
                  <button
                    type="button" onClick={() => onOpen(item)}
                    className="inline-flex items-center gap-1 px-4 py-2.5 rounded-[10px] bg-[#171C35] text-white text-[14px] font-bold hover:bg-[#2C2368] cursor-pointer"
                  >
                    Open <ChevronRight className="w-4 h-4" />
                  </button>
                )}
                {!item.read && (
                  <button
                    type="button" onClick={() => onMarkRead(item)}
                    className="px-4 py-2.5 rounded-[10px] border border-[#DFE2ED] text-[14px] font-bold text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 cursor-pointer"
                  >
                    Mark as read
                  </button>
                )}
              </div>
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

/** Every alert for the signed-in user — the full list behind the bell. */
export default function NotificationsPage() {
  const router = useRouter()
  const [items, setItems]   = useState<NotificationItem[] | null>(null)
  const [search, setSearch] = useState("")
  const [type, setType]     = useState<string>("ALL")
  const [status, setStatus] = useState<"ALL" | "UNREAD" | "READ">("ALL")
  const [page, setPage]     = useState(1)
  const [detail, setDetail] = useState<NotificationItem | null>(null)

  const load = useCallback(() => fetchNotifications(200).then(d => setItems(d ? d.items : (cur => cur ?? []))), [])
  useEffect(() => {
    load()
    window.addEventListener("notifications:changed", load)
    return () => window.removeEventListener("notifications:changed", load)
  }, [load])

  const unread = (items ?? []).filter(n => !n.read).length

  function markRead(ids?: string[]) {
    setItems(cur => cur?.map(n => (!ids || ids.includes(n.id) ? { ...n, read: true } : n)) ?? cur)
    setDetail(d => (d && (!ids || ids.includes(d.id)) ? { ...d, read: true } : d))
    markNotificationsRead(ids)
  }

  function open(n: NotificationItem) {
    if (!n.read) markRead([n.id])
    setDetail(null)
    if (n.link) router.push(n.link)
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (items ?? []).filter(n =>
      (type === "ALL" || (type === "general" ? !NOTIFICATION_TYPES[n.type] : n.type === type)) &&
      (status === "ALL" || (status === "UNREAD" ? !n.read : n.read)) &&
      (!q || n.title.toLowerCase().includes(q) || (n.body ?? "").toLowerCase().includes(q) ||
        (relatedTo(n)?.label ?? "").toLowerCase().includes(q)),
    )
  }, [items, search, type, status])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, totalPages)
  const shown = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)
  const loading = items === null

  // Only offer types that actually appear, plus anything unrecognised as "General".
  const typeOptions = useMemo(() => {
    const present = new Set((items ?? []).map(n => (NOTIFICATION_TYPES[n.type] ? n.type : "general")))
    return [
      { value: "ALL", label: "All types" },
      ...Object.entries(NOTIFICATION_TYPES).filter(([k]) => present.has(k)).map(([k, m]) => ({ value: k, label: m.label })),
      ...(present.has("general") ? [{ value: "general", label: "General" }] : []),
    ]
  }, [items])

  const actions = (n: NotificationItem) => [
    { label: "View", icon: RowIcon.view, onSelect: () => setDetail(n) },
    ...(!n.read ? [{ type: "separator" as const }, { label: "Mark as read", icon: <Check className="w-4 h-4 text-emerald-600" />, onSelect: () => markRead([n.id]) }] : []),
  ]

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-350 mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <span className="block text-[12px] tracking-[0.12em] uppercase font-extrabold text-[#6655DF] mb-1.5">Inbox</span>
          <h1 className="text-[clamp(28px,3.4vw,40px)] leading-[1.1] tracking-[-0.035em] font-extrabold text-[#171C35]">Notifications</h1>
          <p className="text-[#69708A] text-[15px] mt-1.5 max-w-180">
            Every alert for your account: approvals, assignments, enquiries, registrations, submissions, marks and more.
            {!loading && (unread > 0 ? ` ${unread} unread.` : " You're all caught up.")}
          </p>
        </div>
        {unread > 0 && (
          <button
            type="button" onClick={() => markRead()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-[10px] text-[13px] font-bold border border-[#DFE2ED] bg-white text-[#171C35] hover:border-[#6655DF] hover:text-[#6655DF] cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" /> Mark all read
          </button>
        )}
      </div>

      <div className="rounded-[16px] border border-[#DFE2ED] overflow-hidden bg-white">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-3 sm:px-4 py-3 border-b border-[#DFE2ED]">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8A90A6]" />
            <input
              value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search notifications…" aria-label="Search notifications"
              className="w-full pl-8 pr-3 py-2 text-[13px] bg-white border border-[#DFE2ED] rounded-[10px] text-[#171C35] outline-none placeholder:text-[#8A90A6] focus:border-[#6655DF]"
            />
          </div>
          <div className="sm:ml-auto flex flex-wrap items-center gap-2">
            <FilterSelect label="Filter by type" value={type} onChange={v => { setType(v); setPage(1) }} options={typeOptions} />
            <FilterSelect
              label="Filter by status" value={status} onChange={v => { setStatus(v); setPage(1) }}
              options={[{ value: "ALL", label: "All" }, { value: "UNREAD", label: "Unread" }, { value: "READ", label: "Read" }] as const}
            />
            <button
              type="button" onClick={() => exportCsv(filtered)} disabled={filtered.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[13px] font-semibold border border-[#DFE2ED] bg-white text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF] disabled:opacity-40 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
        </div>

        {/* Table — desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-[#FAFAFF] border-b border-[#DFE2ED]">
                {["Notification", "Type", "Related to", "Received", ""].map((c, i) => (
                  <th key={i} className="px-4 py-2.5 text-left text-[11px] font-bold text-[#8A90A6] tracking-[0.5px] uppercase whitespace-nowrap">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <TableSkeletonRows colSpan={5} /> : shown.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-14 text-center">
                  <Bell className="w-7 h-7 text-[#C9CCDD] mx-auto mb-2" />
                  <p className="text-[13.5px] font-bold text-[#171C35]">{items!.length === 0 ? "No notifications yet." : "No notifications match these filters."}</p>
                </td></tr>
              ) : shown.map(n => {
                const rel = relatedTo(n)
                return (
                  <tr key={n.id} className={cn("border-b border-[#F0EFFA] last:border-none hover:bg-[#FAFAFF]", !n.read && "bg-[#FBFAFF]")}>
                    <td className="px-4 py-3.5 max-w-[520px]">
                      <button type="button" onClick={() => setDetail(n)} className="flex gap-3 text-left cursor-pointer group">
                        <TypeTile type={n.type} />
                        <span className="min-w-0">
                          <span className="flex items-center gap-2">
                            {!n.read && <span className="w-2 h-2 rounded-full bg-[#6655DF] shrink-0" aria-label="Unread" />}
                            <span className="font-bold text-[#171C35] group-hover:text-[#6655DF]">{n.title}</span>
                          </span>
                          {n.body && <span className="block text-[12.5px] text-[#69708A] mt-0.5 line-clamp-2">{n.body}</span>}
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3.5"><TypePill type={n.type} /></td>
                    <td className="px-4 py-3.5 text-[#171C35] max-w-60">
                      {rel ? <span className="line-clamp-2">{rel.label}</span> : <span className="text-[#8A90A6]">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-[#69708A] whitespace-nowrap">{fmtReceived(n.createdAt)}</td>
                    <td className="px-4 py-3.5"><div className="flex justify-end"><RowActions label={`Actions for ${n.title}`} items={actions(n)} /></div></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Cards — mobile */}
        <div className="md:hidden">
          {loading ? <SkeletonCardList /> : shown.length === 0 ? (
            <p className="px-4 py-12 text-center text-[13px] text-[#8A90A6]">{items!.length === 0 ? "No notifications yet." : "No notifications match these filters."}</p>
          ) : shown.map(n => (
            <div key={n.id} className={cn("px-4 py-4 border-b border-[#F0EFFA] last:border-none flex gap-3", !n.read && "bg-[#FBFAFF]")}>
              <TypeTile type={n.type} />
              <button type="button" onClick={() => setDetail(n)} className="min-w-0 flex-1 text-left cursor-pointer">
                <span className="flex items-center gap-2">
                  {!n.read && <span className="w-2 h-2 rounded-full bg-[#6655DF] shrink-0" aria-label="Unread" />}
                  <span className="text-[14px] font-bold text-[#171C35]">{n.title}</span>
                </span>
                {n.body && <span className="block text-[12.5px] text-[#69708A] mt-0.5 line-clamp-2">{n.body}</span>}
                <span className="flex items-center gap-2 mt-1.5"><TypePill type={n.type} /><span className="text-[11.5px] text-[#8A90A6]">{fmtReceived(n.createdAt)}</span></span>
              </button>
              <RowActions label={`Actions for ${n.title}`} items={actions(n)} />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-3 sm:px-4 py-3 bg-[#FAFAFF] border-t border-[#DFE2ED]">
          <p className="text-[12px] text-[#8A90A6]">
            Showing <span className="font-semibold text-[#69708A]">{filtered.length === 0 ? 0 : (current - 1) * PAGE_SIZE + 1}–{Math.min(current * PAGE_SIZE, filtered.length)}</span> of <span className="font-semibold text-[#69708A]">{filtered.length}</span> notification{filtered.length === 1 ? "" : "s"}
          </p>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setPage(Math.max(1, current - 1))} disabled={current === 1} className="px-3 py-1.5 rounded-[8px] text-[12px] font-semibold border border-[#DFE2ED] bg-white text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF] disabled:opacity-40 cursor-pointer">Previous</button>
            <span className="text-[12px] font-semibold text-[#69708A] px-2">Page {current} of {totalPages}</span>
            <button onClick={() => setPage(Math.min(totalPages, current + 1))} disabled={current >= totalPages} className="px-3 py-1.5 rounded-[8px] text-[12px] font-semibold border border-[#DFE2ED] bg-white text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF] disabled:opacity-40 cursor-pointer">Next</button>
          </div>
        </div>
      </div>

      <DetailsDrawer item={detail} onClose={() => setDetail(null)} onMarkRead={n => markRead([n.id])} onOpen={open} />
    </div>
  )
}
