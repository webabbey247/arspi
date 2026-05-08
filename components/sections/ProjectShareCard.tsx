"use client"

import { useState } from "react"

type Props = {
  title: string
  url:   string
  excerpt?: string
  /** Override the default "Share this project" kicker — e.g. "Share this workshop". */
  kicker?: string
  /** Override the default supporting line under the kicker. */
  subline?: string
}

export default function ProjectShareCard({
  title,
  url,
  excerpt,
  kicker  = "Share this project",
  subline = "Help spread evidence-led research with your network.",
}: Props) {
  const [copied, setCopied] = useState(false)

  const encodedUrl   = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)
  const encodedBody  = encodeURIComponent(excerpt ?? title)

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  const shareLinks = [
    {
      name: "Twitter",
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
    },
    {
      name: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      ),
    },
    {
      name: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073"/>
        </svg>
      ),
    },
    {
      name: "Email",
      href: `mailto:?subject=${encodedTitle}&body=${encodedBody}%0A%0A${encodedUrl}`,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="4" width="20" height="16" rx="2"/>
          <path d="m22 7-10 6L2 7"/>
        </svg>
      ),
    },
  ]

  return (
    <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
      <p className="font-body text-[0.6875rem] tracking-[0.1em] uppercase font-medium text-[#5EEAD4] mb-2">
        {kicker}
      </p>
      <p className="font-body text-[0.8125rem] leading-[1.55] text-[#EBF3FC]/55 mb-5">
        {subline}
      </p>

      <div className="grid grid-cols-2 gap-2 mb-2">
        {shareLinks.map(s => (
          <a
            key={s.name}
            href={s.href}
            target="_blank"
            rel="noreferrer"
            aria-label={`Share on ${s.name}`}
            className="flex items-center gap-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-[#5EEAD4]/30 rounded-lg px-3 py-2 transition-colors no-underline"
          >
            <span className="text-[#EBF3FC]/75">{s.icon}</span>
            <span className="font-body text-[0.8125rem] tracking-[0em] font-medium text-[#EBF3FC]/85">
              {s.name}
            </span>
          </a>
        ))}
      </div>

      <button
        type="button"
        onClick={copyLink}
        className="w-full flex items-center justify-center gap-2 bg-[#0474C4] hover:bg-[#06457F] disabled:opacity-70 text-white rounded-lg px-3 py-2.5 transition-colors cursor-pointer"
      >
        {copied ? (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
            <span className="font-body text-[0.8125rem] font-medium">Link copied</span>
          </>
        ) : (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <rect x="9" y="9" width="13" height="13" rx="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            <span className="font-body text-[0.8125rem] font-medium">Copy link</span>
          </>
        )}
      </button>
    </div>
  )
}
