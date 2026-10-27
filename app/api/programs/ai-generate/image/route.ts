import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { UTApi } from "uploadthing/server"
import { requireApiRole } from "@/lib/guard"
import { enforceRateLimit } from "@/lib/rate-limit"
import { openai } from "@/lib/openai"

/** Phase 4 of 4 — cover and chapter imagery via gpt-image-1.
 *
 *  Anthropic has no image model, so this route is OpenAI-only regardless of
 *  which provider generated the text.
 *
 *  gpt-image-1 returns base64, and any URL OpenAI hands back is short-lived, so
 *  the bytes are pushed straight to UploadThing. That also keeps the result on
 *  a host already allowed in next.config's `images.remotePatterns`. */
export const maxDuration = 300

const requestSchema = z.object({
  kind:        z.enum(["cover", "chapter"]),
  courseTitle: z.string().min(1).max(255),
  /** Chapter title for kind="chapter"; the course overview for kind="cover". */
  context:     z.string().max(2000).optional(),
  categoryName: z.string().max(120).optional(),
})

/** Pinned so every image in a course looks like it came from one art direction
 *  rather than four different stock libraries. */
const STYLE =
  "Editorial illustration for a professional university-level training programme. " +
  "Restrained, modern, flat vector style with generous negative space. Deep navy, " +
  "slate and muted teal palette on a light background. Abstract and conceptual — " +
  "no faces, no logos, no brand marks, and no text or lettering anywhere in the image."

export async function POST(req: NextRequest) {
  const guard = await requireApiRole("ADMIN")
  if (!guard.ok) return guard.response

  const limited = enforceRateLimit(req, {
    name: "ai-image", limit: 200, windowMs: 60 * 60_000, extraKey: guard.session.sub,
  })
  if (limited) return limited

  const parsed = requestSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    )
  }
  const { kind, courseTitle, context, categoryName } = parsed.data

  const subject =
    kind === "cover"
      ? `the cover image for a programme titled "${courseTitle}"` +
        (categoryName ? ` in the subject area of ${categoryName}` : "") +
        (context ? `. The programme covers: ${context}` : "")
      : `a section image for the chapter "${context}" within a programme titled "${courseTitle}"`

  try {
    const result = await openai.images.generate({
      model:   "gpt-image-1",
      prompt:  `${STYLE}\n\nCreate ${subject}.`,
      size:    "1536x1024", // landscape — cropped to 16:9 and 16:10 by the cards
      quality: "high",
      n:       1,
    })

    const b64 = result.data?.[0]?.b64_json
    if (!b64) {
      return NextResponse.json({ error: "The image model returned no image." }, { status: 502 })
    }

    const slug = courseTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60)
    const file = new File([Buffer.from(b64, "base64")], `${slug || "course"}-${kind}.png`, {
      type: "image/png",
    })

    const uploaded = await new UTApi().uploadFiles(file)
    if (uploaded.error || !uploaded.data) {
      console.error("[POST /api/programs/ai-generate/image] upload failed", uploaded.error)
      return NextResponse.json({ error: "Generated the image but could not store it." }, { status: 502 })
    }

    return NextResponse.json({ url: uploaded.data.ufsUrl })
  } catch (error) {
    // Image generation can be refused on content grounds. The caller treats a
    // failure as "no image" and carries on rather than failing the course.
    console.error("[POST /api/programs/ai-generate/image] generation failed", error)
    return NextResponse.json({ error: "Image generation failed." }, { status: 502 })
  }
}
