export type Facilitator = {
  fullName: string
  jobTitle: string
  company:  string
  image?:   string | null
}

/** Hours between two "HH:mm" strings, rounded to 1 decimal. Returns null if unparseable. */
export function computeDurationHours(start?: string | null, end?: string | null): number | null {
  if (!start || !end) return null
  const m = /^(\d{1,2}):(\d{2})$/
  const a = m.exec(start)
  const b = m.exec(end)
  if (!a || !b) return null
  const startMin = Number(a[1]) * 60 + Number(a[2])
  const endMin   = Number(b[1]) * 60 + Number(b[2])
  const diff     = endMin - startMin
  if (diff <= 0) return null
  return Math.round((diff / 60) * 10) / 10
}

/** Initials from a full name (e.g. "John Smith" -> "JS"). Returns "?" for empty. */
export function initialsOf(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0][0]!.toUpperCase()
  return (parts[0][0]! + parts[parts.length - 1][0]!).toUpperCase()
}

/** Promote legacy string[] facilitator data into the new object shape. */
export function normalizeFacilitators(value: unknown): Facilitator[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item): Facilitator | null => {
      if (typeof item === "string") {
        const name = item.trim()
        return name ? { fullName: name, jobTitle: "", company: "", image: null } : null
      }
      if (item && typeof item === "object") {
        const o = item as Record<string, unknown>
        const fullName = typeof o.fullName === "string" ? o.fullName.trim() : ""
        if (!fullName) return null
        return {
          fullName,
          jobTitle: typeof o.jobTitle === "string" ? o.jobTitle : "",
          company:  typeof o.company  === "string" ? o.company  : "",
          image:    typeof o.image    === "string" ? o.image    : null,
        }
      }
      return null
    })
    .filter((f): f is Facilitator => f !== null)
}
