import { NextRequest, NextResponse } from "next/server"
import { requireApiRole } from "@/lib/guard"
import { enforceRateLimit } from "@/lib/rate-limit"
import { anthropic } from "@/lib/anthropic"
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod"
import { openai } from "@/lib/openai"
import { zodTextFormat } from "openai/helpers/zod"
import { getProgramCategories } from "@/services/program.service"
import { plainTextToHtml } from "@/lib/ai-text"
import type { ContentBlock } from "@/components/forms/ContentBlockEditor"
import { z } from "zod"

const requestSchema = z.object({
  topic:      z.string().min(3, "Describe the course topic in at least 3 characters").max(500),
  categoryId: z.string().min(1, "Category is required"),
  level:      z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
  notes:      z.string().max(1000).optional(),
  provider:   z.enum(["anthropic", "openai"]).default("anthropic"),
})

// ── Stage 1: course outline (architect) ─────────────────────────────────────
// Shape, structure, and FAQs — no lesson content yet. `focus` steers stage 2's
// choice of content blocks (a "practice" lesson gets an assignment block, a
// "teach" lesson gets a quiz, etc.) without being exposed to the client.

const outlineSchema = z.object({
  title:   z.string().describe("Programme title, e.g. 'Monitoring and Evaluation (M&E)'"),
  excerpt: z.string().describe("1-2 sentence summary shown on listing cards, at least 10 characters"),
  tagline: z.string().describe("Short subtitle shown beneath the title on the programme page"),
  overview: z.string().describe("2-4 sentence overview of what the programme covers, plain text (no HTML/markdown)"),
  learningObjectives: z.array(z.string()).min(4).max(8)
    .describe("What learners will be able to do after completing the programme"),
  targetAudience: z.array(z.string()).min(3).max(6)
    .describe("Who this programme is designed for"),
  whatIsIncluded: z.array(z.string()).min(4).max(8)
    .describe("Highlights included in the programme, e.g. 'Certificate of completion'"),
  curriculum: z.array(z.object({
    title: z.string(),
    desc:  z.string().describe("1-2 sentence chapter overview, plain text"),
    lessons: z.array(z.object({
      title:       z.string(),
      description: z.string().describe("1 sentence lesson summary, plain text"),
      focus: z.enum(["teach", "practice", "assess", "reflect"])
        .describe("teach = concept lesson (gets a quiz to check understanding); practice = hands-on/case-study lesson (gets a graded assignment); assess = a dedicated test/exam lesson (gets a quiz); reflect = discussion/self-reflection lesson (gets a questionnaire)"),
    })).min(2).max(5),
  })).min(3).max(6).describe("Programme outline, split into chapters with lessons"),
  faqs: z.array(z.object({ q: z.string(), a: z.string() })).min(4).max(6),
})

type Outline = z.infer<typeof outlineSchema>
type OutlineLesson = Outline["curriculum"][number]["lessons"][number]

// ── Stage 2: per-lesson content blocks (lesson author) ──────────────────────
// One call per lesson, run in parallel — a dedicated generation budget per
// lesson instead of a couple of sentences squeezed out of one whole-course call.

const blockDraftSchema = z.discriminatedUnion("type", [
  z.object({
    type:    z.literal("text"),
    content: z.string().describe(
      "The actual teaching content a learner reads — plain text, 150-400 words, written as full " +
      "paragraphs (use blank lines between paragraphs, '- ' for bullet items). This is the real " +
      "lesson material: explain the concept, give a worked example or real scenario, not a summary."
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
    questions: z.array(z.string()).min(2).max(5).describe("Open-ended reflection/discussion questions"),
  }),
  z.object({
    type:           z.literal("assignment"),
    title:          z.string(),
    instructions:   z.string().describe("Plain text, what the learner must do and how it will be graded"),
    submissionType: z.enum(["text", "file", "link"]),
    dueInDays:      z.string().describe("e.g. '7'"),
    points:         z.string().describe("e.g. '20'"),
  }),
])

const lessonBlocksSchema = z.object({
  blocks: z.array(blockDraftSchema).min(1).max(4).describe(
    "Always start with exactly one 'text' block holding the full lesson content. Then, based on the " +
    "lesson's focus: add ONE 'quiz' block for a teach/assess-focus lesson, ONE 'assignment' block for " +
    "a practice-focus lesson, or ONE 'questionnaire' block for a reflect-focus lesson. Never invent a " +
    "'video', 'image', 'document', 'pdf' or 'survey' block — those need a real uploaded file or URL " +
    "that only a human (or a separate web-search step) can supply."
  ),
})

type BlockDraft = z.infer<typeof blockDraftSchema>

/** Runs `fn` over `items` with at most `limit` calls in flight at once — a
 *  20-lesson course would otherwise fire 20 concurrent provider calls and risk
 *  tripping Anthropic/OpenAI per-minute rate limits. */
async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let cursor = 0
  async function worker() {
    for (;;) {
      const i = cursor++
      if (i >= items.length) return
      results[i] = await fn(items[i], i)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}

async function generateOutline(
  provider: "anthropic" | "openai",
  systemPrompt: string,
  userPrompt: string,
): Promise<Outline> {
  if (provider === "openai") {
    const response = await openai.responses.parse({
      model:        "gpt-4.1-mini",
      instructions: systemPrompt,
      input:        userPrompt,
      text:         { format: zodTextFormat(outlineSchema, "course_outline") },
    })
    if (!response.output_parsed) throw new Error("AI did not return a valid outline.")
    return response.output_parsed
  }

  const response = await anthropic.messages.parse({
    model:      "claude-opus-5",
    max_tokens: 8000,
    output_config: { effort: "medium", format: zodOutputFormat(outlineSchema) },
    system:   systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  })
  if (!response.parsed_output) throw new Error("AI did not return a valid outline.")
  return response.parsed_output
}

function lessonAuthorPrompt(courseTitle: string, chapterTitle: string, lesson: OutlineLesson): string {
  return (
    `Course: "${courseTitle}"\n` +
    `Chapter: "${chapterTitle}"\n` +
    `Lesson: "${lesson.title}"\n` +
    `Lesson summary: ${lesson.description}\n` +
    `Lesson focus: ${lesson.focus}\n\n` +
    `Write this lesson's full content blocks.`
  )
}

/** One call per lesson. On failure, falls back to a single text block built
 *  from the lesson's own summary rather than failing the whole course —
 *  one weak lesson beats losing the other 15. */
async function generateLessonBlocks(
  provider: "anthropic" | "openai",
  systemPrompt: string,
  courseTitle: string,
  chapterTitle: string,
  lesson: OutlineLesson,
): Promise<BlockDraft[]> {
  const prompt = lessonAuthorPrompt(courseTitle, chapterTitle, lesson)
  try {
    if (provider === "openai") {
      const response = await openai.responses.parse({
        model:        "gpt-4.1-mini",
        instructions: systemPrompt,
        input:        prompt,
        text:         { format: zodTextFormat(lessonBlocksSchema, "lesson_blocks") },
      })
      if (!response.output_parsed) throw new Error("empty response")
      return response.output_parsed.blocks
    }

    const response = await anthropic.messages.parse({
      model:      "claude-opus-5",
      max_tokens: 2048,
      output_config: { effort: "medium", format: zodOutputFormat(lessonBlocksSchema) },
      system:   systemPrompt,
      messages: [{ role: "user", content: prompt }],
    })
    if (!response.parsed_output) throw new Error("empty response")
    return response.parsed_output.blocks
  } catch (error) {
    console.error(`[POST /api/programs/ai-generate] lesson author (${provider}) failed for "${lesson.title}" — falling back to summary text`, error)
    return [{ type: "text", content: lesson.description }]
  }
}

// ── Reference links (web search) ────────────────────────────────────────────
// A second, best-effort call that searches the web for real resources and maps
// them to lesson titles. Failures here never fail the overall generation —
// the course draft is still useful without reference links.

type ReferenceLink = { title: string; url: string }

const REFERENCE_LINE = /^LESSON:\s*(.+?)\s*\|\s*TITLE:\s*(.+?)\s*\|\s*URL:\s*(\S+)\s*$/i

function parseReferenceLines(text: string, lessonTitles: string[]): Map<string, ReferenceLink[]> {
  const byLesson = new Map<string, ReferenceLink[]>()
  const titleLookup = new Map(lessonTitles.map(t => [t.toLowerCase(), t]))

  for (const line of text.split("\n")) {
    const match = REFERENCE_LINE.exec(line.trim())
    if (!match) continue
    const [, lessonRaw, refTitle, url] = match
    const lessonTitle = titleLookup.get(lessonRaw.trim().toLowerCase())
    if (!lessonTitle) continue
    try { new URL(url) } catch { continue }

    const existing = byLesson.get(lessonTitle) ?? []
    if (existing.length >= 2) continue // cap 2 references per lesson
    existing.push({ title: refTitle.trim(), url })
    byLesson.set(lessonTitle, existing)
  }
  return byLesson
}

function referencePrompt(topic: string, categoryName: string, levelLabel: string, lessonTitles: string[]): string {
  return (
    `Search the web for real, currently-live resources (articles, official documentation, tutorials, ` +
    `reputable videos) useful for a "${categoryName}" course on "${topic}" (${levelLabel} level).\n\n` +
    `Course lessons:\n${lessonTitles.map(t => `- ${t}`).join("\n")}\n\n` +
    `For each lesson you find a genuinely relevant, real resource for (not every lesson needs one — skip ` +
    `lessons with no good match, and use at most 2 resources per lesson), respond with one line in EXACTLY ` +
    `this format and nothing else — no commentary, no markdown, no numbering:\n` +
    `LESSON: <lesson title copied exactly from the list above> | TITLE: <resource title> | URL: <url>`
  )
}

/** Runs a web-search-backed call to find real reference links per lesson.
 *  Returns an empty map on any failure — never throws. */
async function findReferenceLinks(
  provider:     "anthropic" | "openai",
  topic:        string,
  categoryName: string,
  levelLabel:   string,
  lessonTitles: string[],
): Promise<Map<string, ReferenceLink[]>> {
  const prompt = referencePrompt(topic, categoryName, levelLabel, lessonTitles)
  try {
    if (provider === "openai") {
      const response = await openai.responses.create({
        model: "gpt-4.1-mini",
        tools: [{ type: "web_search" }],
        input: prompt,
      })
      return parseReferenceLines(response.output_text, lessonTitles)
    }

    let response = await anthropic.messages.create({
      model:      "claude-opus-5",
      max_tokens: 2048,
      tools:      [{ type: "web_search_20260209", name: "web_search", max_uses: 8 }],
      messages:   [{ role: "user", content: prompt }],
    })
    if (response.stop_reason === "pause_turn") {
      response = await anthropic.messages.create({
        model:      "claude-opus-5",
        max_tokens: 2048,
        tools:      [{ type: "web_search_20260209", name: "web_search", max_uses: 8 }],
        messages: [
          { role: "user", content: prompt },
          { role: "assistant", content: response.content },
        ],
      })
    }
    const text = response.content.filter(b => b.type === "text").map(b => b.text).join("\n")
    return parseReferenceLines(text, lessonTitles)
  } catch (error) {
    console.error(`[POST /api/programs/ai-generate] reference search (${provider}) failed — continuing without links`, error)
    return new Map()
  }
}

/** Converts one stage-2 block draft into the shape ContentBlockEditor expects,
 *  running plain-text fields through the same sanitizer/HTML conversion used
 *  everywhere else AI-authored content enters this app. */
function toContentBlock(draft: BlockDraft): ContentBlock {
  const id = crypto.randomUUID()
  switch (draft.type) {
    case "text":
      return { id, type: "text" as const, content: plainTextToHtml(draft.content) }
    case "quiz":
      return { id, type: "quiz" as const, question: draft.question, options: draft.options, correctIndex: draft.correctIndex }
    case "questionnaire":
      return { id, type: "questionnaire" as const, title: draft.title, questions: draft.questions }
    case "assignment":
      return {
        id, type: "assignment" as const, title: draft.title,
        instructions: plainTextToHtml(draft.instructions),
        submissionType: draft.submissionType, dueInDays: draft.dueInDays, points: draft.points,
      }
  }
}

// ── SSE progress events ──────────────────────────────────────────────────────
// One line-delimited JSON event per stage/lesson update, terminated by a
// "done" (carries the final draft) or "error" event. Validation/auth/rate-limit
// failures happen before the stream opens and stay plain JSON error responses —
// only once generation actually starts do failures become an "error" event
// (the HTTP status is already 200 by then).

type ProgressEvent =
  | { type: "progress"; message: string; done?: number; total?: number }
  | { type: "done"; draft: Record<string, unknown> }
  | { type: "error"; error: string }

function sseLine(event: ProgressEvent): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`)
}

/** POST /api/programs/ai-generate — AI-generate a course draft (admin only).
 *  Streams progress as Server-Sent Events while it works, ending in a "done"
 *  event carrying the draft shaped for the ProgramModal form; nothing is
 *  persisted here — the admin reviews/edits it in the modal and saves it as a
 *  DRAFT program.
 *
 *  Two-stage pipeline: an "architect" call plans the outline, then one
 *  "lesson author" call per lesson (run concurrently, capped) writes that
 *  lesson's actual content blocks — a real per-lesson generation budget
 *  instead of a couple of sentences squeezed out of a single whole-course call. */
export async function POST(req: NextRequest) {
  const guard = await requireApiRole("ADMIN")
  if (!guard.ok) return guard.response

  // Each call now fans out into 1 (outline) + N (lesson authors) + 1 (reference
  // search) provider calls — throttle per admin so a retry loop or a
  // compromised session can't run up spend unbounded.
  const limited = enforceRateLimit(req, { name: "ai-generate", limit: 20, windowMs: 60 * 60_000, extraKey: guard.session.sub })
  if (limited) return limited

  const body   = await req.json()
  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    )
  }
  const { topic, categoryId, level, notes, provider } = parsed.data

  const categories = await getProgramCategories()
  const category    = categories.find(c => c.id === categoryId)
  if (!category) {
    return NextResponse.json({ error: "Category not found." }, { status: 404 })
  }

  const levelLabel = level === "ADVANCED" ? "Advanced" : level === "INTERMEDIATE" ? "Intermediate" : "Beginner"

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: ProgressEvent) => controller.enqueue(sseLine(event))
      try {
        const architectSystemPrompt =
          "You design professional development / executive-education course outlines for ARPS Institute, " +
          "a research, leadership and analytics training provider. Write in clear, professional British English. " +
          "Do not invent statistics, named facilitators, institutions, or accreditations."

        const authorSystemPrompt =
          "You write individual lesson content for a professional development / executive-education course at " +
          "ARPS Institute, a research, leadership and analytics training provider. Write in clear, professional " +
          "British English, at the level a working professional taking this course would expect — real " +
          "explanations and examples, not filler. Do not invent statistics, named people, institutions, URLs, or accreditations."

        const outlinePrompt =
          `Generate a course draft for the "${category.name}" category.\n` +
          `Topic: ${topic}\n` +
          `Level: ${levelLabel}\n` +
          (notes ? `Additional notes from the administrator: ${notes}\n` : "")

        send({ type: "progress", message: "Planning course outline…" })
        let outline: Outline
        try {
          outline = await generateOutline(provider, architectSystemPrompt, outlinePrompt)
        } catch (error) {
          console.error(`[POST /api/programs/ai-generate] ${provider} outline request failed`, error)
          send({ type: "error", error: "AI generation failed while planning the outline. Please try again." })
          return
        }

        // Stage 2 — one call per lesson, concurrency-capped at 5 in flight.
        const lessonJobs = outline.curriculum.flatMap(chapter =>
          chapter.lessons.map(lesson => ({ chapterTitle: chapter.title, lesson }))
        )
        send({
          type: "progress",
          message: `Outline ready — writing ${lessonJobs.length} lesson${lessonJobs.length === 1 ? "" : "s"}…`,
          done: 0, total: lessonJobs.length,
        })
        let lessonsDone = 0
        const lessonBlockResults = await mapWithConcurrency(lessonJobs, 5, async job => {
          const blocks = await generateLessonBlocks(provider, authorSystemPrompt, outline.title, job.chapterTitle, job.lesson)
          lessonsDone++
          send({
            type: "progress",
            message: `Wrote lesson ${lessonsDone}/${lessonJobs.length}: ${job.lesson.title}`,
            done: lessonsDone, total: lessonJobs.length,
          })
          return blocks
        })

        let cursor = 0
        const curriculum = outline.curriculum.map(chapter => ({
          id:    crypto.randomUUID(),
          title: chapter.title,
          desc:  plainTextToHtml(chapter.desc),
          lessons: chapter.lessons.map(lesson => {
            const blocks = lessonBlockResults[cursor++]!
            return {
              id:          crypto.randomUUID(),
              title:       lesson.title,
              description: plainTextToHtml(lesson.description),
              blocks:      blocks.map(toContentBlock),
            }
          }),
        }))

        send({ type: "progress", message: "Searching for supporting resources…" })
        const lessonTitles = outline.curriculum.flatMap(chapter => chapter.lessons.map(l => l.title))
        const referencesByLesson = await findReferenceLinks(provider, topic, category.name, levelLabel, lessonTitles)
        for (const chapter of curriculum) {
          for (const lesson of chapter.lessons) {
            const refs = referencesByLesson.get(lesson.title) ?? []
            for (const ref of refs) {
              lesson.blocks.push({ id: crypto.randomUUID(), type: "document" as const, url: ref.url, title: ref.title })
            }
          }
        }

        send({ type: "progress", message: "Finalising…" })
        send({
          type: "done",
          draft: {
            title:              outline.title,
            excerpt:            outline.excerpt,
            tagline:            outline.tagline,
            overview:           plainTextToHtml(outline.overview),
            learningObjectives: outline.learningObjectives,
            targetAudience:     outline.targetAudience,
            whatIsIncluded:     outline.whatIsIncluded,
            curriculum,
            faqs:       outline.faqs,
            categoryId: category.id,
            level:      level ?? "BEGINNER",
          },
        })
      } catch (error) {
        console.error("[POST /api/programs/ai-generate]", error)
        send({ type: "error", error: "Something went wrong." })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type":      "text/event-stream",
      "Cache-Control":     "no-cache, no-transform",
      "Connection":        "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
