/**
 * A programme count for marketing copy: rounded down to the nearest ten with
 * a "+" (56 → "50+"), so it never overstates and doesn't need editing every
 * time a programme is published. Small counts are shown exactly.
 */
export function programCountLabel(count: number | null | undefined, fallback = "50+"): string {
  if (!count || count < 1) return fallback
  if (count < 10) return String(count)
  return `${Math.floor(count / 10) * 10}+`
}
