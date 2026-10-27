import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireApiRole } from "@/lib/guard"
import { enforceRateLimit } from "@/lib/rate-limit"
import { callStructured, providerSchema } from "@/lib/ai-course"

/** Diagram repair.
 *
 *  Lesson agents choose any Mermaid diagram type they like, which is the right
 *  trade for expressiveness but does mean the fussier grammars (gantt,
 *  gitGraph, quadrantChart) come back malformed sometimes — and the installed
 *  mermaid version may not know the very newest types at all.
 *
 *  Rather than restricting the model, the browser parses every generated
 *  diagram and posts the failures here with the parser's own error. One repair
 *  attempt fixes the overwhelming majority; anything still broken is dropped
 *  client-side rather than shipped. */
export const maxDuration = 120

const requestSchema = z.object({
  provider: providerSchema,
  code:     z.string().min(1).max(8000),
  error:    z.string().max(2000).describe("The parser error this source produced"),
  caption:  z.string().max(500).optional(),
})

const repairSchema = z.object({
  code: z.string().describe("The corrected Mermaid source, and nothing else"),
})

export async function POST(req: NextRequest) {
  const guard = await requireApiRole("ADMIN")
  if (!guard.ok) return guard.response

  const limited = enforceRateLimit(req, {
    name: "ai-diagram-repair", limit: 400, windowMs: 60 * 60_000, extraKey: guard.session.sub,
  })
  if (limited) return limited

  const parsed = requestSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    )
  }
  const { provider, code, error, caption } = parsed.data

  try {
    const result = await callStructured({
      provider,
      schema:     repairSchema,
      schemaName: "diagram_repair",
      maxTokens:  2000,
      system:
        "You fix invalid Mermaid diagram source. Return corrected source that parses, " +
        "preserving the author's intent and structure. Prefer the simplest diagram type " +
        "that still expresses the same thing — switching to a plainer type is better than " +
        "returning something that fails again. Keep labels short and avoid quotes, " +
        "parentheses and special characters inside them, which cause most parse failures.",
      user:
        (caption ? `The diagram is meant to show: ${caption}\n\n` : "") +
        `This Mermaid source failed to parse.\n\nError:\n${error}\n\nSource:\n${code}`,
    })

    return NextResponse.json({ code: result.code.trim() })
  } catch (e) {
    console.error(`[POST /api/programs/ai-generate/diagram] ${provider} failed`, e)
    return NextResponse.json({ error: "Could not repair the diagram." }, { status: 502 })
  }
}
