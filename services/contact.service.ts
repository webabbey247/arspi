import { db } from "@/lib/db"
import type { ContactInput } from "@/lib/validators/contact"
import { ContactStatus, ContactSubject } from "@prisma/client"

export type { ContactStatus, ContactSubject }

export type ContactMessageRow = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  subject: ContactSubject
  message: string
  status: ContactStatus
  createdAt: Date
}

export type SaveContactResult =
  | { success: true; id: string }
  | { success: false; error: string }

export async function saveContactMessage(input: ContactInput): Promise<SaveContactResult> {
  const message = await db.contactMessage.create({
    data: {
      firstName: input.firstName,
      lastName:  input.lastName,
      email:     input.email,
      phone:     input.phone ?? null,
      subject:   input.subject as ContactSubject,
      message:   input.message,
    },
    select: { id: true },
  })

  return { success: true, id: message.id }
}

export async function getContactMessages(filters?: {
  status?: ContactStatus
  subject?: ContactSubject
  search?: string
}): Promise<ContactMessageRow[]> {
  return db.contactMessage.findMany({
    where: {
      ...(filters?.status !== undefined && { status: filters.status }),
      ...(filters?.subject !== undefined && { subject: filters.subject }),
      ...(filters?.search && {
        OR: [
          { firstName: { contains: filters.search, mode: "insensitive" } },
          { lastName: { contains: filters.search, mode: "insensitive" } },
          { email: { contains: filters.search, mode: "insensitive" } },
          { message: { contains: filters.search, mode: "insensitive" } },
        ],
      }),
    },
    orderBy: { createdAt: "desc" },
  })
}
