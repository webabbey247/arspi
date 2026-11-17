import { revalidatePath, revalidateTag } from "next/cache"

/**
 * Cache tags for the public JSON APIs the marketing pages call on every
 * visit. Each route caches its payload (5-minute ceiling) under its tag, and
 * every admin write that changes what the public sees clears the tag — so
 * edits appear immediately and visitors don't hit the database on each load.
 */
export const WORKSHOPS_PUBLIC_TAG = "workshops-public"
export const TEAM_PUBLIC_TAG      = "team-public"
export const CAREERS_PUBLIC_TAG   = "careers-public"

/** Longest a public payload is served before it's rebuilt anyway. */
export const PUBLIC_REVALIDATE_SECONDS = 300

/** Also clears the cached /workshop/[slug] detail pages (ISR, 5 minutes). */
export const bumpWorkshopsPublicCache = () => {
  revalidateTag(WORKSHOPS_PUBLIC_TAG, "max")
  revalidatePath("/workshop/[slug]", "page")
}
export const bumpTeamPublicCache      = () => revalidateTag(TEAM_PUBLIC_TAG, "max")
export const bumpCareersPublicCache   = () => revalidateTag(CAREERS_PUBLIC_TAG, "max")
