import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createElement } from "react"
import { renderToBuffer } from "@react-pdf/renderer"
import { UTApi } from "uploadthing/server"
import { requireApiRole } from "@/lib/guard"
import { enforceRateLimit } from "@/lib/rate-limit"
import { HandoutPDF } from "@/components/HandoutPDF"

/** Chapter handout — the "resource files" half of the content brief.
 *
 *  A model can't hand back a real file, but it has already written the lesson
 *  text; this renders that text to a PDF and uploads it, so the chapter gets a
 *  genuine downloadable resource rather than an invented link. No AI call is
 *  made here — it's a pure render over content that already exists. */
export const maxDuration = 300

const requestSchema = z.object({
  courseTitle:  z.string().min(1).max(255),
  chapterTitle: z.string().min(1).max(255),
  lessons: z.array(z.object({
    title: z.string().max(255),
    body:  z.string().max(20000),
  })).min(1).max(12),
})

export async function POST(req: NextRequest) {
  const guard = await requireApiRole("ADMIN")
  if (!guard.ok) return guard.response

  const limited = enforceRateLimit(req, {
    name: "ai-handout", limit: 200, windowMs: 60 * 60_000, extraKey: guard.session.sub,
  })
  if (limited) return limited

  const parsed = requestSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    )
  }
  const { courseTitle, chapterTitle, lessons } = parsed.data

  try {
    const element = createElement(HandoutPDF, { courseTitle, chapterTitle, lessons })
    // renderToBuffer's element type is narrower than what createElement infers
    // here — same cast the certificate download route uses.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(element as any)

    const slug = chapterTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60)
    const fileName = `${slug || "chapter"}-handout.pdf`
    const file = new File([new Uint8Array(buffer)], fileName, { type: "application/pdf" })

    const uploaded = await new UTApi().uploadFiles(file)
    if (uploaded.error || !uploaded.data) {
      console.error("[POST /api/programs/ai-generate/handout] upload failed", uploaded.error)
      return NextResponse.json({ error: "Built the handout but could not store it." }, { status: 502 })
    }

    const sizeKb = Math.max(1, Math.round(uploaded.data.size / 1024))
    return NextResponse.json({
      url:      uploaded.data.ufsUrl,
      title:    `${chapterTitle} — handout`,
      fileName,
      fileSize: `${sizeKb} KB`,
    })
  } catch (error) {
    console.error("[POST /api/programs/ai-generate/handout] render failed", error)
    return NextResponse.json({ error: "Could not build the handout." }, { status: 502 })
  }
}
