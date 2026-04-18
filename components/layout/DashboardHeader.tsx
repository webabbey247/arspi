"use client";

import React, { useState, useRef, useEffect } from 'react'
import type { SessionPayload } from "@/types/session"

async function logout() {
  ['staff_name', 'staff_role'].forEach(k => localStorage.removeItem(k))
  window.location.href = '/api/auth/logout'
}

const DashboardHeader = ({ user }: { user: SessionPayload }) => {
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
      <header className="col-span-full bg-white border-b border-[rgba(200,169,110,0.15)] flex items-center justify-between pr-6 sticky top-0 z-200 h-15">

        {/* Brand */}
        <div className="w-70 flex flex-row items-center gap-2.5 px-[1.2rem] shrink-0">
          <div className="w-7 h-7 border-[1.5px] border-[#0474C4] rounded-full flex items-center justify-center font-heading text-[0.6875rem] font-medium text-[#0474C4] shrink-0">
            A
          </div>
          {/* Brand name — Playfair Display, 15px, -0.005em */}
          <span className="font-heading text-[0.9375rem] tracking-[-0.005em] leading-[1.3] font-medium text-[#0474C4]">
            ARPS Institute
          </span>
          {/* Role badge — DM Sans, 10px, +0.07em, font-medium, uppercase */}
          <span className="font-body text-[0.625rem] tracking-[0.07em] uppercase font-medium bg-[#0474C4] text-white px-1.5 py-0.5 rounded-[3px] ml-0.5">
            {user?.role}
          </span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-[0.8rem]">

          {/* Avatar + dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setDropdownOpen(o => !o)}
              className="flex items-center gap-1.75 bg-transparent border-none px-3 py-1.25 cursor-pointer rounded-lg hover:bg-[rgba(200,169,110,0.08)] transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-[#0474C4]/10 flex items-center justify-center font-body text-[0.6875rem] font-medium text-[#0474C4]">
                {initials}
              </div>
              {/* Name — DM Sans, 13px, 0em, font-normal */}
              <span className="font-body text-[0.8125rem] tracking-[0em] font-normal text-[#0474C4]">
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
          <div className="bg-white rounded-2xl border border-[#E5E2DC] w-full max-w-sm mx-4 shadow-2xl">
            <div className="px-6 pt-6 pb-4 border-b border-[#F0EEE9]">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 stroke-[#0474C4] fill-none stroke-[1.8]" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </div>
                <div>
                  {/* Label — DM Sans, 11px, +0.07em, font-medium, uppercase */}
                  <p className="font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-[#0474C4]">
                    Session
                  </p>
                  {/* H2 — Playfair Display, 16px, -0.005em, lh 1.3 */}
                  <h2 className="font-heading text-[1rem] tracking-[-0.005em] leading-[1.3] font-medium text-[#1A1916]">
                    Log Out?
                  </h2>
                </div>
              </div>
              {/* Body — DM Sans, 13px, 0em, lh 1.6 */}
              <p className="font-body text-[0.8125rem] tracking-[0em] leading-[1.6] font-normal text-[#A8A39C] mt-1">
                Are you sure you want to log out?
              </p>
            </div>

            <div className="px-6 py-4 flex flex-col gap-2">
              {/* Button — DM Sans, 13px, +0.02em, font-medium */}
              <button
                onClick={logout}
                className="w-full px-4 py-2.5 rounded-[10px] bg-[#0474C4] text-white font-body text-[0.8125rem] tracking-[0.02em] font-medium hover:bg-[#06457f] transition-colors cursor-pointer"
              >
                Log Out
              </button>
              {/* Cancel — DM Sans, 13px, 0em, font-normal */}
              <button
                onClick={() => setConfirmLogout(false)}
                className="w-full px-4 py-1.5 font-body text-[0.8125rem] tracking-[0em] font-normal text-[#A8A39C] bg-transparent border-none cursor-pointer hover:text-[#6B6560] transition-colors"
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