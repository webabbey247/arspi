"use client";

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Menu } from 'lucide-react'
import type { SessionPayload } from "@/types/session"

async function logout() {
  ['staff_name', 'staff_role'].forEach(k => localStorage.removeItem(k))
  const resp = await fetch('/api/auth/logout', { method: 'POST' })
  window.location.href = resp.redirected ? resp.url : '/login'
}

export function userInitials(user: SessionPayload) {
  return [user?.firstName, user?.lastName]
    .filter(Boolean)
    .map((n) => n![0].toUpperCase())
    .join("") || user.email[0].toUpperCase()
}

/** LMS brand mark — gradient tile with the institute initials. */
export function BrandMark({ className = "w-[42px] h-[42px] text-[15px]" }: { className?: string }) {
  return (
    <span className={`grid place-items-center rounded-[12px] bg-[linear-gradient(145deg,#2C2368,#6655DF)] text-white font-extrabold shrink-0 ${className}`}>
      AI
    </span>
  )
}

/** Logout confirmation — shared by the sidebar role card and the mobile header. */
export function LogoutConfirm({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center bg-[#171C35]/50 backdrop-blur-[2px]">
      <div className="bg-white border border-[#DFE2ED] rounded-[16px] w-full max-w-sm mx-4 shadow-2xl p-6">
        <span className="text-[12px] tracking-[0.12em] uppercase font-extrabold text-[#6655DF]">
          Sign out
        </span>
        <h2 className="text-[24px] tracking-[-0.035em] font-extrabold text-[#171C35] mt-1.5 mb-1">
          Log out?
        </h2>
        <p className="text-[14px] text-[#69708A] mb-6">
          Are you sure you want to end your session?
        </p>
        <div className="flex gap-2.5 justify-end">
          <button
            onClick={onCancel}
            className="inline-flex items-center justify-center px-4 py-2.75 rounded-[10px] border border-[#DFE2ED] bg-white text-[14px] font-extrabold text-[#171C35] hover:bg-[#F5F6FB] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={logout}
            className="inline-flex items-center justify-center px-4 py-2.75 rounded-[10px] border border-[#6655DF] bg-[#6655DF] text-[14px] font-extrabold text-white hover:bg-[#2C2368] hover:border-[#2C2368] transition-colors cursor-pointer"
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  )
}

/** Mobile-only top bar. On desktop the LMS layout carries the brand and user
 *  card in the sidebar, so this header is hidden from `lg` up. */
const DashboardHeader = ({
  user,
  onMenuClick,
  onLogout,
}: {
  user: SessionPayload
  onMenuClick?: () => void
  onLogout: () => void
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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
    <header className="lg:hidden bg-white border-b border-[#DFE2ED] flex items-center justify-between gap-3 px-3 sm:px-5 sticky top-0 z-100 h-16 shrink-0">
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open menu"
          className="inline-flex items-center justify-center w-9 h-9 rounded-[10px] text-[#6655DF] hover:bg-[#EEECFF] cursor-pointer shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>
        <BrandMark className="w-8 h-8 text-[12px] rounded-[10px]" />
        <b className="text-[16px] leading-[1.1] text-[#171C35] truncate">ARPS Institute</b>
      </div>

      <div ref={dropdownRef} className="relative">
        <button
          onClick={() => setDropdownOpen(o => !o)}
          aria-label="Account menu"
          className="w-9 h-9 rounded-[10px] bg-[#EEECFF] grid place-items-center text-[12px] font-extrabold text-[#6655DF] cursor-pointer"
        >
          {userInitials(user)}
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-[#DFE2ED] rounded-[12px] shadow-lg p-1.5 z-50">
            <div className="px-3 py-2.5 border-b border-[#DFE2ED] mb-1">
              <b className="block text-[14px] text-[#171C35] truncate">{user.firstName ?? user.email}</b>
              <span className="block text-[12px] text-[#69708A] capitalize">{user.role.toLowerCase()}</span>
            </div>
            <Link
              href="/settings"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center px-3 py-2 rounded-[8px] text-[14px] font-bold text-[#60677E] hover:bg-[#EEECFF] hover:text-[#6655DF]"
            >
              Settings
            </Link>
            <button
              onClick={() => { setDropdownOpen(false); onLogout() }}
              className="w-full flex items-center px-3 py-2 rounded-[8px] text-[14px] font-bold text-red-600 hover:bg-red-50 cursor-pointer text-left"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

export default DashboardHeader
