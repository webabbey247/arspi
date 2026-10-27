import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireApiRole } from "@/lib/guard"
import { enforceRateLimit } from "@/lib/rate-limit"
import { anthropic } from "@/lib/anthropic"
import { openai } from "@/lib/openai"
import { providerSchema } from "@/lib/ai-course"

/** The "URLs" half of the content brief — real, currently-live resources
 *  attached to lessons as `document` blocks.
 *
 *  This is deliberately a separate, web-search-grounded pass rather than
 *  something the lesson agent produces: a model asked for a URL inline will
 *  invent a plausible one. Here the links come from an actual search, and
 *  anything that doesn't parse as a URL is discarded. */
export const maxDuration = 300

const requestSchema = z.object({
  provider:     providerSchema,
  topic:        z.string().min(1).max(500),
  categoryName: z.string().max(120),
  levelLabel:   z.string().max(40),
  lessonTitles: z.array(z.string().min(1).max(255)).min(1).max(60),
})

type ReferenceLink = { title: string; url: string }

const REFERENCE_LINE = /^LESSON:\s*(.+?)\s*\|\s*TITLE:\s*(.+?)\s*\|\s*URL:\s*(\S+)\s*$/i

/** The model replies in flat lines rather than JSON — structured output and
 *  tool use don't combine reliably on either provider, so the search call is
 *  plain text and parsed here. Unmatched lines and bad URLs are dropped. */
function parseReferenceLines(text: string, lessonTitles: string[]): Record<string, ReferenceLink[]> {
  const byLesson: Record<string, ReferenceLink[]> = {}
  const lookup = new Map(lessonTitles.map(t => [t.toLowerCase(), t]))

  for (const line of text.split("\n")) {
    const match = REFERENCE_LINE.exec(line.trim())
    if (!match) continue
    const [, lessonRaw, refTitle, url] = match

    const lessonTitle = lookup.get(lessonRaw.trim().toLowerCase())
    if (!lessonTitle) continue
    try { new URL(url) } catch { continue }

    const existing = byLesson[lessonTitle] ?? []
    if (existing.length >= 2) continue  // cap 2 per lesson
    existing.push({ title: refTitle.trim(), url })
    byLesson[lessonTitle] = existing
  }
  return byLesson
}

export async function POST(req: NextRequest) {
  const guard = await requireApiRole("ADMIN")
  if (!guard.ok) return guard.response

  const limited = enforceRateLimit(req, {
    name: "ai-references", limit: 120, windowMs: 60 * 60_000, extraKey: guard.session.sub,
  })
  if (limited) return limited

  const parsed = requestSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    )
  }
  const { provider, topic, categoryName, levelLabel, lessonTitles } = parsed.data

  const prompt =
    `Search the web for real, currently-live resources (articles, official documentation, ` +
    `tutorials, reputable videos) useful for a "${categoryName}" course on "${topic}" ` +
    `(${levelLabel} level).\n\n` +
    `Course lessons:\n${lessonTitles.map(t => `- ${t}`).join("\n")}\n\n` +
    `For each lesson you find a genuinely relevant, real resource for (not every lesson needs ` +
    `one — skip lessons with no good match, and use at most 2 resources per lesson), respond ` +
    `with one line in EXACTLY this format and nothing else — no commentary, no markdown, no ` +
    `numbering:\n` +
    `LESSON: <lesson title copied exactly from the list above> | TITLE: <resource title> | URL: <url>`

  try {
    let text: string

    if (provider === "openai") {
      const response = await openai.responses.create({
        model: "gpt-4.1-mini",
        tools: [{ type: "web_search" }],
        input: prompt,
      })
      text = response.output_text
    } else {
      const tools = [{ type: "web_search_20260209" as const, name: "web_search" as const, max_uses: 8 }]
      let response = await anthropic.messages.create({
        model: "claude-opus-5", max_tokens: 2048, tools,
        messages: [{ role: "user", content: prompt }],
      })
      // A long search can pause mid-turn; resume once before giving up.
      if (response.stop_reason === "pause_turn") {
        response = await anthropic.messages.create({
          model: "claude-opus-5", max_tokens: 2048, tools,
          messages: [
            { role: "user", content: prompt },
            { role: "assistant", content: response.content },
          ],
        })
      }
      text = response.content.filter(b => b.type === "text").map(b => b.text).join("\n")
    }

    return NextResponse.json({ references: parseReferenceLines(text, lessonTitles) })
  } catch (error) {
    // Reference links are an enrichment, never a blocker — the caller treats a
    // failure as "no links found" and keeps the course.
    console.error(`[POST /api/programs/ai-generate/references] ${provider} failed`, error)
    return NextResponse.json({ references: {} })
  }
}
