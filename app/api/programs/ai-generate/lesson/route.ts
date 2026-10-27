import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireApiRole } from "@/lib/guard"
import { enforceRateLimit } from "@/lib/rate-limit"
import { plainTextToHtml } from "@/lib/ai-text"
import type { ContentBlock } from "@/components/forms/ContentBlockEditor"
import {
  callStructured, glossaryEntrySchema, glossaryToPrompt, providerSchema, HOUSE_STYLE,
} from "@/lib/ai-course"

/** Phase 3 of 4 — one call per lesson, fanned out by the browser.
 *
 *  This is also the regenerate endpoint: the review UI re-posts a single
 *  lesson's brief here to rewrite just that lesson, which is why the brief and
 *  its mustCover/mustNotCover are carried on the lesson rather than held only
 *  in the generating session. */
export const maxDuration = 300

const requestSchema = z.object({
  provider:    providerSchema,
  courseTitle: z.string().min(1).max(255),
  chapterTitle: z.string().min(1).max(255),
  levelLabel:  z.string().max(40),
  glossary:    z.array(glossaryEntrySchema).max(20),
  lesson: z.object({
    title:        z.string().min(1).max(255),
    description:  z.string().max(2000).optional(),
    focus:        z.enum(["teach", "practice", "assess", "reflect"]).default("teach"),
    brief:        z.string().max(4000).optional(),
    mustCover:    z.array(z.string().max(300)).max(8).default([]),
    mustNotCover: z.array(z.string().max(300)).max(8).default([]),
    wantsDiagram: z.boolean().default(false),
  }),
  /** Set when the admin is rewriting an existing lesson — lets them steer the
   *  rewrite ("make it more practical", "shorter"). */
  instruction: z.string().max(500).optional(),
})

/** Only the block types a language model can produce honestly. video, image,
 *  document, pdf and survey all need a real hosted asset or a live URL, so they
 *  are added by the enrichment and image phases, never invented here. */
const blockDraftSchema = z.discriminatedUnion("type", [
  z.object({
    type:    z.literal("text"),
    content: z.string().describe(
      "The actual teaching content, plain text, 200-400 words. Full paragraphs separated " +
      "by blank lines; '- ' prefixed lines for bullets. Explain the concept and work " +
      "through a concrete example — this is the material, not a summary of it."
    ),
  }),
  z.object({
    type:         z.literal("quiz"),
    question:     z.string(),
    options:      z.array(z.string()).min(3).max(5),
    correctIndex: z.number().int().min(0).describe("Index into options of the correct answer"),
  }),
  z.object({
    type:      z.literal("questionnaire"),
    title:     z.string(),
    questions: z.array(z.string()).min(2).max(5).describe("Open-ended reflection questions"),
  }),
  z.object({
    type:           z.literal("assignment"),
    title:          z.string(),
    instructions:   z.string().describe("Plain text: what to do, what to submit, how it is marked"),
    submissionType: z.enum(["text", "file", "link"]),
    dueInDays:      z.string().describe("e.g. '7'"),
    points:         z.string().describe("e.g. '20'"),
  }),
  z.object({
    type: z.literal("diagram"),
    code: z.string().describe(
      "Valid Mermaid source. Choose whichever Mermaid diagram type genuinely fits the " +
      "content — flowchart, sequenceDiagram, mindmap, timeline, stateDiagram, journey, " +
      "classDiagram and so on. Keep labels short and free of quotes or special characters."
    ),
    caption: z.string().describe("One line describing what the diagram shows — also read by screen readers"),
  }),
])

const lessonBlocksSchema = z.object({
  blocks: z.array(blockDraftSchema).min(1).max(4),
})

type BlockDraft = z.infer<typeof blockDraftSchema>

function toContentBlock(draft: BlockDraft): ContentBlock {
  const id = crypto.randomUUID()
  switch (draft.type) {
    case "text":
      return { id, type: "text", content: plainTextToHtml(draft.content) }
    case "quiz":
      return { id, type: "quiz", question: draft.question, options: draft.options, correctIndex: draft.correctIndex }
    case "questionnaire":
      return { id, type: "questionnaire", title: draft.title, questions: draft.questions }
    case "assignment":
      return {
        id, type: "assignment", title: draft.title,
        instructions: plainTextToHtml(draft.instructions),
        submissionType: draft.submissionType, dueInDays: draft.dueInDays, points: draft.points,
      }
    case "diagram":
      // Mermaid source is left raw — the browser validates it and runs a repair
      // pass before this ever reaches a learner.
      return { id, type: "diagram", code: draft.code.trim(), caption: draft.caption }
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireApiRole("ADMIN")
  if (!guard.ok) return guard.response

  // The widest ceiling of the four: a single course fans out one call per
  // lesson (up to ~36), and regeneration adds more on top.
  const limited = enforceRateLimit(req, {
    name: "ai-lesson", limit: 800, windowMs: 60 * 60_000, extraKey: guard.session.sub,
  })
  if (limited) return limited

  const parsed = requestSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    )
  }
  const { provider, courseTitle, chapterTitle, levelLabel, glossary, lesson, instruction } = parsed.data

  const blockGuidance =
    lesson.focus === "practice" ? "Add one 'assignment' block — this lesson is hands-on."
    : lesson.focus === "reflect" ? "Add one 'questionnaire' block — this lesson is reflective."
    : "Add one 'quiz' block testing the key point of this lesson."

  try {
    const result = await callStructured({
      provider,
      schema:     lessonBlocksSchema,
      schemaName: "lesson_blocks",
      maxTokens:  3000,
      system:
        `${HOUSE_STYLE} You write one lesson of a programme, working only from the brief you ` +
        `are given. Other lessons in this chapter are written by other agents who cannot see ` +
        `your work, so stay inside your brief: deliver what it assigns you and defer anything ` +
        `it marks as belonging elsewhere.`,
      user:
        `Course: "${courseTitle}" (${levelLabel})\n` +
        `Chapter: "${chapterTitle}"\n` +
        `Lesson: "${lesson.title}"\n` +
        (lesson.description ? `Summary: ${lesson.description}\n` : "") +
        `Focus: ${lesson.focus}\n\n` +
        (lesson.brief ? `Brief: ${lesson.brief}\n\n` : "") +
        (lesson.mustCover.length > 0
          ? `This lesson must cover:\n${lesson.mustCover.map(p => `- ${p}`).join("\n")}\n\n` : "") +
        (lesson.mustNotCover.length > 0
          ? `Another lesson owns these — refer to them at most in passing, do not teach them:\n` +
            `${lesson.mustNotCover.map(p => `- ${p}`).join("\n")}\n\n` : "") +
        glossaryToPrompt(glossary) + "\n\n" +
        `Start with exactly one 'text' block carrying the lesson content. ${blockGuidance}` +
        (lesson.wantsDiagram
          ? ` Also add one 'diagram' block — this lesson's material is structural and benefits from one.`
          : ` Do not add a diagram block.`) +
        (instruction ? `\n\nAdditional instruction from the author: ${instruction}` : ""),
    })

    return NextResponse.json({ blocks: result.blocks.map(toContentBlock) })
  } catch (error) {
    console.error(`[POST /api/programs/ai-generate/lesson] ${provider} failed for "${lesson.title}"`, error)
    return NextResponse.json(
      { error: `AI generation failed for "${lesson.title}". Please try again.` },
      { status: 502 }
    )
  }
}
