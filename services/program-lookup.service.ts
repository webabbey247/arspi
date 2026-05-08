import { db } from "@/lib/db"
import { slugify } from "@/services/program.service"
import type { ProgramServiceResult } from "@/services/program.service"

// ── Types ─────────────────────────────────────────────────────────────────────

export type ProgramLookupRow = {
  id:        string
  name:      string
  slug:      string
  createdAt: Date
  _count:    { courses: number }
}

type LookupKind = "level" | "format" | "pricing"

const TABLE_FOR: Record<LookupKind, "programLevel" | "programFormat" | "programPricing"> = {
  level:   "programLevel",
  format:  "programFormat",
  pricing: "programPricing",
}

const LABEL_FOR: Record<LookupKind, string> = {
  level:   "Level",
  format:  "Format",
  pricing: "Pricing option",
}

// ── Generic CRUD ──────────────────────────────────────────────────────────────

async function listLookup(kind: LookupKind): Promise<ProgramLookupRow[]> {
  const model = db[TABLE_FOR[kind]] as {
    findMany: (args: unknown) => Promise<ProgramLookupRow[]>
  }
  const rows = await model.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { courses: true } } },
  })
  return rows
}

async function createLookup(
  kind: LookupKind,
  name: string,
): Promise<ProgramServiceResult<ProgramLookupRow>> {
  const slug  = slugify(name)
  const model = db[TABLE_FOR[kind]] as {
    findFirst: (args: unknown) => Promise<ProgramLookupRow | null>
    create:    (args: unknown) => Promise<ProgramLookupRow>
  }
  const existing = await model.findFirst({ where: { OR: [{ name }, { slug }] } })
  if (existing) {
    return { success: false, error: `A ${LABEL_FOR[kind].toLowerCase()} with this name already exists.` }
  }

  const row = await model.create({
    data:    { name, slug },
    include: { _count: { select: { courses: true } } },
  })
  return { success: true, data: row }
}

async function updateLookup(
  kind: LookupKind,
  id:   string,
  name: string,
): Promise<ProgramServiceResult<ProgramLookupRow>> {
  const slug  = slugify(name)
  const model = db[TABLE_FOR[kind]] as {
    findUnique: (args: unknown) => Promise<ProgramLookupRow | null>
    findFirst:  (args: unknown) => Promise<ProgramLookupRow | null>
    update:     (args: unknown) => Promise<ProgramLookupRow>
  }
  const existing = await model.findUnique({ where: { id } })
  if (!existing) return { success: false, error: `${LABEL_FOR[kind]} not found.` }

  const conflict = await model.findFirst({
    where: { OR: [{ name }, { slug }], NOT: { id } },
  })
  if (conflict) {
    return { success: false, error: `A ${LABEL_FOR[kind].toLowerCase()} with this name already exists.` }
  }

  const row = await model.update({
    where:   { id },
    data:    { name, slug },
    include: { _count: { select: { courses: true } } },
  })
  return { success: true, data: row }
}

async function deleteLookup(
  kind: LookupKind,
  id:   string,
): Promise<ProgramServiceResult<null>> {
  const model = db[TABLE_FOR[kind]] as {
    findUnique: (args: unknown) => Promise<ProgramLookupRow | null>
    delete:     (args: unknown) => Promise<unknown>
  }
  const existing = await model.findUnique({
    where:   { id },
    include: { _count: { select: { courses: true } } },
  })
  if (!existing) return { success: false, error: `${LABEL_FOR[kind]} not found.` }

  if (existing._count.courses > 0) {
    return {
      success: false,
      error:   `Cannot delete — ${existing._count.courses} program(s) are assigned to this ${LABEL_FOR[kind].toLowerCase()}.`,
    }
  }

  await model.delete({ where: { id } })
  return { success: true, data: null }
}

// ── Public per-kind exports ──────────────────────────────────────────────────

export const getProgramLevels   = () => listLookup("level")
export const getProgramFormats  = () => listLookup("format")
export const getProgramPricings = () => listLookup("pricing")

export const createProgramLevel   = (name: string) => createLookup("level",   name)
export const createProgramFormat  = (name: string) => createLookup("format",  name)
export const createProgramPricing = (name: string) => createLookup("pricing", name)

export const updateProgramLevel   = (id: string, name: string) => updateLookup("level",   id, name)
export const updateProgramFormat  = (id: string, name: string) => updateLookup("format",  id, name)
export const updateProgramPricing = (id: string, name: string) => updateLookup("pricing", id, name)

export const deleteProgramLevel   = (id: string) => deleteLookup("level",   id)
export const deleteProgramFormat  = (id: string) => deleteLookup("format",  id)
export const deleteProgramPricing = (id: string) => deleteLookup("pricing", id)
