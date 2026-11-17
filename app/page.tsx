import HomeClient, { type HomeInitialData } from "./HomeClient"
import { getPublicInsightsPayload, getPublicProgramsPayload, getPublicWorkshopsPayload, selectWorkshops } from "@/lib/public-data"

// Rendered on the server so programmes, events and insights are in the first
// HTML (no loading placeholders, and visible to search engines). The data is
// cached and cleared on every admin edit; this keeps the page itself at most
// five minutes old, which also keeps "upcoming events" current.
export const revalidate = 300

/** A failed section falls back to the browser fetch instead of failing the page. */
const orNull = <T,>(p: Promise<T>) => p.catch((err: unknown) => {
  console.error("[home] initial data", err)
  return null
})

export default async function Home() {
  const [insights, workshops, programs] = await Promise.all([
    orNull(getPublicInsightsPayload({})),
    orNull(getPublicWorkshopsPayload().then(all => selectWorkshops(all, { sort: "upcoming", limit: 6 }))),
    orNull(getPublicProgramsPayload({}).then(all => all.slice(0, 6))),
  ])

  const initial: HomeInitialData = { insights, workshops, programs }
  return <HomeClient initial={initial} />
}
