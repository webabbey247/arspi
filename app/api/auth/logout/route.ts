import { NextResponse } from "next/server"
import { cookies } from "next/headers"

// POST-only so logout can't be triggered by an attacker embedding
// <img src="/api/auth/logout"> on a third-party page.
export async function POST() {
  const cookieStore = await cookies()
  cookieStore.delete("arspi-auth")
  return NextResponse.redirect(
    new URL("/login", process.env.NEXTAUTH_URL ?? "http://localhost:3000"),
    303, // See Other — browser follows with GET after the POST
  )
}
