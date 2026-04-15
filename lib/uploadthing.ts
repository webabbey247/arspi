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
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
