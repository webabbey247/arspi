import { db } from "@/lib/db"
import { OfficeRegion } from "@prisma/client"

export type { OfficeRegion }

// ── Types ─────────────────────────────────────────────────────────────────────

export type GlobalOfficeRow = {
  id:           string
  city:         string
  country:      string
  region:       OfficeRegion
  addressLine1: string
  addressLine2: string | null
  postalCode:   string | null
  phone:        string | null
  email:        string | null
  mapUrl:       string | null
  coverImage:   string | null
  displayOrder: number
  active:       boolean
  createdAt:    Date
  updatedAt:    Date
}

export type GlobalOfficeInput = {
  city:          string
  country:       string
  region?:       OfficeRegion
  addressLine1:  string
  addressLine2?: string | null
  postalCode?:   string | null
  phone?:        string | null
  email?:        string | null
  mapUrl?:       string | null
  coverImage?:   string | null
  displayOrder?: number
  active?:       boolean
}

export type GlobalOfficeServiceResult<T> =
  | { success: true;  data: T }
  | { success: false; error: string }

// ── CRUD ──────────────────────────────────────────────────────────────────────

export async function getGlobalOffices(opts?: {
  region?:    OfficeRegion
  activeOnly?: boolean
}): Promise<GlobalOfficeRow[]> {
  return db.globalOffice.findMany({
    where: {
      ...(opts?.region     !== undefined && { region: opts.region }),
      ...(opts?.activeOnly                && { active: true }),
    },
    orderBy: [{ region: "asc" }, { displayOrder: "asc" }, { city: "asc" }],
  })
}

export async function getGlobalOfficeById(id: string): Promise<GlobalOfficeRow | null> {
  return db.globalOffice.findUnique({ where: { id } })
}

export async function createGlobalOffice(
  input: GlobalOfficeInput
): Promise<GlobalOfficeServiceResult<GlobalOfficeRow>> {
  const row = await db.globalOffice.create({
    data: {
      city:         input.city,
      country:      input.country,
      region:       input.region       ?? "AFRICA",
      addressLine1: input.addressLine1,
      addressLine2: input.addressLine2 ?? null,
      postalCode:   input.postalCode   ?? null,
      phone:        input.phone        ?? null,
      email:        input.email        ?? null,
      mapUrl:       input.mapUrl       ?? null,
      coverImage:   input.coverImage   ?? null,
      displayOrder: input.displayOrder ?? 0,
      active:       input.active        ?? true,
    },
  })
  return { success: true, data: row }
}

export async function updateGlobalOffice(
  id:    string,
  input: Partial<GlobalOfficeInput>
): Promise<GlobalOfficeServiceResult<GlobalOfficeRow>> {
  const existing = await db.globalOffice.findUnique({ where: { id } })
  if (!existing) return { success: false, error: "Office not found." }

  const row = await db.globalOffice.update({
    where: { id },
    data: {
      ...(input.city         !== undefined && { city:         input.city }),
      ...(input.country      !== undefined && { country:      input.country }),
      ...(input.region       !== undefined && { region:       input.region }),
      ...(input.addressLine1 !== undefined && { addressLine1: input.addressLine1 }),
      ...(input.addressLine2 !== undefined && { addressLine2: input.addressLine2 }),
      ...(input.postalCode   !== undefined && { postalCode:   input.postalCode }),
      ...(input.phone        !== undefined && { phone:        input.phone }),
      ...(input.email        !== undefined && { email:        input.email }),
      ...(input.mapUrl       !== undefined && { mapUrl:       input.mapUrl }),
      ...(input.coverImage   !== undefined && { coverImage:   input.coverImage }),
      ...(input.displayOrder !== undefined && { displayOrder: input.displayOrder }),
      ...(input.active       !== undefined && { active:       input.active }),
    },
  })
  return { success: true, data: row }
}

export async function deleteGlobalOffice(
  id: string
): Promise<GlobalOfficeServiceResult<null>> {
  const existing = await db.globalOffice.findUnique({ where: { id } })
  if (!existing) return { success: false, error: "Office not found." }

  await db.globalOffice.delete({ where: { id } })
  return { success: true, data: null }
}
