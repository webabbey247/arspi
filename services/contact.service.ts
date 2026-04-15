import { db } from "@/lib/db"
import type { ContactInput } from "@/lib/validators/contact"
import { ContactSubject } from "@prisma/client"

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
