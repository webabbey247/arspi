import { createUploadthing, type FileRouter } from "uploadthing/server"
import { UploadThingError } from "uploadthing/server"
import { getSession } from "@/lib/session"

const f = createUploadthing()

async function requireAuthenticated() {
  const session = await getSession()
  if (!session) throw new UploadThingError("Unauthorized")
  return session
}

async function requireStaff() {
  const session = await getSession()
  if (!session || (session.role !== "ADMIN" && session.role !== "INSTRUCTOR")) {
    throw new UploadThingError("Unauthorized")
  }
  return session
}

export const ourFileRouter = {
  /** Single image upload for insight cover photos and author avatars — any signed-in user */
  imageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await requireAuthenticated()
      return { userId: session.sub }
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl }
    }),

  /** Document upload (resumes, cover letters) — used by public career applicants, intentionally unauthenticated.
   *  Abuse is bounded by the 8 MB cap and file-type whitelist; consider IP rate-limiting in proxy.ts. */
  documentUploader: f({
    pdf: { maxFileSize: "8MB", maxFileCount: 1 },
    "application/msword": { maxFileSize: "8MB", maxFileCount: 1 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { maxFileSize: "8MB", maxFileCount: 1 },
  })
    .middleware(async () => ({}))
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl }
    }),

  /** PDF upload for lesson content blocks — admin or instructor only */
  pdfUploader: f({ pdf: { maxFileSize: "32MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await requireStaff()
      return { userId: session.sub }
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl, name: file.name, size: file.size }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
