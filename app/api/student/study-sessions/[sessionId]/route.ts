import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireApiRole } from "@/lib/guard"
import { db } from "@/lib/db"

type Context = { params: Promise<{ sessionId: string }> }

const patchSchema = z.object({
  status: z.enum(["PLANNED", "DONE", "MISSED", "SKIPPED"]),
})

/** PATCH — tick a sitting off (or put it back). Ownership is checked through
 *  the plan, so one student can't touch another's timetable. */
export async function PATCH(req: NextRequest, { params }: Context) {
  try {
    const guard = await requireApiRole("USER")
    if (!guard.ok) return guard.response
    const { session } = guard

    const { sessionId } = await params
    const row = await db.studySession.findUnique({
      where:   { id: sessionId },
      include: { plan: { select: { userId: true } } },
    })
    if (!row || row.plan.userId !== session.sub) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 })
    }

    const parsed = patchSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 })
    }

    const updated = await db.studySession.update({
      where: { id: sessionId },
      data: {
        status: parsed.data.status,
        completedAt: parsed.data.status === "DONE" ? new Date() : null,
      },
    })

    return NextResponse.json({ id: updated.id, status: updated.status })
  } catch (error) {
    console.error("[PATCH /api/student/study-sessions/[sessionId]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
