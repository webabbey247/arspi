/** True only for files hosted on UploadThing's CDN — where every upload in
 *  this app lands (mirrors the remotePatterns in next.config.ts). Used on
 *  every field that should hold an uploaded file, so a submission can't carry
 *  an arbitrary link (phishing / SSRF risk when staff open it). */
export function isUploadThingUrl(value: string): boolean {
  try {
    const url = new URL(value)
    const host = url.hostname.toLowerCase()
    return url.protocol === "https:" && (host === "utfs.io" || host.endsWith(".ufs.sh"))
  } catch {
    return false
  }
}
