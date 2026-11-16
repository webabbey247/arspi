import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireApiRole } from "@/lib/guard"
import { inviteInstructor } from "@/services/staff.service"

const rowSchema = z.object({
  email:     z.string().trim().max(254),
  firstName: z.string().trim().max(80).optional(),
  lastName:  z.string().trim().max(80).optional(),
})
const bodySchema = z.object({ rows: z.array(rowSchema).min(1).max(200) })
const emailCheck = z.string().email()

/** POST /api/admin/staff/import — invite many instructors at once (admin
 *  only). Each row is handled on its own; the response reports per row, so a
 *  bad line never sinks the rest of the file. */
export async function POST(req: NextRequest) {
  try {
    const guard = await requireApiRole("ADMIN")
    if (!guard.ok) return guard.response

    const parsed = bodySchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Upload between 1 and 200 rows." }, { status: 400 })
    }

    const seen = new Set<string>()
    const results: { email: string; outcome: "invited" | "resent" | "skipped"; emailSent?: boolean; error?: string }[] = []
    // Sequential: keeps the mail server happy and the results in file order.
    for (const row of parsed.data.rows) {
      const email = row.email.toLowerCase()
      if (!emailCheck.safeParse(email).success) {
        results.push({ email: row.email, outcome: "skipped", error: "Not a valid email address." })
        continue
      }
      if (seen.has(email)) {
        results.push({ email, outcome: "skipped", error: "Duplicate row in this file." })
        continue
      }
      seen.add(email)
      const r = await inviteInstructor({ ...row, email })
      results.push(r.ok
        ? { email, outcome: r.outcome, emailSent: r.emailSent }
        : { email, outcome: "skipped", error: r.error })
    }
    return NextResponse.json({ results })
  } catch (error) {
    console.error("[POST /api/admin/staff/import]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
