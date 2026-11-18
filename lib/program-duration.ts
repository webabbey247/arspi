/**
 * A programme's duration is stored as display text in `courses.duration`
 * ("7 weeks", "7 weeks (8 to 10 hours per week)") — that's what the public
 * pages show. The editors work in structured fields instead: a number of
 * weeks plus optional weekly study hours. These helpers convert both ways.
 * No server imports, so client and server code can both use them.
 */

export const MAX_DURATION_WEEKS = 104

/** Reads weeks and weekly hours out of stored duration text. Months are
 *  converted (4.345 weeks each); anything unrecognised yields blanks. */
export function parseDuration(text: string | null | undefined): { weeks: string; hoursPerWeek: string } {
  const s = (text ?? "").trim()
  let weeks = ""
  const w = s.match(/(\d+)\s*(?:weeks?|wks?)\b/i)
  const m = s.match(/(\d+(?:\.\d+)?)\s*months?\b/i)
  if (w) weeks = w[1]
  else if (m) weeks = String(Math.max(1, Math.round(Number(m[1]) * 4.345)))
  else if (/^\d+$/.test(s)) weeks = s // a bare number was saved as weeks

  // A number or a range: "8", "8-10", "8 to 10".
  const h = s.match(/(\d+(?:\.\d+)?(?:\s*(?:to|-|–)\s*\d+(?:\.\d+)?)?)\s*(?:hours?|hrs?)\s*(?:per|a|\/)\s*week/i)
  return { weeks, hoursPerWeek: h ? h[1].trim() : "" }
}

/** "8 to 10 hours", "8-10 hrs" → "8 to 10" / "8-10". */
export function cleanHours(hours: string): string {
  return hours.trim().replace(/\s*(?:hours?|hrs?)(?:\s*(?:per|a|\/)\s*week)?\s*$/i, "").trim()
}

/** The text stored and shown publicly, e.g. "7 weeks (8 to 10 hours per week)". */
export function formatDuration(weeks: string | number | null | undefined, hoursPerWeek?: string | null): string {
  const n = typeof weeks === "number" ? weeks : parseInt(String(weeks ?? "").trim(), 10)
  if (!Number.isFinite(n) || n < 1) return ""
  const base = `${n} week${n === 1 ? "" : "s"}`
  const hours = cleanHours(hoursPerWeek ?? "")
  return hours ? `${base} (${hours} hours per week)` : base
}
