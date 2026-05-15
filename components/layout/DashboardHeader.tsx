"use client";

import React, { useState, useRef, useEffect } from 'react'
import { Menu } from 'lucide-react'
import type { SessionPayload } from "@/types/session"

async function logout() {
  ['staff_name', 'staff_role'].forEach(k => localStorage.removeItem(k))
  const resp = await fetch('/api/auth/logout', { method: 'POST' })
  window.location.href = resp.redirected ? resp.url : '/login'
}

const DashboardHeader = ({
  user,
  onMenuClick,
}: {
  user: SessionPayload
  onMenuClick?: () => void
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const initials = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .map((n) => n![0].toUpperCase())
    .join("") || user.email[0].toUpperCase()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <>
      <header className="col-span-full bg-white border-b border-[rgba(200,169,110,0.15)] flex items-center justify-between pr-3 sm:pr-6 sticky top-0 z-100 h-15">

        {/* Brand + menu */}
        <div className="flex flex-row items-center gap-2 lg:w-70 px-3 sm:px-[1.2rem] shrink-0 min-w-0">
          {/* Hamburger — mobile only */}
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open menu"
            className="lg:hidden inline-flex items-center justify-center w-8 h-8 rounded-md text-[#0474C4] hover:bg-[rgba(200,169,110,0.08)] cursor-pointer shrink-0"
          >
            <Menu className="w-4.5 h-4.5" />
          </button>

          <div className="w-7 h-7 border-[1.5px] border-[#0474C4] rounded-full flex items-center justify-center font-heading text-[0.6875rem] font-medium text-[#0474C4] shrink-0">
            A
          </div>
          {/* Brand name — Playfair Display, 15px, -0.005em */}
          <span className="font-heading text-[0.9375rem] tracking-[-0.005em] leading-[1.3] font-medium text-[#0474C4] truncate">
            <span className="hidden sm:inline">ARPS Institute</span>
            <span className="sm:hidden">ARPS</span>
          </span>
          {/* Role badge — DM Sans, 10px, +0.07em, font-medium, uppercase */}
          <span className="hidden sm:inline-block font-body text-[0.625rem] tracking-[0.07em] uppercase font-medium bg-[#0474C4] text-white px-1.5 py-0.5 rounded-[3px] ml-0.5 shrink-0">
            {user?.role}
          </span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-[0.8rem] min-w-0">

          {/* Avatar + dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setDropdownOpen(o => !o)}
              className="flex items-center gap-1.75 bg-transparent border-none px-2 sm:px-3 py-1.25 cursor-pointer rounded-lg hover:bg-[rgba(200,169,110,0.08)] transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-[#0474C4]/10 flex items-center justify-center font-body text-[0.6875rem] font-medium text-[#0474C4] shrink-0">
                {initials}
              </div>
              {/* Name — DM Sans, 13px, 0em, font-normal */}
              <span className="hidden sm:inline font-body text-[0.8125rem] tracking-[0em] font-normal text-[#0474C4] truncate max-w-32">
                {user.firstName ?? user.email}
              </span>
              <svg
                viewBox="0 0 24 24"
                className={`w-3 h-3 fill-none stroke-[#0474C4] stroke-2 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                strokeLinecap="round" strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-[#E5E2DC] rounded-xl shadow-lg py-1 z-50 overflow-hidden">

                {/* User info */}
                <div className="px-3.5 py-2.5 border-b border-[#F0EEE9] mb-1">
                  {/* Name — DM Sans, 13px, 0em, font-medium */}
                  <p className="font-body text-[0.8125rem] tracking-[0em] leading-normal font-medium text-[#1A1916] truncate">
                    {user?.firstName}
                  </p>
                  {/* Role — DM Sans, 11px, 0em */}
                  <p className="font-body text-[0.6875rem] tracking-[0em] leading-normal font-normal text-[#A8A39C]">
                    {user?.role}
                  </p>
                </div>

                {/* Menu items — DM Sans, 13px, 0em, font-normal */}
                <button
                  onClick={() => setDropdownOpen(false)}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 font-body text-[0.8125rem] tracking-[0em] font-normal text-[#6B6560] hover:bg-[#FAFAF9] hover:text-[#1A1916] transition-colors cursor-pointer text-left"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0 fill-none stroke-current stroke-[1.8]" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  Settings
                </button>

                <button
                  onClick={() => setDropdownOpen(false)}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 font-body text-[0.8125rem] tracking-[0em] font-normal text-[#6B6560] hover:bg-[#FAFAF9] hover:text-[#1A1916] transition-colors cursor-pointer text-left"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0 fill-none stroke-current stroke-[1.8]" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  Notifications
                </button>

                <div className="my-1 border-t border-[#F0EEE9]" />

                <button
                  onClick={() => { setDropdownOpen(false); setConfirmLogout(true) }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 font-body text-[0.8125rem] tracking-[0em] font-normal text-red-500 hover:bg-red-50 transition-colors cursor-pointer text-left"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0 fill-none stroke-current stroke-[1.8]" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Logout confirm modal */}
      {confirmLogout && (
        <div className="fixed inset-0 z-200 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
          <div className="bg-[#EBF3FC] rounded-2xl w-full max-w-sm mx-4 shadow-2xl overflow-hidden">
            <div className="bg-[#0474C4] p-5 flex items-start justify-between gap-4">
              <div>
                <div className="font-heading text-[1.125rem] tracking-[-0.005em] leading-[1.3] font-medium text-slate-300">
                  Log Out?
                </div>
                <div className="font-body text-[0.75rem] tracking-[0em] leading-normal font-normal text-slate-300 mt-0.5">
                  Are you sure you want to end your session?
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmLogout(false)}
                className="text-white/35 hover:text-white text-xl leading-none shrink-0 bg-[#EDF2FB]/20 rounded-full w-8 h-8 flex items-center justify-center transition-colors cursor-pointer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="px-6 py-5 flex flex-col gap-2">
              <button
                onClick={logout}
                className="w-full px-4 py-2.5 rounded-[32px] bg-[#0474C4] text-white font-body text-[0.875rem] tracking-[0.02em] font-medium hover:bg-[#06457f] transition-colors cursor-pointer"
              >
                Log Out
              </button>
              <button
                onClick={() => setConfirmLogout(false)}
                className="w-full px-4 py-1.5 font-body text-[0.8125rem] tracking-[0em] font-normal text-[#6B6560] bg-transparent border-none cursor-pointer hover:text-[#1A1916] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default DashboardHeader