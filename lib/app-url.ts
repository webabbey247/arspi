/** Absolute base URL for links in emails. */
export const APP_URL = (process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "")

export const absoluteAppUrl = (path: string) => `${APP_URL}${path.startsWith("/") ? path : `/${path}`}`
