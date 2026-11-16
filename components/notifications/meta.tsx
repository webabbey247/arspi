import {
  Bell, ClipboardCheck, UserPlus, Repeat, BadgeCheck, MessageSquare, Briefcase, CalendarCheck,
  UserRound, GraduationCap, FileUp, CheckCircle2, Award,
} from "lucide-react"
import { cn } from "@/lib/utils"

/** A notification as the API returns it. */
export type NotificationItem = {
  id:        string
  type:      string
  title:     string
  body:      string | null
  link:      string | null
  /** What it's about — a programme, a person, an enquiry… */
  context?:  string | null
  read:      boolean
  createdAt: string
}

type TypeMeta = { label: string; icon: React.ComponentType<{ className?: string }>; tile: string; pill: string }

const BRAND   = { tile: "bg-[#EEECFF] text-[#6655DF]",    pill: "bg-[#EEECFF] text-[#4B3FB8]" }
const SKY     = { tile: "bg-sky-50 text-sky-600",         pill: "bg-sky-50 text-sky-700" }
const AMBER   = { tile: "bg-amber-50 text-amber-600",     pill: "bg-amber-50 text-amber-700" }
const EMERALD = { tile: "bg-emerald-50 text-emerald-600", pill: "bg-emerald-50 text-emerald-700" }
const ROSE    = { tile: "bg-rose-50 text-rose-600",       pill: "bg-rose-50 text-rose-700" }

/** How each kind of alert looks. Any type not listed falls back to
 *  "General", so a new kind of alert shows up without a UI change. */
export const NOTIFICATION_TYPES: Record<string, TypeMeta> = {
  // Programme review
  program_submitted:     { label: "Approval request",  icon: ClipboardCheck, ...BRAND },
  program_assigned:      { label: "Assignment",        icon: UserPlus,       ...SKY },
  program_reassigned:    { label: "Reassignment",      icon: Repeat,         ...AMBER },
  program_approved:      { label: "Approved",          icon: BadgeCheck,     ...EMERALD },
  // Admin inbox
  enquiry:               { label: "Enquiry",           icon: MessageSquare,  ...SKY },
  career_application:    { label: "Career",            icon: Briefcase,      ...AMBER },
  workshop_registration: { label: "Workshop",          icon: CalendarCheck,  ...ROSE },
  new_student:           { label: "New student",       icon: UserRound,      ...BRAND },
  enrolment:             { label: "Enrolment",         icon: GraduationCap,  ...EMERALD },
  // Teaching
  submission:            { label: "To mark",           icon: FileUp,         ...AMBER },
  // Learners
  marked:                { label: "Marked",            icon: CheckCircle2,   ...EMERALD },
  certificate:           { label: "Certificate",       icon: Award,          ...BRAND },
}
const GENERAL: TypeMeta = { label: "General", icon: Bell, tile: "bg-[#F5F6FB] text-[#69708A]", pill: "bg-[#F5F6FB] text-[#69708A]" }

export const typeMeta = (type: string): TypeMeta => NOTIFICATION_TYPES[type] ?? GENERAL

export function TypeTile({ type, size = "md" }: { type: string; size?: "md" | "lg" }) {
  const m = typeMeta(type)
  const Icon = m.icon
  return (
    <span className={cn(
      "grid place-items-center shrink-0 rounded-[10px]",
      size === "lg" ? "w-11 h-11" : "w-9 h-9",
      m.tile,
    )} aria-hidden>
      <Icon className={size === "lg" ? "w-5 h-5" : "w-4 h-4"} />
    </span>
  )
}

export function TypePill({ type }: { type: string }) {
  const m = typeMeta(type)
  return <span className={cn("inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap", m.pill)}>{m.label}</span>
}

/** What a notification is about: its stored context (a programme, a person,
 *  an enquiry…), else a best guess from its link. */
export function relatedTo(n: Pick<NotificationItem, "link" | "context">): { label: string; href: string | null } | null {
  const link = n.link
  if (n.context?.trim()) return { label: n.context.trim(), href: link }
  if (!link) return null
  const m = link.match(/\/programs\/([^/?#]+)/)
  if (m) {
    const words = decodeURIComponent(m[1]).split("-").filter(Boolean)
    const label = words.map(w => (w.length > 3 || words.indexOf(w) === 0 ? w[0].toUpperCase() + w.slice(1) : w)).join(" ")
    return { label, href: link }
  }
  if (link.startsWith("/instructor/programs")) return { label: "My programmes", href: link }
  return { label: link, href: link }
}

export function timeAgo(iso: string) {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000))
  if (s < 60) return "just now"
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.round(h / 24)
  if (d < 30) return `${d}d ago`
  return new Date(iso).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
}

export function fmtReceived(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

// ── Data ─────────────────────────────────────────────────────────────────────

export async function fetchNotifications(limit = 30): Promise<{ items: NotificationItem[]; unread: number } | null> {
  try {
    const res = await fetch(`/api/notifications?limit=${limit}`)
    if (!res.ok) return null
    const d = await res.json()
    return { items: d.items ?? [], unread: d.unread ?? 0 }
  } catch {
    return null
  }
}

/** Marks some (or, with no ids, all) of the user's notifications read. */
export async function markNotificationsRead(ids?: string[]) {
  await fetch("/api/notifications", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ids ? { ids } : {}),
  }).catch(() => {})
  // Let every bell / page on screen refresh its counts.
  window.dispatchEvent(new Event("notifications:changed"))
}
