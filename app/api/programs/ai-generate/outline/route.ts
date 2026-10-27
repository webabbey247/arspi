import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireApiRole } from "@/lib/guard"
import { enforceRateLimit } from "@/lib/rate-limit"
import { getProgramCategories } from "@/services/program.service"
import { plainTextToHtml } from "@/lib/ai-text"
import {
  callStructured, glossaryEntrySchema, providerSchema, HOUSE_STYLE,
} from "@/lib/ai-course"

/** Phase 1 of 4. One call, but a high-leverage one — every chapter and lesson
 *  agent downstream inherits its decisions, so it runs at high effort. */
export const maxDuration = 300

const requestSchema = z.object({
  topic:      z.string().min(3, "Describe the course topic in at least 3 characters").max(500),
  categoryId: z.string().min(1, "Category is required"),
  level:      z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
  notes:      z.string().max(1000).optional(),
  provider:   providerSchema,
})

const outlineSchema = z.object({
  title:    z.string().describe("Programme title, e.g. 'Monitoring and Evaluation (M&E)'"),
  excerpt:  z.string().describe("1-2 sentence summary shown on listing cards, at least 10 characters"),
  tagline:  z.string().describe("Short subtitle shown beneath the title on the programme page"),
  overview: z.string().describe("2-4 sentence overview of what the programme covers, plain text"),
  learningObjectives: z.array(z.string()).min(4).max(8)
    .describe("What learners will be able to do after completing the programme"),
  targetAudience: z.array(z.string()).min(3).max(6).describe("Who this programme is designed for"),
  whatIsIncluded: z.array(z.string()).min(4).max(8)
    .describe("Highlights included, e.g. 'Certificate of completion'"),
  glossary: z.array(glossaryEntrySchema).min(5).max(15).describe(
    "The core vocabulary of this subject. Every chapter and lesson is written against " +
    "this list, so choose the terms a learner must come away using correctly."
  ),
  chapters: z.array(z.object({
    title:   z.string(),
    desc:    z.string().describe("1-2 sentence chapter overview, plain text"),
    outcome: z.string().describe(
      "What a learner can do after this chapter that they could not before. " +
      "Written as a capability, not a topic list."
    ),
  })).min(3).max(6).describe(
    "The programme's shape. Do not list lessons — a dedicated agent plans each " +
    "chapter's lessons from its outcome."
  ),
  faqs: z.array(z.object({ q: z.string(), a: z.string() })).min(4).max(6),
})

export async function POST(req: NextRequest) {
  const guard = await requireApiRole("ADMIN")
  if (!guard.ok) return guard.response

  // Admin-only above; this is the separate guard against an authorised session
  // (or a retry loop) running up unbounded spend. One course = one outline call,
  // so this ceiling is per-attempt rather than per-request-in-a-fan-out.
  const limited = enforceRateLimit(req, {
    name: "ai-outline", limit: 60, windowMs: 60 * 60_000, extraKey: guard.session.sub,
  })
  if (limited) return limited

  const parsed = requestSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    )
  }
  const { topic, categoryId, level, notes, provider } = parsed.data

  const category = (await getProgramCategories()).find(c => c.id === categoryId)
  if (!category) return NextResponse.json({ error: "Category not found." }, { status: 404 })

  const levelLabel =
    level === "ADVANCED" ? "Advanced" : level === "INTERMEDIATE" ? "Intermediate" : "Beginner"

  try {
    const outline = await callStructured({
      provider,
      schema:     outlineSchema,
      schemaName: "course_outline",
      maxTokens:  8000,
      effort:     "high",
      system:
        `${HOUSE_STYLE} You are the architect for a new programme: you decide its shape, its ` +
        `vocabulary and what each chapter must achieve. You do not write lesson content.`,
      user:
        `Plan a course for the "${category.name}" category.\n` +
        `Topic: ${topic}\n` +
        `Level: ${levelLabel}\n` +
        (notes ? `Additional notes from the administrator: ${notes}\n` : ""),
    })

    return NextResponse.json({
      outline: {
        ...outline,
        overview: plainTextToHtml(outline.overview),
        chapters: outline.chapters.map(c => ({
          id:      crypto.randomUUID(),
          title:   c.title,
          desc:    plainTextToHtml(c.desc),
          outcome: c.outcome,
        })),
        categoryId: category.id,
        level:      level ?? "BEGINNER",
        levelLabel,
        categoryName: category.name,
      },
    })
  } catch (error) {
    console.error(`[POST /api/programs/ai-generate/outline] ${provider} failed`, error)
    return NextResponse.json(
      { error: "AI generation failed while planning the outline. Please try again." },
      { status: 502 }
    )
  }
}
