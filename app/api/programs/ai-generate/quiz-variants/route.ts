import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireStaff } from "@/lib/guard"
import { enforceRateLimit } from "@/lib/rate-limit"
import { callStructured, providerSchema, HOUSE_STYLE } from "@/lib/ai-course"

/** Drafts alternative phrasings of an in-lesson practice quiz, so a learner who
 *  gets it wrong can retake on a genuinely different question instead of
 *  re-guessing the same one.
 *
 *  Generated at authoring time, not on retake: a retake has to be instant, the
 *  cost has to be bounded (otherwise it is one model call per wrong answer per
 *  student), and every question a learner sees should have been reviewed by
 *  the person who wrote the lesson. */
export const maxDuration = 120

const requestSchema = z.object({
  provider:     providerSchema,
  courseTitle:  z.string().max(255).optional(),
  chapterTitle: z.string().max(255).optional(),
  lessonTitle:  z.string().max(255).optional(),
  /** The lesson's own prose, so variants test what was actually taught. */
  lessonText:   z.string().max(20000).optional(),
  /** The authored question the variants must be equivalent to. */
  question:     z.string().min(3).max(1000),
  options:      z.array(z.string()).min(2).max(8),
  correctIndex: z.number().int().min(0),
  count:        z.number().int().min(1).max(5).default(3),
})

const variantsSchema = z.object({
  variants: z.array(z.object({
    question: z.string().describe("A different question testing the same single idea — not a reworded copy"),
    options:  z.array(z.string()).min(3).max(5).describe(
      "Answer choices of roughly equal length. Distractors plausible to someone who " +
      "half-learned the point. No two options may share the same wording.",
    ),
    correctIndex: z.number().int().min(0).describe("Index into options of the correct answer"),
  })).min(1).max(5),
})

export async function POST(req: NextRequest) {
  const guard = await requireStaff()
  if (!guard.ok) return guard.response

  const limited = enforceRateLimit(req, {
    name: "ai-quiz-variants", limit: 400, windowMs: 60 * 60_000, extraKey: guard.session.sub,
  })
  if (limited) return limited

  const parsed = requestSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 })
  }
  const d = parsed.data
  const answer = d.options[d.correctIndex]

  try {
    const result = await callStructured({
      provider:   d.provider,
      schema:     variantsSchema,
      schemaName: "quiz_variants",
      maxTokens:  2000,
      effort:     "high",
      system:
        `${HOUSE_STYLE} You write alternative practice questions. Each one must test the ` +
        `same single idea as the original and be answerable from the lesson material you ` +
        `are given — but it must not be the original reworded. Change what the question ` +
        `asks for: apply the idea to a case, invert it, or ask which example fits. Exactly ` +
        `one option is defensible, and no two options share the same wording.`,
      user:
        (d.courseTitle  ? `Course: "${d.courseTitle}"\n` : "") +
        (d.chapterTitle ? `Chapter: "${d.chapterTitle}"\n` : "") +
        (d.lessonTitle  ? `Lesson: "${d.lessonTitle}"\n` : "") +
        `\nOriginal question: ${d.question}\n` +
        `Its correct answer: ${answer}\n\n` +
        `Write ${d.count} alternative question${d.count === 1 ? "" : "s"} testing that same point.\n` +
        (d.lessonText ? `\n--- LESSON MATERIAL ---\n${d.lessonText.slice(0, 16000)}` : ""),
    })

    // Same guards as the assessment drafter: the key must land inside the
    // options, and duplicate wording makes a question ungradeable.
    const variants = result.variants
      .filter(v => v.correctIndex >= 0 && v.correctIndex < v.options.length)
      .filter(v => new Set(v.options.map(o => o.trim().toLowerCase())).size === v.options.length)

    if (variants.length === 0) {
      return NextResponse.json({ error: "The model returned no usable variants. Try again." }, { status: 502 })
    }

    return NextResponse.json({ variants, dropped: result.variants.length - variants.length })
  } catch (error) {
    console.error("[POST /api/programs/ai-generate/quiz-variants]", error)
    const message = error instanceof Error && /api[- ]key|401|authentication/i.test(error.message)
      ? "The AI provider rejected the request — check the API key for that provider."
      : "AI generation failed. Please try again."
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
