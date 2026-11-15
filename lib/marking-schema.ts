import { z } from "zod"

/** Body for saving or releasing rubric marks. Ranges are checked against the
 *  rubric version server-side; this only checks shape. */
export const markingBodySchema = z.object({
  action:   z.enum(["draft", "release"]),
  criteria: z.array(z.object({
    key:     z.string().min(1).max(64),
    level:   z.string().min(1).max(64),
    score:   z.number().min(0).max(10000),
    comment: z.string().max(5000).default(""),
  })).max(30),
  overallComment: z.string().max(10000).optional(),
  allowResubmit:  z.boolean().optional(),
})
