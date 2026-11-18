import { z } from "zod"
import { isUploadThingUrl } from "@/lib/upload-url"

/** Body for creating or editing a facilitator directory entry. */
export const facilitatorBodySchema = z.object({
  name:        z.string().trim().min(1, "Full name is required").max(120),
  title:       z.string().trim().min(1, "Title / role is required").max(160),
  bio:         z.string().trim().min(1, "Biography is required").max(4000, "Biography is too long"),
  imageUrl:    z.string().trim().max(500).nullable().optional()
    .refine(v => !v || isUploadThingUrl(v), "Upload the photo instead of linking to it"),
  credentials: z.string().trim().max(1000).nullable().optional(),
})
