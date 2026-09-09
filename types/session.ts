import { z } from "zod"

export const sessionPayloadSchema = z.object({
  sub:       z.string(),
  email:     z.string(),
  role:      z.enum(["ADMIN", "INSTRUCTOR", "USER"]),
  firstName: z.string().nullable(),
  lastName:  z.string().nullable(),
})

export type SessionPayload = z.infer<typeof sessionPayloadSchema>
