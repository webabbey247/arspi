import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"

/** GET /api/auth/me — returns the current session for client components */
export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json(null)
  return NextResponse.json({
    role:      session.role,
    firstName: session.firstName,
    email:     session.email,
  })
}
