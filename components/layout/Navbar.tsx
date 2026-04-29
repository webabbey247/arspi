"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { navLinks } from "@/lib/data";

type SessionInfo = {
  role:      "ADMIN" | "INSTRUCTOR" | "USER"
  firstName: string | null
  email:     string
}

const DASHBOARD_HREF: Record<string, string> = {
  ADMIN:      "/administrator",
  INSTRUCTOR: "/instructor",
  USER:       "/student",
}

function getInitials(session: SessionInfo) {
  if (session.firstName) return session.firstName[0].toUpperCase()
  return session.email[0].toUpperCase()
}

// ── Avatar dropdown (mirrors DashboardHeader pattern) ─────────────────────────

function NavAvatarDropdown({ session }: { session: SessionInfo }) {
  const [open, setOpen]     = React.useState(false)
  const ref                 = React.useRef<HTMLDivElement>(null)
  const initials            = getInitials(session)

  React.useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  function logout() {
    window.location.href = "/api/auth/logout"
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 bg-transparent border-none px-2 py-1 cursor-pointer rounded hover:bg-transparent transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-[#0474C4]/10 flex items-center justify-center font-body text-[0.6875rem] font-medium text-[#0474C4]">
          {initials}
        </div>
        <span className="font-body text-[0.8125rem] tracking-[0em] font-normal text-[#0474C4]">
          {session.firstName ?? session.email}
        </span>
        <svg
          viewBox="0 0 24 24"
          className={`w-3 h-3 fill-none stroke-[#0474C4] stroke-2 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-[#E5E2DC] rounded shadow-lg py-1 z-50 overflow-hidden">
          <div className="px-3.5 py-2.5 border-b border-[#F0EEE9] mb-1">
            <p className="font-body text-[0.8125rem] tracking-[0em] font-medium text-[#1A1916] truncate">
              {session.firstName ?? session.email}
            </p>
            <p className="font-body text-[0.6875rem] tracking-[0em] font-normal text-[#A8A39C]">
              {session.role}
            </p>
          </div>
          <Link
            href={DASHBOARD_HREF[session.role] ?? "/"}
            onClick={() => setOpen(false)}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 font-body text-[0.8125rem] tracking-[0em] font-normal text-[#6B6560] hover:bg-[#FAFAF9] hover:text-[#1A1916] transition-colors no-underline"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0 fill-none stroke-current stroke-[1.8]" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
            Dashboard
          </Link>
          <div className="my-1 border-t border-[#F0EEE9]" />
          <button
            onClick={() => { setOpen(false); logout() }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 font-body text-[0.8125rem] tracking-[0em] font-normal text-red-500 hover:bg-red-50 transition-colors cursor-pointer text-left"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0 fill-none stroke-current stroke-[1.8]" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Logout
          </button>
        </div>
      )}
    </div>
  )
}

// ── Navbar ─────────────────────────────────────────────────────────────────────

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen]           = React.useState(false);
  const [session, setSession]                 = React.useState<SessionInfo | null | undefined>(undefined)

  React.useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then((data: SessionInfo | null) => setSession(data))
      .catch(() => setSession(null))
  }, [])

  return (
    <header className="sticky top-0 z-50 h-17 flex items-center bg-white backdrop-blur-[14px] border-b border-[#5379AE]/20 w-full">
      <div className="w-full flex items-center justify-between px-8 md:px-16">

        <Link href="/" className="flex justify-start gap-2.5 shrink-0 no-underline w-50">
          <div className="flex flex-row justify-start items-center gap-2.5 px-[1.2rem] shrink-0">
            <div className="w-8 h-8 border-[1.5px] border-[#0474C4] rounded-full flex items-center justify-center font-heading text-lg font-medium text-[#0474C4] shrink-0">
              A
            </div>
            <span className="font-heading text-xl tracking-[-0.005em] leading-[1.3] font-medium text-[#0474C4]">
              ARPS Institute
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-7">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`${
                pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href))
                  ? "text-[#0474c4]"
                  : "text-[#262b40] hover:text-[#0474c4]"
              } font-body text-[1rem] tracking-[0.01em] leading-normal font-normal capitalize transition-colors`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Auth section */}
        <div className="hidden lg:flex items-center gap-4 shrink-0">
          {session ? (
            // Authenticated: Dashboard link + avatar dropdown on the same row
              <NavAvatarDropdown session={session} />
          ) : session === null ? (
            // Not authenticated: Sign In + Get Started
            <>
              <Link
                className="font-body text-[0.9375rem] tracking-[0.01em] leading-normal font-normal text-[#0474C4]"
                href="/login"
              >
                Sign In
              </Link>
              <Button
                asChild
                className="h-12 rounded-[32px] py-2.5 px-5 text-[#EBF3FC] bg-[#0474C4] text-[0.875rem] tracking-[0.02em] font-medium transition-colors duration-200 hover:bg-[#06457F] hover:border-[#06457F]"
              >
                <Link href="/register">
                  Get Started <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </>
          ) : null /* loading — render nothing to avoid layout shift */}
        </div>

        {/* Mobile toggle */}
        <button
          className="lg:hidden transition-colors"
          style={{ color: "rgba(255,255,255,0.65)" }}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="lg:hidden absolute top-17 left-0 right-0 border-b shadow-xl z-40"
          style={{ background: "rgba(38,43,64,0.98)", borderColor: "rgba(83,121,174,0.18)" }}
        >
          <div className="flex flex-col py-4 px-6 gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="py-2.5 text-[0.82rem] tracking-widest uppercase transition-colors"
                style={{ color: pathname === link.href ? "#0474C4" : "rgba(255,255,255,0.65)" }}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex gap-2 pt-4 mt-2" style={{ borderTop: "1px solid rgba(83,121,174,0.18)" }}>
              {session ? (
                <Link
                  href={DASHBOARD_HREF[session.role] ?? "/"}
                  className="flex-1 text-center py-2 rounded-lg bg-[#0474C4] text-white text-[0.8125rem] font-medium no-underline"
                  onClick={() => setMobileOpen(false)}
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Button size="sm" className="flex-1" asChild>
                    <Link href="/login" onClick={() => setMobileOpen(false)}>Sign In</Link>
                  </Button>
                  <Button size="sm" className="flex-1" asChild>
                    <Link href="/register" onClick={() => setMobileOpen(false)}>Get Started</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
