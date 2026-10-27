import { z } from "zod"
import { anthropic } from "@/lib/anthropic"
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod"
import { openai } from "@/lib/openai"
import { zodTextFormat } from "openai/helpers/zod"

/** Shared pieces for the multi-agent course pipeline. The generation work is
 *  split across four routes (outline → chapter → lesson → image), each a short
 *  request driven by the browser, so this is where the provider branching and
 *  the prompt contract live rather than being repeated four times. */

export type Provider = "anthropic" | "openai"

/** Effort is spent where it compounds. The architect and chapter agents run a
 *  handful of times and every downstream lesson inherits their decisions, so
 *  they get "high". Lesson agents run dozens of times per course, where the
 *  marginal quality gain is smaller and latency is felt directly. */
export type Effort = "low" | "medium" | "high"

export const providerSchema = z.enum(["anthropic", "openai"]).default("anthropic")

/** A term the whole course must use consistently. Produced once by the
 *  architect and threaded down to every chapter and lesson agent — without it,
 *  N independent writers drift on vocabulary within a single course. */
export const glossaryEntrySchema = z.object({
  term:       z.string(),
  definition: z.string().describe("One sentence, written for the course's level"),
})
export type GlossaryEntry = z.infer<typeof glossaryEntrySchema>

export function glossaryToPrompt(glossary: GlossaryEntry[]): string {
  if (glossary.length === 0) return ""
  return (
    `Use these terms exactly as defined — do not introduce synonyms for them:\n` +
    glossary.map(g => `- ${g.term}: ${g.definition}`).join("\n")
  )
}

export const HOUSE_STYLE =
  "You are writing for ARPS Institute, a research, leadership and analytics training provider. " +
  "Use clear, professional British English pitched at a working professional taking this course. " +
  "Do not invent statistics, named people, institutions, URLs or accreditations."

/** One structured-output call, normalised across both providers.
 *  Throws on an empty/unparseable response so callers can decide whether to
 *  fall back or surface the failure. */
export async function callStructured<TOut>(opts: {
  provider:  Provider
  schema:    z.ZodType<TOut>
  schemaName: string
  system:    string
  user:      string
  maxTokens: number
  effort?:   Effort
}): Promise<TOut> {
  const { provider, schema, schemaName, system, user, maxTokens, effort = "medium" } = opts

  if (provider === "openai") {
    const response = await openai.responses.parse({
      model:        "gpt-4.1-mini",
      instructions: system,
      input:        user,
      text:         { format: zodTextFormat(schema, schemaName) },
    })
    if (!response.output_parsed) throw new Error("AI returned no parseable output.")
    return response.output_parsed
  }

  const response = await anthropic.messages.parse({
    model:      "claude-opus-5",
    max_tokens: maxTokens,
    output_config: { effort, format: zodOutputFormat(schema) },
    system,
    messages: [{ role: "user", content: user }],
  })
  if (!response.parsed_output) throw new Error("AI returned no parseable output.")
  return response.parsed_output
}
