import Link from "next/link"
import Image from "next/image"
import { LayoutDashboard, BookOpen, Users, BarChart2, LogOut } from "lucide-react"
import type { SessionPayload } from "@/lib/session"

const nav = [
  { href: "/instructor",           label: "Overview",  icon: LayoutDashboard },
  { href: "/instructor/courses",   label: "My Courses", icon: BookOpen       },
  { href: "/instructor/students",  label: "Students",  icon: Users           },
  { href: "/instructor/analytics", label: "Analytics", icon: BarChart2       },
]

export default function InstructorSidebar({ user }: { user: SessionPayload }) {
  const initials = [user.firstName, user.lastName]
    .filter(Boolean)
    .map((n) => n![0].toUpperCase())
    .join("") || user.email[0].toUpperCase()

  return (
    <aside className="w-60 shrink-0 bg-[#06457F] flex flex-col min-h-screen">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/10">
        <Link href="/">
          <Image
            src="/images/arps-institute-logo.webp"
            alt="ARPS Institute"
            width={148}
            height={29}
            className="h-7 w-auto"
          />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-sm font-body text-[0.8125rem] font-normal text-slate-300 hover:bg-white/8 hover:text-white transition-colors"
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* User + logout */}
      <div className="px-4 py-4 border-t border-white/10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-full bg-white/15 border border-white/20 flex items-center justify-center font-body text-[0.6875rem] font-medium text-white shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="font-body text-[0.75rem] font-medium text-white truncate">
              {user.firstName ? `${user.firstName} ${user.lastName ?? ""}`.trim() : user.email}
            </p>
            <p className="font-body text-[0.625rem] text-slate-400 uppercase tracking-wider">Instructor</p>
          </div>
        </div>
        <Link
          href="/api/auth/logout"
          className="text-slate-400 hover:text-white transition-colors shrink-0"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </Link>
      </div>
    </aside>
  )
}
