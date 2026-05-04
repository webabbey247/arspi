import { db } from "@/lib/db"
import { TeamCategory } from "@prisma/client"

export type { TeamCategory }

export type TeamMemberRow = {
  id:           string
  name:         string
  position:     string
  category:     TeamCategory
  coverImage:   string | null
  description:  string | null
  displayOrder: number
  createdAt:    Date
  updatedAt:    Date
}

export type TeamMemberInput = {
  name:          string
  position:      string
  category?:     TeamCategory
  coverImage?:   string | null
  description?:  string | null
  displayOrder?: number
}

export type TeamServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export async function getTeamMembers(opts?: {
  skip?: number
  take?: number
  category?: TeamCategory
}): Promise<{ items: TeamMemberRow[]; total: number }> {
  const where = opts?.category ? { category: opts.category } : {}
  const [items, total] = await Promise.all([
    db.teamMember.findMany({
      where,
      orderBy: [{ category: "asc" }, { displayOrder: "asc" }, { createdAt: "asc" }],
      skip: opts?.skip ?? 0,
      take: opts?.take ?? 20,
    }),
    db.teamMember.count({ where }),
  ])
  return { items, total }
}

export async function getTeamMemberById(id: string): Promise<TeamMemberRow | null> {
  return db.teamMember.findUnique({ where: { id } })
}

/** All members grouped by category — used by the public team page. */
export async function getPublicTeamData(): Promise<Record<TeamCategory, TeamMemberRow[]>> {
  const members = await db.teamMember.findMany({
    orderBy: [{ category: "asc" }, { displayOrder: "asc" }, { createdAt: "asc" }],
  })
  const grouped: Record<TeamCategory, TeamMemberRow[]> = {
    EXECUTIVE_MANAGEMENT: [],
    STAFF:                [],
  }
  for (const m of members) grouped[m.category].push(m)
  return grouped
}

export async function createTeamMember(
  input: TeamMemberInput
): Promise<TeamServiceResult<TeamMemberRow>> {
  const member = await db.teamMember.create({
    data: {
      name:         input.name,
      position:     input.position,
      category:     input.category     ?? "STAFF",
      coverImage:   input.coverImage   ?? null,
      description:  input.description  ?? null,
      displayOrder: input.displayOrder ?? 0,
    },
  })
  return { success: true, data: member }
}

export async function updateTeamMember(
  id: string,
  input: Partial<TeamMemberInput>
): Promise<TeamServiceResult<TeamMemberRow>> {
  const existing = await db.teamMember.findUnique({ where: { id } })
  if (!existing) return { success: false, error: "Team member not found." }

  const member = await db.teamMember.update({
    where: { id },
    data: {
      ...(input.name         !== undefined && { name:         input.name }),
      ...(input.position     !== undefined && { position:     input.position }),
      ...(input.category     !== undefined && { category:     input.category }),
      ...(input.coverImage   !== undefined && { coverImage:   input.coverImage }),
      ...(input.description  !== undefined && { description:  input.description }),
      ...(input.displayOrder !== undefined && { displayOrder: input.displayOrder }),
    },
  })
  return { success: true, data: member }
}

export async function deleteTeamMember(id: string): Promise<TeamServiceResult<null>> {
  const existing = await db.teamMember.findUnique({ where: { id } })
  if (!existing) return { success: false, error: "Team member not found." }
  await db.teamMember.delete({ where: { id } })
  return { success: true, data: null }
}
