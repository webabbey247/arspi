import { db } from "@/lib/db"
import { WorkshopPaymentMethod, WorkshopType, WorkshopCategory, WorkshopRegistrationStatus } from "@prisma/client"
import type { WorkshopRegistrationPayload } from "@/lib/validators/workshop"

export type { WorkshopType, WorkshopCategory, WorkshopRegistrationStatus }

// ── Registration (existing) ───────────────────────────────────────────────────

export type WorkshopRegistrationResult =
  | { success: true; id: string }
  | { success: false; error: string }

export async function registerForWorkshop(
  input: WorkshopRegistrationPayload
): Promise<WorkshopRegistrationResult> {
  const registration = await db.workshopRegistration.create({
    data: {
      firstName:     input.firstName,
      lastName:      input.lastName,
      email:         input.email,
      organisation:  input.organisation ?? null,
      workshopTitle: input.workshopTitle,
      workshopDate:  input.workshopDate,
      workshopTime:  input.workshopTime,
      fee:           input.fee,
      paymentMethod: input.paymentMethod
        ? (input.paymentMethod as WorkshopPaymentMethod)
        : null,
      // Free workshops are confirmed immediately; paid workshops use the Stripe checkout flow
      status:     input.fee === 0 ? "CONFIRMED" : "PENDING",
      workshopId: input.workshopId ?? null,
    },
    select: { id: true },
  })

  return { success: true, id: registration.id }
}

// ── Workshop CRUD ─────────────────────────────────────────────────────────────

export type WorkshopRow = {
  id: string
  title: string
  slug: string
  description: string
  type: WorkshopType
  category: WorkshopCategory
  fee: number
  featured: boolean
  published: boolean
  date: Date | null
  startTime: string
  endTime:   string
  timezone:  string
  duration: number
  level: string
  facilitator:    string
  facilitators:   unknown | null
  medium:         string
  onlinePlatform: string | null
  onlineLink:     string | null
  venueAddress:   string | null
  venueCity:      string | null
  venueState:     string | null
  venueCountry:   string | null
  capacity: number
  registered: number
  coverImage: string | null
  instructorId: string | null
  createdAt: Date
  updatedAt: Date
  _count?: { registrations: number }
}

export type WorkshopInput = {
  title: string
  slug?: string
  description: string
  type?: WorkshopType
  category?: WorkshopCategory
  fee?: number
  featured?: boolean
  published?: boolean
  date?: string | null
  startTime?: string
  endTime?:   string
  timezone?:  string
  duration?: number
  level?: string
  facilitator?:    string
  facilitators?:   unknown | null
  medium?:         string
  onlinePlatform?: string | null
  onlineLink?:     string | null
  venueAddress?:   string | null
  venueCity?:      string | null
  venueState?:     string | null
  venueCountry?:   string | null
  capacity?: number
  coverImage?: string | null
  instructorId?: string | null
}

export type WorkshopServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export async function getWorkshops(filters?: {
  type?: WorkshopType
  category?: WorkshopCategory
  published?: boolean
  featured?: boolean
  instructorId?: string
}): Promise<WorkshopRow[]> {
  return db.workshop.findMany({
    where: {
      ...(filters?.type         !== undefined && { type:         filters.type }),
      ...(filters?.category     !== undefined && { category:     filters.category }),
      ...(filters?.published    !== undefined && { published:    filters.published }),
      ...(filters?.featured     !== undefined && { featured:     filters.featured }),
      ...(filters?.instructorId !== undefined && { instructorId: filters.instructorId }),
    },
    include: { _count: { select: { registrations: true } } },
    orderBy: { createdAt: "desc" },
  })
}

export async function getWorkshopById(id: string): Promise<WorkshopRow | null> {
  return db.workshop.findUnique({
    where: { id },
    include: { _count: { select: { registrations: true } } },
  })
}

export async function getWorkshopBySlug(slug: string): Promise<WorkshopRow | null> {
  return db.workshop.findUnique({
    where: { slug },
    include: { _count: { select: { registrations: true } } },
  })
}

export async function createWorkshop(
  input: WorkshopInput
): Promise<WorkshopServiceResult<WorkshopRow>> {
  const slug = input.slug ?? slugify(input.title)

  const existing = await db.workshop.findUnique({ where: { slug } })
  if (existing) {
    return { success: false, error: "A workshop with this slug already exists." }
  }

  const workshop = await db.workshop.create({
    data: {
      title:        input.title,
      slug,
      description:  input.description,
      type:         input.type        ?? "FREE",
      category:     input.category    ?? "WORKSHOP",
      fee:          input.fee         ?? 0,
      featured:     input.featured    ?? false,
      published:    input.published   ?? false,
      date:         input.date        ? new Date(input.date) : null,
      startTime:    input.startTime   ?? "",
      endTime:      input.endTime     ?? "",
      timezone:     input.timezone    ?? "UTC",
      duration:     input.duration    ?? 2,
      level:        input.level       ?? "BEGINNER",
      facilitator:    input.facilitator  ?? "",
      facilitators:   (input.facilitators  ?? null) as never,
      medium:         input.medium        ?? "ONLINE",
      onlinePlatform: input.onlinePlatform ?? null,
      onlineLink:     input.onlineLink     ?? null,
      venueAddress:   input.venueAddress   ?? null,
      venueCity:      input.venueCity      ?? null,
      venueState:     input.venueState     ?? null,
      venueCountry:   input.venueCountry   ?? null,
      capacity:     input.capacity    ?? 100,
      coverImage:   input.coverImage  ?? null,
      instructorId: input.instructorId ?? null,
    },
    include: { _count: { select: { registrations: true } } },
  })

  return { success: true, data: workshop }
}

export async function updateWorkshop(
  id: string,
  input: Partial<WorkshopInput>
): Promise<WorkshopServiceResult<WorkshopRow>> {
  const existing = await db.workshop.findUnique({ where: { id } })
  if (!existing) return { success: false, error: "Workshop not found." }

  if (input.slug && input.slug !== existing.slug) {
    const conflict = await db.workshop.findUnique({ where: { slug: input.slug } })
    if (conflict) {
      return { success: false, error: "A workshop with this slug already exists." }
    }
  }

  const workshop = await db.workshop.update({
    where: { id },
    data: {
      ...(input.title       !== undefined && { title:       input.title }),
      ...(input.slug        !== undefined && { slug:        input.slug }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.type        !== undefined && { type:        input.type }),
      ...(input.category    !== undefined && { category:    input.category }),
      ...(input.fee         !== undefined && { fee:         input.fee }),
      ...(input.featured    !== undefined && { featured:    input.featured }),
      ...(input.published   !== undefined && { published:   input.published }),
      ...(input.date        !== undefined && { date:      input.date ? new Date(input.date) : null }),
      ...(input.startTime   !== undefined && { startTime: input.startTime }),
      ...(input.endTime     !== undefined && { endTime:   input.endTime }),
      ...(input.timezone    !== undefined && { timezone:  input.timezone }),
      ...(input.duration    !== undefined && { duration:    input.duration }),
      ...(input.level       !== undefined && { level:       input.level }),
      ...(input.facilitator   !== undefined && { facilitator:    input.facilitator }),
      ...(input.facilitators  !== undefined && { facilitators:   input.facilitators  as never }),
      ...(input.medium        !== undefined && { medium:         input.medium }),
      ...(input.onlinePlatform !== undefined && { onlinePlatform: input.onlinePlatform }),
      ...(input.onlineLink    !== undefined && { onlineLink:     input.onlineLink }),
      ...(input.venueAddress  !== undefined && { venueAddress:   input.venueAddress }),
      ...(input.venueCity     !== undefined && { venueCity:      input.venueCity }),
      ...(input.venueState    !== undefined && { venueState:     input.venueState }),
      ...(input.venueCountry  !== undefined && { venueCountry:   input.venueCountry }),
      ...(input.capacity    !== undefined && { capacity:    input.capacity }),
      ...(input.coverImage   !== undefined && { coverImage:   input.coverImage }),
      ...(input.instructorId !== undefined && { instructorId: input.instructorId }),
    },
    include: { _count: { select: { registrations: true } } },
  })

  return { success: true, data: workshop }
}

// ── Registrations ─────────────────────────────────────────────────────────────

export type RegistrationRow = {
  id:            string
  firstName:     string
  lastName:      string
  email:         string
  organisation:  string | null
  paymentMethod: WorkshopPaymentMethod | null
  status:        WorkshopRegistrationStatus
  fee:           number
  createdAt:     Date
}

export async function getWorkshopRegistrations(workshopId: string): Promise<RegistrationRow[]> {
  return db.workshopRegistration.findMany({
    where: { workshopId },
    select: {
      id:            true,
      firstName:     true,
      lastName:      true,
      email:         true,
      organisation:  true,
      paymentMethod: true,
      status:        true,
      fee:           true,
      createdAt:     true,
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function deleteWorkshop(id: string): Promise<WorkshopServiceResult<null>> {
  const existing = await db.workshop.findUnique({
    where: { id },
    include: { _count: { select: { registrations: true } } },
  })
  if (!existing) return { success: false, error: "Workshop not found." }
  if (existing._count.registrations > 0) {
    return {
      success: false,
      error: `Cannot delete — ${existing._count.registrations} registration(s) exist for this workshop.`,
    }
  }

  await db.workshop.delete({ where: { id } })
  return { success: true, data: null }
}
