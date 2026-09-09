import { NextRequest, NextResponse } from "next/server"
import { requireApiRole } from "@/lib/guard"
import { enforceRateLimit } from "@/lib/rate-limit"
import { anthropic } from "@/lib/anthropic"
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod"
import { openai } from "@/lib/openai"
import { zodTextFormat } from "openai/helpers/zod"
import { getProgramCategories } from "@/services/program.service"
import { plainTextToHtml } from "@/lib/ai-text"
import { z } from "zod"

const requestSchema = z.object({
  topic:      z.string().min(3, "Describe the course topic in at least 3 characters").max(500),
  categoryId: z.string().min(1, "Category is required"),
  level:      z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
  notes:      z.string().max(1000).optional(),
  provider:   z.enum(["anthropic", "openai"]).default("anthropic"),
})

/** Draft shape the model must return — mirrors the AI-fillable subset of
 *  ProgramFormValues in the administrator Programs page (everything except
 *  the cover image, pricing and category/level, which the admin controls). */
const courseDraftSchema = z.object({
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
      content:     z.string().describe("2-4 sentence lesson body — the actual teaching content a student reads, more detailed than the description, plain text"),
    })).min(2).max(5),
  })).min(3).max(6).describe("Programme outline, split into chapters with lessons"),
  faqs: z.array(z.object({ q: z.string(), a: z.string() })).min(4).max(6),
})

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

/** POST /api/programs/ai-generate — AI-generate a course draft (admin only).
 *  Returns a draft shaped for the ProgramModal form; nothing is persisted here —
 *  the admin reviews/edits it in the modal and saves it as a DRAFT program. */
export async function POST(req: NextRequest) {
  try {
    const guard = await requireApiRole("ADMIN")
    if (!guard.ok) return guard.response

    // Each call runs a paid AI generation (and a second web-search call) —
    // throttle per admin so a retry loop or a compromised session can't run
    // up spend unbounded.
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

    const systemPrompt =
      "You design professional development / executive-education course outlines for ARPS Institute, " +
      "a research, leadership and analytics training provider. Write in clear, professional British English. " +
      "Do not invent statistics, named facilitators, institutions, or accreditations."

    const userPrompt =
      `Generate a course draft for the "${category.name}" category.\n` +
      `Topic: ${topic}\n` +
      `Level: ${levelLabel}\n` +
      (notes ? `Additional notes from the administrator: ${notes}\n` : "")

    let draft: z.infer<typeof courseDraftSchema>
    try {
      if (provider === "openai") {
        const response = await openai.responses.parse({
          model:        "gpt-4.1-mini",
          instructions: systemPrompt,
          input:        userPrompt,
          text:         { format: zodTextFormat(courseDraftSchema, "course_draft") },
        })
        if (!response.output_parsed) {
          return NextResponse.json({ error: "AI did not return a valid draft. Please try again." }, { status: 502 })
        }
        draft = response.output_parsed
      } else {
        const response = await anthropic.messages.parse({
          model:      "claude-opus-5",
          max_tokens: 16000,
          output_config: {
            effort: "medium",
            format: zodOutputFormat(courseDraftSchema),
          },
          system:   systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        })
        if (!response.parsed_output) {
          return NextResponse.json({ error: "AI did not return a valid draft. Please try again." }, { status: 502 })
        }
        draft = response.parsed_output
      }
    } catch (error) {
      console.error(`[POST /api/programs/ai-generate] ${provider} request failed`, error)
      return NextResponse.json({ error: "AI generation failed. Please try again." }, { status: 502 })
    }

    const lessonTitles = draft.curriculum.flatMap(chapter => chapter.lessons.map(l => l.title))
    const referencesByLesson = await findReferenceLinks(provider, topic, category.name, levelLabel, lessonTitles)

    return NextResponse.json({
      draft: {
        title:              draft.title,
        excerpt:            draft.excerpt,
        tagline:            draft.tagline,
        overview:           plainTextToHtml(draft.overview),
        learningObjectives: draft.learningObjectives,
        targetAudience:     draft.targetAudience,
        whatIsIncluded:     draft.whatIsIncluded,
        curriculum: draft.curriculum.map(chapter => ({
          id:    crypto.randomUUID(),
          title: chapter.title,
          desc:  plainTextToHtml(chapter.desc),
          lessons: chapter.lessons.map(lesson => ({
            id:          crypto.randomUUID(),
            title:       lesson.title,
            description: plainTextToHtml(lesson.description),
            blocks: [
              { id: crypto.randomUUID(), type: "text" as const, content: plainTextToHtml(lesson.content) },
              ...(referencesByLesson.get(lesson.title) ?? []).map(ref => ({
                id: crypto.randomUUID(), type: "document" as const, url: ref.url, title: ref.title,
              })),
            ],
          })),
        })),
        faqs:       draft.faqs,
        categoryId: category.id,
        level:      level ?? "BEGINNER",
      },
    })
  } catch (error) {
    console.error("[POST /api/programs/ai-generate]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
