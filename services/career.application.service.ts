import { db } from "@/lib/db"

export type CareerApplicationInput = {
  careerId:        string
  fullName:        string
  email:           string
  mobile:          string
  country:         string
  resumeUrl:       string
  coverLetterUrl?: string | null
  linkedinUrl?:    string | null
  source?:         string | null
}

export type CareerApplicationRow = {
  id:             string
  careerId:       string
  fullName:       string
  email:          string
  mobile:         string
  country:        string
  resumeUrl:      string
  coverLetterUrl: string | null
  linkedinUrl:    string | null
  source:         string | null
  createdAt:      Date
}

export type CareerApplicationServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export async function createCareerApplication(
  input: CareerApplicationInput
): Promise<CareerApplicationServiceResult<CareerApplicationRow>> {
  const career = await db.career.findUnique({ where: { id: input.careerId } })
  if (!career) return { success: false, error: "Career posting not found." }
  if (career.status !== "PUBLISHED") {
    return { success: false, error: "This posting is no longer accepting applications." }
  }

  const application = await db.careerApplication.create({
    data: {
      careerId:       input.careerId,
      fullName:       input.fullName,
      email:          input.email,
      mobile:         input.mobile,
      country:        input.country,
      resumeUrl:      input.resumeUrl,
      coverLetterUrl: input.coverLetterUrl ?? null,
      linkedinUrl:    input.linkedinUrl    ?? null,
      source:         input.source         ?? null,
    },
  })

  // Increment the denormalized count on Career
  await db.career.update({
    where: { id: input.careerId },
    data:  { applications: { increment: 1 } },
  })

  return { success: true, data: application }
}

export async function getCareerApplications(
  careerId: string,
  opts?: { skip?: number; take?: number }
): Promise<{ items: CareerApplicationRow[]; total: number }> {
  const [items, total] = await Promise.all([
    db.careerApplication.findMany({
      where:   { careerId },
      orderBy: { createdAt: "desc" },
      skip:    opts?.skip ?? 0,
      take:    opts?.take ?? 20,
    }),
    db.careerApplication.count({ where: { careerId } }),
  ])
  return { items, total }
}
