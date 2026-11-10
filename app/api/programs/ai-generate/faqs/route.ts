import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireApiRole } from "@/lib/guard"
import { enforceRateLimit } from "@/lib/rate-limit"
import { callStructured, providerSchema, HOUSE_STYLE } from "@/lib/ai-course"

/** One call, no fan-out — a set of FAQs is small and written in one pass. */
export const maxDuration = 120

const requestSchema = z.object({
  title:    z.string().min(1).max(255),
  excerpt:  z.string().max(2000).optional(),
  overview: z.string().max(5000).optional(),
  level:    z.string().max(40).optional(),
  format:   z.string().max(80).optional(),
  duration: z.string().max(120).optional(),
  price:    z.string().max(40).optional(),
  audience:   z.array(z.string().max(300)).max(10).optional(),
  objectives: z.array(z.string().max(300)).max(12).optional(),
  /** FAQs already written, so a regenerate complements rather than repeats. */
  existing:   z.array(z.object({ q: z.string().max(500), a: z.string().max(2000) })).max(20).optional(),
  notes:      z.string().max(1000).optional(),
  provider:   providerSchema,
})

const faqsSchema = z.object({
  faqs: z.array(z.object({
    q: z.string().describe("The question, phrased the way a prospective learner would ask it"),
    a: z.string().describe(
      "A direct answer in two to four sentences. Plain prose — no bullet points, no headings, " +
      "no markdown. It is rendered as text inside an accordion."
    ),
  })).min(4).max(8),
})

/** Strips HTML so the model is grounded on prose rather than on markup it
 *  might imitate in its answers. */
function toPlain(html: string | undefined): string {
  if (!html) return ""
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

/** POST /api/programs/ai-generate/faqs — write a set of FAQs for a programme
 *  from what the author has already filled in (ADMIN only). */
export async function POST(req: NextRequest) {
  const guard = await requireApiRole("ADMIN")
  if (!guard.ok) return guard.response

  // Admin-only above; this is the separate ceiling on spend, since the button
  // can be pressed repeatedly.
  const limited = enforceRateLimit(req, {
    name: "ai-faqs", limit: 60, windowMs: 60 * 60_000, extraKey: guard.session.sub,
  })
  if (limited) return limited

  const parsed = requestSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    )
  }
  const input = parsed.data

  const context = [
    `Programme: "${input.title}"`,
    input.level    && `Level: ${input.level}`,
    input.format   && `Format: ${input.format}`,
    input.duration && `Duration: ${input.duration}`,
    input.price    && `Price: ${input.price}`,
    toPlain(input.excerpt)  && `Summary: ${toPlain(input.excerpt)}`,
    toPlain(input.overview) && `Overview: ${toPlain(input.overview)}`,
    input.audience?.length   && `Who it is for:\n- ${input.audience.join("\n- ")}`,
    input.objectives?.length && `Learning objectives:\n- ${input.objectives.join("\n- ")}`,
  ].filter(Boolean).join("\n")

  const existing = (input.existing ?? []).filter(f => f.q.trim())
  const existingBlock = existing.length
    ? `\nFAQs already written — cover different ground, do not restate these:\n` +
      existing.map(f => `- ${f.q}`).join("\n") + "\n"
    : ""

  try {
    const result = await callStructured({
      provider:   input.provider,
      schema:     faqsSchema,
      schemaName: "programme_faqs",
      maxTokens:  2000,
      effort:     "medium",
      system:
        `${HOUSE_STYLE} You write the FAQ section of a programme page. Answer only from the ` +
        `details given. If something is not stated — a start date, an accreditation, a refund ` +
        `policy, an employment outcome — do not invent it, and do not write a question that ` +
        `would need it. Prefer the questions a prospective learner actually hesitates over: ` +
        `prior knowledge needed, time commitment, what they leave with, how it is assessed.`,
      user:
        `${context}\n${existingBlock}` +
        (input.notes ? `\nAdditional instruction from the administrator: ${input.notes}\n` : "") +
        `\nWrite the FAQs for this programme.`,
    })

    return NextResponse.json({
      faqs: result.faqs.map(f => ({ q: f.q.trim(), a: f.a.trim() })),
    })
  } catch (error) {
    console.error("[POST /api/programs/ai-generate/faqs]", error)
    return NextResponse.json({ error: "Could not generate FAQs. Please try again." }, { status: 500 })
  }
}
