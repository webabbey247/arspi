import ProgramsClient, { type ProgramsInitialData } from "./ProgramsClient"
import { getPublicProgramsPayload } from "@/lib/public-data"

// Rendered on the server so the catalogue is in the first HTML (no loading
// state, indexable). Filtering and paging stay in the browser. The data is
// cached and cleared on every programme edit; the page is at most five
// minutes old.
export const revalidate = 300

export default async function ProgramsPage() {
  let initial: ProgramsInitialData = null
  try {
    initial = { programs: await getPublicProgramsPayload({}) }
  } catch (err) {
    // The client fetches it instead.
    console.error("[programs] initial data", err)
  }
  return <ProgramsClient initial={initial} />
}
