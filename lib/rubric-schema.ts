import { z } from "zod"
import { validateRubric, type RubricContent } from "@/lib/rubric"

const levelSchema = z.object({
  key:   z.string().min(1).max(64),
  label: z.string().max(80),
  order: z.number().int(),
})

const cellSchema = z.object({
  level:      z.string().min(1).max(64),
  minPoints:  z.number().min(0).max(10000),
  maxPoints:  z.number().min(0).max(10000),
  descriptor: z.string().max(2000),
})

const criterionSchema = z.object({
  key:       z.string().min(1).max(64),
  title:     z.string().max(200),
  maxPoints: z.number().min(0).max(10000),
  cells:     z.array(cellSchema).max(10),
})

const bandSchema = z.object({
  label:   z.string().max(80),
  min:     z.number().min(0).max(10000),
  max:     z.number().min(0).max(10000),
  meaning: z.string().max(500).optional(),
})

/** Request body for creating or editing a rubric. The zod pass checks shape
 *  and sizes; validateRubric() then applies the marking rules (ranges cover
 *  0..max, criteria add up to the total, every cell described). */
export const rubricBodySchema = z.object({
  title:             z.string().max(200),
  description:       z.string().max(2000).nullable().optional(),
  type:              z.enum(["ANALYTIC", "HOLISTIC"]).default("ANALYTIC"),
  totalPoints:       z.number().min(1).max(10000),
  passMark:          z.number().min(0).max(10000),
  levels:            z.array(levelSchema).min(2).max(8),
  criteria:          z.array(criterionSchema).min(1).max(30),
  gradeBands:        z.array(bandSchema).min(1).max(10),
  visibleToLearners: z.boolean().default(true),
  status:            z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
  /** Read by the create route only; scope never changes after creation. */
  courseId:          z.string().nullable().optional(),
})

export type RubricBody = z.infer<typeof rubricBodySchema>

/** Parses and validates a rubric body. Returns the content or a message. */
export function parseRubricBody(raw: unknown):
  | { ok: true; content: RubricContent; status?: RubricBody["status"] }
  | { ok: false; error: string } {
  const parsed = rubricBodySchema.safeParse(raw)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return { ok: false, error: issue ? `${issue.path.join(".")}: ${issue.message}` : "Invalid rubric." }
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { status, courseId, ...content } = parsed.data
  if (content.type !== "ANALYTIC") {
    return { ok: false, error: "Only analytic rubrics are supported for now." }
  }
  const errors = validateRubric(content)
  if (errors.length > 0) return { ok: false, error: errors[0] }
  return { ok: true, content, status }
}
