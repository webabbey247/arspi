import { createUploadthing, type FileRouter } from "uploadthing/server"

const f = createUploadthing()

export const ourFileRouter = {
  /** Single image upload for insight cover photos and author avatars */
  imageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      // Auth is enforced at the API-route level; uploadthing middleware is intentionally minimal
      return {}
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl }
    }),

  /** Document upload (resumes, cover letters) — PDF and Word formats */
  documentUploader: f({
    pdf: { maxFileSize: "8MB", maxFileCount: 1 },
    "application/msword": { maxFileSize: "8MB", maxFileCount: 1 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { maxFileSize: "8MB", maxFileCount: 1 },
  })
    .middleware(async () => ({}))
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
