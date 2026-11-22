import RegisterClient from "./RegisterClient"
import { getPublicProgramsPayload } from "@/lib/public-data"

/**
 * Server wrapper so the sign-up copy can quote the live programme count
 * (from the same cached catalogue the Programmes page uses). It also reads
 * the resume parameters (`?step=2|3&uid=…`, sent by the login flow for an
 * unfinished registration) and hands them down.
 */
export default async function RegisterPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : null)

  const programCount = await getPublicProgramsPayload({})
    .then(all => all.length)
    .catch((err: unknown) => {
      console.error("[register] programme count", err)
      return null // falls back to the default label
    })

  return (
    <RegisterClient
      resumeStep={one(params.step)}
      resumeUid={one(params.uid)}
      programCount={programCount}
    />
  )
}
