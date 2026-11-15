"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import NotFound from "@/app/not-found"
import { publicPreviewHref } from "@/lib/program-preview-links"

/**
 * 404 for a programme page. Draft programmes 404 for the public, but an admin
 * or the programme's instructor opening the URL wants to see the draft before
 * approving it. So: show the normal 404, quietly ask the server whether this
 * user may preview the programme, and if so send them into the preview.
 *
 * Done here rather than in the page so published programme pages stay fully
 * cached — the page itself never reads the session for normal visitors.
 */
export default function ProgramNotFound() {
  const pathname = usePathname()

  useEffect(() => {
    const slug = pathname?.split("/")[2]
    if (!slug) return
    // Already came through the preview route and still 404'd (programme gone,
    // or the preview cookie was blocked) — don't loop.
    if (new URLSearchParams(window.location.search).has("preview")) return

    let live = true
    fetch(`/api/preview/access?slug=${encodeURIComponent(slug)}`)
      .then(r => (r.ok ? r.json() : { allowed: false }))
      .then(d => { if (live && d.allowed) window.location.replace(publicPreviewHref(slug)) })
      .catch(() => {})
    return () => { live = false }
  }, [pathname])

  return <NotFound />
}
