import { db } from "@/lib/db"

// ── Types ─────────────────────────────────────────────────────────────────────

export type CertificateRow = {
  id:          string
  userId:      string
  courseId:    string
  verifyCode:  string
  pdfUrl:      string | null
  issuedAt:    Date
  expiresAt:   Date | null
  user: {
    id:      string
    email:   string
    profile: { firstName: string | null; lastName: string | null } | null
  }
  course: {
    id:    string
    title: string
    slug:  string
    instructorName: string | null
  }
}

const certInclude = {
  user: {
    select: {
      id:      true,
      email:   true,
      profile: { select: { firstName: true, lastName: true } },
    },
  },
  course: {
    select: {
      id:             true,
      title:          true,
      slug:           true,
      instructorName: true,
    },
  },
} as const

type ServiceResult<T> =
  | { success: true;  data: T }
  | { success: false; error: string }

// ── Issue ─────────────────────────────────────────────────────────────────────

export async function issueCertificate(
  userId:   string,
  courseId: string
): Promise<ServiceResult<CertificateRow>> {
  // Idempotent — return existing cert if already issued
  const existing = await db.certificate.findUnique({
    where:   { userId_courseId: { userId, courseId } },
    include: certInclude,
  })
  if (existing) return { success: true, data: existing as unknown as CertificateRow }

  try {
    const cert = await db.certificate.create({
      data:    { userId, courseId },
      include: certInclude,
    })
    return { success: true, data: cert as unknown as CertificateRow }
  } catch {
    return { success: false, error: "Failed to issue certificate." }
  }
}

// ── Revoke ────────────────────────────────────────────────────────────────────

export async function revokeCertificate(
  id: string
): Promise<ServiceResult<null>> {
  const existing = await db.certificate.findUnique({ where: { id } })
  if (!existing) return { success: false, error: "Certificate not found." }

  await db.certificate.delete({ where: { id } })
  return { success: true, data: null }
}

// ── Lookups ───────────────────────────────────────────────────────────────────

export async function getCertificateByToken(
  verifyCode: string
): Promise<CertificateRow | null> {
  const cert = await db.certificate.findUnique({
    where:   { verifyCode },
    include: certInclude,
  })
  return cert as unknown as CertificateRow | null
}

export async function getCertificateForEnrollment(
  userId:   string,
  courseId: string
): Promise<CertificateRow | null> {
  const cert = await db.certificate.findUnique({
    where:   { userId_courseId: { userId, courseId } },
    include: certInclude,
  })
  return cert as unknown as CertificateRow | null
}

export async function getCertificatesByProgram(
  courseId: string
): Promise<CertificateRow[]> {
  const certs = await db.certificate.findMany({
    where:   { courseId },
    include: certInclude,
    orderBy: { issuedAt: "desc" },
  })
  return certs as unknown as CertificateRow[]
}
