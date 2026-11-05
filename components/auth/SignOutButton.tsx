"use client"

import { useState } from "react"
import { LogOut } from "lucide-react"

/**
 * Sign-out as a scripted request rather than a native form POST.
 *
 * A plain `<form method="post">` cannot set a header, so it has no way to
 * carry the CSRF token and would be rejected by the proxy. Going through
 * fetch picks the token up automatically (see CsrfFetch), and lets us follow
 * whatever redirect the route replies with.
 */
export default function SignOutButton({ className }: { className?: string }) {
  const [busy, setBusy] = useState(false)

  async function signOut() {
    if (busy) return
    setBusy(true)
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" })
      window.location.href = res.redirected ? res.url : "/login"
    } catch {
      // Even if the call fails the cookies may be gone; send them to login so
      // they are never stranded on a page they can no longer use.
      window.location.href = "/login"
    }
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={busy}
      title="Sign out"
      className={className}
    >
      <LogOut className="h-4 w-4" />
    </button>
  )
}
