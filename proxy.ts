import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { getSessionSecret } from "@/lib/auth-secret"

// Maps route prefix → roles that are allowed in
const ROLE_ROUTES: Record<string, string[]> = {
  "/administrator": ["ADMIN"],
  "/instructor":    ["ADMIN", "INSTRUCTOR"],
  "/student":       ["ADMIN", "INSTRUCTOR", "USER"],
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get("arspi-auth")?.value

  // Not authenticated — send to login with callbackUrl
  if (!token) {
    const login = new URL("/login", req.url)
    login.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(login)
  }

  try {
    const { payload } = await jwtVerify(token, getSessionSecret(), { algorithms: ["HS256"] })
    const role = payload.role as string

    for (const [prefix, allowed] of Object.entries(ROLE_ROUTES)) {
      if (pathname.startsWith(prefix) && !allowed.includes(role)) {
        return NextResponse.redirect(new URL("/unauthorized", req.url))
      }
    }

    return NextResponse.next()
  } catch {
    // Expired or tampered token — clear cookie and redirect to login
    const login = new URL("/login", req.url)
    const res = NextResponse.redirect(login)
    res.cookies.delete("arspi-auth")
    return res
  }
}

export const config = {
  matcher: [
    "/administrator",  "/administrator/:path*",
    "/instructor",     "/instructor/:path*",
    "/student",        "/student/:path*",
  ],
}
