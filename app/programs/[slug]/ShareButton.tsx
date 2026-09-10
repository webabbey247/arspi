"use client"

import { useState } from "react"

/** Copies the current page URL to the clipboard — plain text link, matching
 *  the reference design's "Share" link (no icon). */
export default function ShareButton({ className }: { className?: string }) {
  const [copied, setCopied] = useState(false)

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API unavailable (rare) — silently no-op rather than error.
    }
  }

  return (
    <button type="button" onClick={handleClick} className={className}>
      {copied ? "Copied!" : "Share"}
    </button>
  )
}
