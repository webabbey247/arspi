"use client";

import React, { useState, useRef, useEffect } from 'react'
import type { SessionPayload } from "@/types/session"

async function logout() {
  // Clear any client-side keys
  ['staff_name', 'staff_role'].forEach(k => localStorage.removeItem(k))
  // Hit the logout route — it deletes the httpOnly arspi-auth cookie then
  // issues a redirect to /login. Full navigation ensures React state is reset.
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
          <div className="w-7 h-7 border-[1.5px] border-[#0474C4] rounded-full flex items-center justify-center text-[10px] text-[#0474C4] font-medium [font-family:var(--font-playfair-display),serif] shrink-0">A</div>
          <span className="font-heading text-[0.95rem] text-[#0474C4] tracking-[0.06em]">ARPS Institute</span>
          <span className="text-[0.55rem] bg-[#0474C4] text-white px-1.5 py-0.5 rounded-[3px] tracking-widest uppercase font-medium ml-0.5">{user?.role}</span>
        </div>
        {/* <div className="w-80 flex items-center gap-2.5 px-[1.2rem] shrink-0">
          <div className="w-12 h-12 rounded-[22px] bg-[#0474C4] flex items-center justify-center text-[38px]">
            🦁
          </div>
          <div className="flex flex-col">
            <h4 className="text-[#0474C4] text-xl font-extrabold mb-0 leading-none">Lion POS</h4>
            <p className="text-[#A8A39C] text-sm mb-0">Manager</p>
          </div>
        </div> */}

        {/* Right side */}
        <div className="flex items-center gap-[0.8rem]">
          {/* Chat button */}
          {/* <button className="relative w-8 h-8 rounded-full border border-[#0474C4]/10 bg-[#0474C4]/10 flex items-center justify-center cursor-pointer transition-all hover:border-[#0474C4] hover:bg-[rgba(200,169,110,0.08)]">
            <svg viewBox="0 0 24 24" className="w-3.75 h-3.75 stroke-[#0474C4] fill-none stroke-[1.8]" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </button> */}

          {/* Notifications button */}
          {/* <button className="relative w-8 h-8 rounded-full border border-[#0474C4]/10 bg-[#0474C4]/10 flex items-center justify-center cursor-pointer transition-all hover:border-[#0474C4] hover:bg-[rgba(200,169,110,0.08)]">
            <svg viewBox="0 0 24 24" className="w-3.75 h-3.75 stroke-[#0474C4] fill-none stroke-[1.8]" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </button> */}

          {/* Avatar + dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setDropdownOpen(o => !o)}
              className="flex items-center gap-1.75 bg-transparent border-none px-3 py-1.25 cursor-pointer rounded-lg hover:bg-[rgba(200,169,110,0.08)] transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-[#0474C4]/10 flex items-center justify-center font-serif text-[0.62rem] text-[#0474C4]">
               {initials}
              </div>
              <span className="text-[0.78rem] text-[#0474C4] font-normal">
                {user.firstName ?? user.email}
              </span>
              <svg
                viewBox="0 0 24 24"
                className={`w-3 h-3 fill-none stroke-[#0474C4] stroke-2 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-[#E5E2DC] rounded-xl shadow-lg py-1 z-50 overflow-hidden">
                {/* User info */}
                <div className="px-3.5 py-2.5 border-b border-[#F0EEE9] mb-1">
                  <p className="text-[12px] font-bold text-[#1A1916] truncate">{user?.firstName}</p>
                  <p className="text-[10px] text-[#A8A39C]">{user?.role}</p>
                </div>

                {/* Settings */}
                <button
                  onClick={() => setDropdownOpen(false)}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-[#6B6560] hover:bg-[#FAFAF9] hover:text-[#1A1916] transition-colors cursor-pointer text-left"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0 fill-none stroke-current stroke-[1.8]" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  Settings
                </button>

                {/* Notifications */}
                <button
                  onClick={() => setDropdownOpen(false)}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-[#6B6560] hover:bg-[#FAFAF9] hover:text-[#1A1916] transition-colors cursor-pointer text-left"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0 fill-none stroke-current stroke-[1.8]" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  Notifications
                </button>

                <div className="my-1 border-t border-[#F0EEE9]" />

                {/* Logout */}
                <button
                  onClick={() => { setDropdownOpen(false); setConfirmLogout(true) }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-red-500 hover:bg-red-50 transition-colors cursor-pointer text-left"
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
                  <p className="text-[10px] font-bold tracking-widest uppercase text-[#0474C4]">Session</p>
                  <h2 className="text-[16px] font-extrabold text-[#1A1916] leading-tight">Log Out?</h2>
                </div>
              </div>
              <p className="text-[12px] text-[#A8A39C] mt-1 leading-relaxed">
                Are you sure you want to log out?
              </p>
            </div>
            <div className="px-6 py-4 flex flex-col gap-2">
              <button
                onClick={logout}
                className="w-full px-4 py-2.5 rounded-[10px] bg-[#0474C4] text-white text-[13px] font-bold hover:bg-[#A86C09] transition-colors cursor-pointer"
              >
                Log Out
              </button>
              <button
                onClick={() => setConfirmLogout(false)}
                className="w-full px-4 py-1.5 text-[12px] text-[#A8A39C] bg-transparent border-none cursor-pointer hover:text-[#6B6560] transition-colors"
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
