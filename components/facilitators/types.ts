import { SITE_NAME } from "@/lib/seo"

/** A directory entry as /api/facilitators returns it. */
export type DirectoryFacilitator = {
  id:          string
  name:        string
  title:       string
  bio:         string
  imageUrl:    string | null
  credentials: string | null
  isInstitute: boolean
  /** Programmes listing this facilitator. */
  programmes:  number
}

/** A facilitator on a programme, as the editor form holds it. */
export type ProgrammeFacilitator = {
  /** Set for directory picks; legacy hand-typed entries have none. */
  facilitatorId?: string
  name:        string
  imageUrl:    string
  title:       string
  bio:         string
  credentials: string
}

export const INSTITUTE_FACILITATOR_ID = "fac_institute"

/** What a new programme starts with. The server refreshes the details from
 *  the directory on save, so only the id has to be right. */
export const DEFAULT_PROGRAMME_FACILITATOR: ProgrammeFacilitator = {
  facilitatorId: INSTITUTE_FACILITATOR_ID,
  name:          SITE_NAME,
  imageUrl:      "",
  title:         "Programme Faculty",
  bio:           `<p>Delivered by the faculty of ${SITE_NAME}.</p>`,
  credentials:   "",
}

export function toProgrammeFacilitator(f: Omit<DirectoryFacilitator, "programmes" | "isInstitute">): ProgrammeFacilitator {
  return {
    facilitatorId: f.id,
    name:          f.name,
    imageUrl:      f.imageUrl ?? "",
    title:         f.title,
    bio:           f.bio,
    credentials:   f.credentials ?? "",
  }
}

/** Reads a programme's stored facilitators into the form's shape. */
export function readProgrammeFacilitators(value: unknown): ProgrammeFacilitator[] {
  if (!Array.isArray(value)) return []
  return (value as Record<string, unknown>[]).map(f => ({
    ...(typeof f.facilitatorId === "string" && { facilitatorId: f.facilitatorId }),
    name:        String(f.name        ?? ""),
    imageUrl:    String(f.imageUrl    ?? ""),
    title:       String(f.title       ?? ""),
    bio:         String(f.bio         ?? ""),
    credentials: String(f.credentials ?? ""),
  }))
}

/** The save payload's facilitators. */
export function facilitatorsPayload(list: ProgrammeFacilitator[]) {
  return list
    .filter(f => f.facilitatorId || f.name.trim())
    .map(f => ({
      ...(f.facilitatorId && { facilitatorId: f.facilitatorId }),
      name:        f.name.trim(),
      imageUrl:    f.imageUrl?.trim() || null,
      title:       f.title.trim() || "Facilitator",
      bio:         f.bio || "<p></p>",
      credentials: f.credentials?.trim() || null,
    }))
}

export function initialsOf(name: string) {
  return name.replace(/^(dr|prof|professor|hon|mr|mrs|ms)\.?\s+/i, "")
    .split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase() ?? "").join("")
}
