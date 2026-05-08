import { db } from "@/lib/db"

// ── Types ─────────────────────────────────────────────────────────────────────

export type OrganizationRow = {
  id:           string
  name:         string
  logo:         string
  url:          string | null
  description:  string | null
  displayOrder: number
  createdAt:    Date
  updatedAt:    Date
}

export type OrganizationInput = {
  name:          string
  logo:          string
  url?:          string | null
  description?:  string | null
  displayOrder?: number
}

export type OrganizationServiceResult<T> =
  | { success: true;  data: T }
  | { success: false; error: string }

// ── CRUD ──────────────────────────────────────────────────────────────────────

export async function getOrganizations(): Promise<OrganizationRow[]> {
  return db.organization.findMany({
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
  })
}

export async function getOrganizationById(id: string): Promise<OrganizationRow | null> {
  return db.organization.findUnique({ where: { id } })
}

export async function createOrganization(
  input: OrganizationInput
): Promise<OrganizationServiceResult<OrganizationRow>> {
  const row = await db.organization.create({
    data: {
      name:         input.name,
      logo:         input.logo,
      url:          input.url         ?? null,
      description:  input.description ?? null,
      displayOrder: input.displayOrder ?? 0,
    },
  })
  return { success: true, data: row }
}

export async function updateOrganization(
  id:    string,
  input: Partial<OrganizationInput>
): Promise<OrganizationServiceResult<OrganizationRow>> {
  const existing = await db.organization.findUnique({ where: { id } })
  if (!existing) return { success: false, error: "Organization not found." }

  const row = await db.organization.update({
    where: { id },
    data: {
      ...(input.name         !== undefined && { name:         input.name }),
      ...(input.logo         !== undefined && { logo:         input.logo }),
      ...(input.url          !== undefined && { url:          input.url }),
      ...(input.description  !== undefined && { description:  input.description }),
      ...(input.displayOrder !== undefined && { displayOrder: input.displayOrder }),
    },
  })
  return { success: true, data: row }
}

export async function deleteOrganization(
  id: string
): Promise<OrganizationServiceResult<null>> {
  const existing = await db.organization.findUnique({ where: { id } })
  if (!existing) return { success: false, error: "Organization not found." }

  await db.organization.delete({ where: { id } })
  return { success: true, data: null }
}
