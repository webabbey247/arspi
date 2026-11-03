import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireCourseEditor } from "@/lib/guard"
import { enforceRateLimit } from "@/lib/rate-limit"
import { db } from "@/lib/db"
import { callStructured, providerSchema, HOUSE_STYLE } from "@/lib/ai-course"

/** Drafts graded assessment content from a chapter's own material.
 *
 *  Deliberately reads the chapter out of the stored curriculum rather than
 *  trusting the browser to send it: the questions have to be answerable from
 *  what the student was actually taught, and a client-supplied body could
 *  describe anything. */
export const maxDuration = 300

const requestSchema = z.object({
  provider:  providerSchema,
  kind:      z.enum(["CHAPTER_QUIZ", "PROJECT"]),
  /** Required for CHAPTER_QUIZ — which chapter to draw from. */
  chapterId: z.string().optional(),
  count:     z.number().int().min(1).max(20).default(8),
  /** Optional steer, e.g. "focus on application, not recall". */
  instruction: z.string().max(500).optional(),
})

const quizSchema = z.object({
  questions: z.array(z.object({
    prompt:  z.string().describe("The question. Self-contained — no 'as mentioned above'."),
    options: z.array(z.string()).min(3).max(5).describe(
      "Answer choices. Distractors must be plausible to someone who half-learned the " +
      "material, never absurd. All roughly the same length, so length isn't a tell. " +
      "No two options may be worded identically."
    ),
    correctIndex: z.number().int().min(0).describe("Index into options of the correct answer"),
    points:       z.number().min(1).max(5).describe("Marks, 1 for recall up to 3 for applied reasoning"),
  })).min(1).max(20),
})

const projectSchema = z.object({
  title:        z.string().describe("A concrete deliverable, not a topic"),
  instructions: z.string().describe(
    "What the student must produce, in 150-300 words: the task, the expected format " +
    "and length, and what 'done' looks like. Plain text, blank lines between paragraphs."
  ),
  rubric: z.array(z.object({
    criterion: z.string().describe("What is being judged — observable, not a vibe"),
    maxPoints: z.number().int().min(5).max(40),
  })).min(3).max(6).describe("Criteria whose maxPoints sum to 100"),
})

/** Flattens a chapter's lessons into the plain text the model reasons over.
 *  Only text-bearing blocks contribute — a video URL or a PDF link tells the
 *  model nothing it can write a question about. */
function chapterToPlainText(chapter: unknown): { title: string; body: string } {
  const c = chapter as { title?: string; desc?: string; lessons?: unknown[] }
  const parts: string[] = []
  if (c?.desc) parts.push(stripHtml(c.desc))

  for (const raw of c?.lessons ?? []) {
    const l = raw as { title?: string; description?: string; blocks?: unknown[] }
    if (l?.title) parts.push(`\n## ${l.title}`)
    if (l?.description) parts.push(stripHtml(l.description))
    for (const b of l?.blocks ?? []) {
      const block = b as { type?: string; content?: string; question?: string; options?: string[]; instructions?: string; title?: string }
      if (block?.type === "text" && block.content) parts.push(stripHtml(block.content))
      else if (block?.type === "assignment" && block.instructions) parts.push(stripHtml(block.instructions))
      else if (block?.type === "quiz" && block.question) {
        // Existing practice quizzes signal what the chapter treats as testable.
        parts.push(`(practice question already used: ${block.question})`)
      }
    }
  }
  return { title: c?.title ?? "Untitled chapter", body: parts.join("\n").trim() }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim()
}

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const programId = searchParams.get("programId")
  if (!programId) {
    return NextResponse.json({ error: "programId is required." }, { status: 400 })
  }

  const guard = await requireCourseEditor(programId)
  if (!guard.ok) return guard.response

  const limited = enforceRateLimit(req, {
    name: "ai-assessment", limit: 200, windowMs: 60 * 60_000, extraKey: guard.session.sub,
  })
  if (limited) return limited

  const parsed = requestSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 })
  }
  const { provider, kind, chapterId, count, instruction } = parsed.data

  const course = await db.course.findUnique({ where: { id: programId } })
  if (!course) return NextResponse.json({ error: "Program not found." }, { status: 404 })

  const chapters = Array.isArray(course.curriculum) ? course.curriculum : []

  try {
    if (kind === "CHAPTER_QUIZ") {
      const chapter = chapters.find((c: unknown) => (c as { id?: string })?.id === chapterId)
      if (!chapter) {
        return NextResponse.json({ error: "That chapter no longer exists in this programme." }, { status: 400 })
      }

      const { title, body } = chapterToPlainText(chapter)
      if (body.length < 200) {
        return NextResponse.json(
          { error: "There isn't enough written content in this chapter to draft questions from yet." },
          { status: 422 },
        )
      }

      const result = await callStructured({
        provider,
        schema:     quizSchema,
        schemaName: "assessment_questions",
        maxTokens:  4000,
        effort:     "high",
        system:
          `${HOUSE_STYLE} You write graded assessment questions. Every question must be ` +
          `answerable from the chapter text you are given and from nothing else — no outside ` +
          `knowledge, no trick phrasing, no "all of the above". Test whether the student can ` +
          `use the material, not whether they memorised its wording. Each question must have ` +
          `exactly one defensible answer, and no two options may share the same wording.`,
        user:
          `Course: "${course.title}"\n` +
          `Chapter: "${title}"\n\n` +
          `Write ${count} multiple-choice questions assessing this chapter.\n` +
          (instruction ? `Additional direction: ${instruction}\n` : "") +
          `\n--- CHAPTER MATERIAL ---\n${body.slice(0, 24000)}`,
      })

      // Trust nothing: the key must land inside the options, and duplicate
      // option text would make the question ungradeable however it's scored.
      const questions = result.questions
        .filter(q => q.correctIndex >= 0 && q.correctIndex < q.options.length)
        .filter(q => new Set(q.options.map(o => o.trim().toLowerCase())).size === q.options.length)
        .map(q => ({ ...q, id: crypto.randomUUID() }))

      if (questions.length === 0) {
        return NextResponse.json({ error: "The model returned no usable questions. Try again." }, { status: 502 })
      }

      return NextResponse.json({ kind, questions, dropped: result.questions.length - questions.length })
    }

    // PROJECT — drawn from the whole course, since it's the capstone.
    const outline = chapters
      .map((c: unknown, i: number) => {
        const { title } = chapterToPlainText(c)
        return `${i + 1}. ${title}`
      })
      .join("\n")

    const result = await callStructured({
      provider,
      schema:     projectSchema,
      schemaName: "assessment_project",
      maxTokens:  2500,
      effort:     "high",
      system:
        `${HOUSE_STYLE} You design the capstone project for a programme. It must be something ` +
        `a student produces and submits as a file, markable by a human against a rubric. ` +
        `Make the criteria observable — what a grader can point at in the work — rather than ` +
        `impressions. The rubric's maxPoints must total 100.`,
      user:
        `Course: "${course.title}"\n` +
        (course.excerpt ? `About: ${stripHtml(course.excerpt)}\n` : "") +
        `\nChapters:\n${outline}\n\n` +
        (instruction ? `Additional direction: ${instruction}\n` : "") +
        `Design one project that requires the student to apply the programme as a whole.`,
    })

    const rubric = result.rubric.map(c => ({ ...c, id: crypto.randomUUID() }))
    return NextResponse.json({
      kind,
      title:        result.title,
      instructions: result.instructions,
      rubric,
      rubricTotal:  rubric.reduce((s, c) => s + c.maxPoints, 0),
    })
  } catch (error) {
    console.error("[POST /api/programs/ai-generate/assessment]", error)
    const message = error instanceof Error && /api[- ]key|401|authentication/i.test(error.message)
      ? "The AI provider rejected the request — check the API key for that provider."
      : "AI generation failed. Please try again."
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
