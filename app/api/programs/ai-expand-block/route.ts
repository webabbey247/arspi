import { NextRequest, NextResponse } from "next/server"
import { getSessionAndRefresh } from "@/lib/session"
import { enforceRateLimit } from "@/lib/rate-limit"
import { anthropic } from "@/lib/anthropic"
import { openai } from "@/lib/openai"
import { plainTextToHtml } from "@/lib/ai-text"
import { z } from "zod"

const requestSchema = z.object({
  provider:       z.enum(["anthropic", "openai"]).default("anthropic"),
  kind:           z.enum(["lesson", "assignment"]).default("lesson"),
  courseTitle:    z.string().min(1).max(255),
  chapterTitle:   z.string().max(255).optional(),
  lessonTitle:    z.string().max(255).optional(),
  lessonSummary:  z.string().max(1000).optional(),
  blockTitle:     z.string().max(255).optional(),
  currentContent: z.string().max(5000).optional(),
  instruction:    z.string().max(500).optional(),
})

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

function buildPrompt(input: z.infer<typeof requestSchema>): { system: string; user: string } {
  const system =
    "You write detailed, engaging teaching content for ARPS Institute, a research, leadership and " +
    "analytics training provider. Write in clear, professional British English. Do not invent statistics, " +
    "named facilitators, institutions, or accreditations. Return plain text only — no markdown headers, " +
    "no meta-commentary about what you're doing. Separate paragraphs with a blank line. You may use " +
    "'- ' prefixed lines for a bullet list where a list genuinely helps."

  const context = [
    `Course: "${input.courseTitle}"`,
    input.chapterTitle && `Chapter: "${input.chapterTitle}"`,
    input.kind === "lesson" ? input.lessonTitle && `Lesson: "${input.lessonTitle}"` : input.blockTitle && `Assignment: "${input.blockTitle}"`,
    input.lessonSummary && `Lesson summary: ${stripHtml(input.lessonSummary)}`,
  ].filter(Boolean).join("\n")

  const existing = input.currentContent ? stripHtml(input.currentContent) : ""
  const goal = input.kind === "lesson"
    ? "Write the full lesson body a student would actually read to learn this material — thorough, " +
      "well-structured, and specific to the topic (aim for roughly 200-400 words)."
    : "Write clear, actionable assignment instructions for a student — what to do, what to submit, and " +
      "how it will be assessed (aim for roughly 100-250 words). The assignment's title is shown separately " +
      "in the UI, so do not repeat it as an opening line or use section headers like 'Task'/'Submit' as " +
      "their own paragraph — write it as flowing instructions instead."

  const user =
    `${context}\n\n` +
    (existing
      ? `Existing content to expand and improve (do not just repeat it back — go deeper, add concrete ` +
        `detail, examples, or steps, and fix anything vague):\n"""\n${existing}\n"""\n\n`
      : `There is no content yet — write it from scratch.\n\n`) +
    (input.instruction ? `Specific instruction from the author: ${input.instruction}\n\n` : "") +
    goal

  return { system, user }
}

/** POST /api/programs/ai-expand-block — expand a single lesson/assignment
 *  content block in place (ADMIN or INSTRUCTOR). Stateless: takes the current
 *  content + surrounding context, returns richer HTML; nothing is persisted
 *  here, the author reviews it in the block editor before saving the course. */
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionAndRefresh()
    if (!session || (session.role !== "ADMIN" && session.role !== "INSTRUCTOR")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const limited = enforceRateLimit(req, { name: "ai-expand-block", limit: 40, windowMs: 60 * 60_000, extraKey: session.sub })
    if (limited) return limited

    const body   = await req.json()
    const parsed = requestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 })
    }

    const { system, user } = buildPrompt(parsed.data)

    let text: string
    try {
      if (parsed.data.provider === "openai") {
        const response = await openai.responses.create({
          model:        "gpt-4.1-mini",
          instructions: system,
          input:        user,
        })
        text = response.output_text
      } else {
        const response = await anthropic.messages.create({
          model:      "claude-opus-5",
          max_tokens: 2048,
          system,
          messages:   [{ role: "user", content: user }],
        })
        text = response.content.filter(b => b.type === "text").map(b => b.text).join("\n")
      }
    } catch (error) {
      console.error(`[POST /api/programs/ai-expand-block] ${parsed.data.provider} request failed`, error)
      return NextResponse.json({ error: "AI generation failed. Please try again." }, { status: 502 })
    }

    if (!text.trim()) {
      return NextResponse.json({ error: "AI did not return any content. Please try again." }, { status: 502 })
    }

    return NextResponse.json({ content: plainTextToHtml(text) })
  } catch (error) {
    console.error("[POST /api/programs/ai-expand-block]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
