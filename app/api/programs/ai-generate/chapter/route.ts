import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireApiRole } from "@/lib/guard"
import { enforceRateLimit } from "@/lib/rate-limit"
import { plainTextToHtml } from "@/lib/ai-text"
import {
  callStructured, glossaryEntrySchema, glossaryToPrompt, providerSchema, HOUSE_STYLE,
} from "@/lib/ai-course"

/** Phase 2 of 4 — one call per chapter, fanned out by the browser.
 *
 *  This tier exists to coordinate, not to relay. Lesson agents each work in
 *  isolation, so without a plan that assigns ownership they re-explain the same
 *  concept several times across one chapter. That's what `mustCover` /
 *  `mustNotCover` are for. */
export const maxDuration = 300

const requestSchema = z.object({
  provider:       providerSchema,
  courseTitle:    z.string().min(1).max(255),
  courseOverview: z.string().max(4000),
  levelLabel:     z.string().max(40),
  glossary:       z.array(glossaryEntrySchema).max(20),
  chapter: z.object({
    title:   z.string().min(1).max(255),
    desc:    z.string().max(2000),
    outcome: z.string().max(1000),
  }),
  /** Titles and outcomes of the other chapters, so this agent can hand work
   *  off rather than duplicating a sibling's territory. */
  siblingChapters: z.array(z.object({
    title:   z.string().max(255),
    outcome: z.string().max(1000),
  })).max(10),
})

const chapterPlanSchema = z.object({
  lessons: z.array(z.object({
    title:       z.string(),
    description: z.string().describe("One sentence, shown under the lesson title in the curriculum"),
    focus: z.enum(["teach", "practice", "assess", "reflect"]).describe(
      "teach = concept lesson; practice = hands-on or case study; assess = a test of " +
      "what came before; reflect = discussion or self-evaluation"
    ),
    brief: z.string().describe(
      "Instructions to the agent that will write this lesson: the angle to take, the " +
      "depth expected, and the example or scenario it should build on."
    ),
    mustCover: z.array(z.string()).min(1).max(5)
      .describe("Points this lesson owns and must deliver"),
    mustNotCover: z.array(z.string()).max(5).describe(
      "Points deliberately left to another lesson in this chapter. Name them so the " +
      "writer defers instead of repeating them."
    ),
    wantsDiagram: z.boolean().describe(
      "True only where a diagram genuinely aids understanding — a process flow, a " +
      "decision path, a framework's structure. False for ordinary prose lessons."
    ),
  })).min(2).max(6).describe(
    "Decide how many lessons this chapter needs to reach its outcome — enough to cover " +
    "it properly, no padding."
  ),
})

export async function POST(req: NextRequest) {
  const guard = await requireApiRole("ADMIN")
  if (!guard.ok) return guard.response

  // Scaled for the fan-out: one course issues one call per chapter (3-6), so a
  // ceiling calibrated for single-request generation would 429 mid-course.
  const limited = enforceRateLimit(req, {
    name: "ai-chapter", limit: 300, windowMs: 60 * 60_000, extraKey: guard.session.sub,
  })
  if (limited) return limited

  const parsed = requestSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    )
  }
  const { provider, courseTitle, courseOverview, levelLabel, glossary, chapter, siblingChapters } = parsed.data

  try {
    const plan = await callStructured({
      provider,
      schema:     chapterPlanSchema,
      schemaName: "chapter_plan",
      maxTokens:  4000,
      effort:     "high",
      system:
        `${HOUSE_STYLE} You plan one chapter of a programme. You decide how many lessons it ` +
        `needs and what each one owns. You do not write the lesson content itself — a separate ` +
        `agent writes each lesson from the brief you produce, and those agents cannot see one ` +
        `another's work, so your briefs are the only thing preventing them from overlapping.`,
      user:
        `Course: "${courseTitle}" (${levelLabel})\n` +
        `Course overview: ${courseOverview}\n\n` +
        `Chapter to plan: "${chapter.title}"\n` +
        `Chapter summary: ${chapter.desc}\n` +
        `Chapter outcome: ${chapter.outcome}\n\n` +
        (siblingChapters.length > 0
          ? `Other chapters in this course — do not take their territory:\n` +
            siblingChapters.map(c => `- ${c.title}: ${c.outcome}`).join("\n") + "\n\n"
          : "") +
        glossaryToPrompt(glossary) +
        `\n\nPlan the lessons for this chapter.`,
    })

    return NextResponse.json({
      lessons: plan.lessons.map(l => ({
        id:          crypto.randomUUID(),
        title:       l.title,
        description: plainTextToHtml(l.description),
        focus:        l.focus,
        // Kept on the lesson so a later "regenerate this lesson" still has the
        // anti-overlap context the chapter agent worked out.
        brief:        l.brief,
        mustCover:    l.mustCover,
        mustNotCover: l.mustNotCover,
        wantsDiagram: l.wantsDiagram,
      })),
    })
  } catch (error) {
    console.error(`[POST /api/programs/ai-generate/chapter] ${provider} failed`, error)
    return NextResponse.json(
      { error: `AI generation failed while planning "${chapter.title}". Please try again.` },
      { status: 502 }
    )
  }
}
