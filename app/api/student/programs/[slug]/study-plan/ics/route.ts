import { NextRequest, NextResponse } from "next/server"
import { requireApiRole } from "@/lib/guard"
import { db } from "@/lib/db"
import { getProgramBySlug } from "@/services/program.service"

type Context = { params: Promise<{ slug: string }> }

/** RFC 5545 escaping — commas, semicolons and backslashes are delimiters, and
 *  a raw newline would terminate the property. */
function esc(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n")
}

/** Lines over 75 octets must be folded, or strict parsers reject the file. */
function fold(line: string): string {
  if (line.length <= 73) return line
  const parts: string[] = []
  let rest = line
  parts.push(rest.slice(0, 73))
  rest = rest.slice(73)
  while (rest.length > 72) {
    parts.push(" " + rest.slice(0, 72))
    rest = rest.slice(72)
  }
  if (rest.length) parts.push(" " + rest)
  return parts.join("\r\n")
}

function stamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
}

/** GET — the plan as a calendar feed, so sessions land in the student's own
 *  calendar rather than only living in this app.
 *
 *  Times are written as floating local times (no Z, no TZID): the plan stores
 *  a local clock time plus a zone, and a floating time is what makes "19:00"
 *  still mean 19:00 if the student travels. */
export async function GET(_req: NextRequest, { params }: Context) {
  try {
    const guard = await requireApiRole("USER")
    if (!guard.ok) return guard.response
    const { session } = guard

    const { slug } = await params
    const program = await getProgramBySlug(slug)
    if (!program) return NextResponse.json({ error: "Program not found." }, { status: 404 })

    const plan = await db.studyPlan.findUnique({
      where:   { userId_courseId: { userId: session.sub, courseId: program.id } },
      include: { sessions: { orderBy: { date: "asc" } } },
    })
    if (!plan) return NextResponse.json({ error: "No study plan for this programme." }, { status: 404 })

    const now = stamp(new Date())
    const lines: string[] = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//ARPS Institute//Study Plan//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      `X-WR-CALNAME:${esc(program.title)} — study plan`,
    ]

    for (const s of plan.sessions) {
      if (s.status === "SKIPPED") continue
      const d = new Date(s.date)
      const day = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`
      const hm = (mins: number) =>
        `${String(Math.floor(mins / 60)).padStart(2, "0")}${String(mins % 60).padStart(2, "0")}00`

      const titles = (s.lessonTitles as string[]) ?? []
      lines.push(
        "BEGIN:VEVENT",
        `UID:${s.id}@arps-institute`,
        `DTSTAMP:${now}`,
        `DTSTART:${day}T${hm(s.startMinute)}`,
        `DTEND:${day}T${hm(s.endMinute)}`,
        fold(`SUMMARY:${esc(`${program.title}${s.chapterTitle ? ` — ${s.chapterTitle}` : ""}`)}`),
        fold(`DESCRIPTION:${esc(titles.map((t, i) => `${i + 1}. ${t}`).join("\n") || "Study session")}`),
        `STATUS:${s.status === "DONE" ? "CONFIRMED" : "TENTATIVE"}`,
        "END:VEVENT",
      )
    }

    lines.push("END:VCALENDAR")

    return new NextResponse(lines.join("\r\n"), {
      headers: {
        "Content-Type":        "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${program.slug}-study-plan.ics"`,
        "Cache-Control":       "no-store",
      },
    })
  } catch (error) {
    console.error("[GET /api/student/programs/[slug]/study-plan/ics]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
