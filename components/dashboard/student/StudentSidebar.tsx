import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, BookOpen, Award, User, LogOut } from "lucide-react";
import type { SessionPayload } from "@/lib/session";
import { NavUser } from "@/components/layout/NavUser";

// const nav = [
//   { href: "/student",               label: "Overview",     icon: LayoutDashboard },
//   { href: "/student/courses",       label: "My Courses",   icon: BookOpen        },
//   { href: "/student/certificates",  label: "Certificates", icon: Award           },
//   { href: "/student/profile",       label: "Profile",      icon: User            },
// ]

const navItemBase =
  "flex items-center gap-[10px] py-[10px] px-6 cursor-pointer transition-all duration-200 border-l-[3px] border-l-transparent no-underline text-[0.84rem] text-[rgba(247,243,237,0.5)] font-light relative hover:bg-[rgba(247,243,237,0.04)] hover:text-[rgba(247,243,237,0.85)]";

const navItemActive =
  "flex items-center gap-[10px] py-[10px] px-6 cursor-pointer transition-all duration-200 border-l-[3px] border-l-[var(--gold)] no-underline text-[0.84rem] text-[var(--gold-light)] font-light relative bg-[rgba(200,169,110,0.08)]";

const svgProps = {
  viewBox: "0 0 24 24" as const,
  className: "w-4 h-4 stroke-current fill-none shrink-0",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const sectionLabel =
  "text-[0.6rem] tracking-[0.18em] uppercase text-[rgba(200,169,110,0.4)] px-6 mb-2";

const badge =
  "ml-auto bg-[rgba(200,169,110,0.15)] text-[var(--gold)] text-[0.6rem] font-medium py-[2px] px-[7px] rounded-[10px]";

const badgeRed =
  "ml-auto bg-[rgba(239,68,68,0.15)] text-[#FCA5A5] text-[0.6rem] font-medium py-[2px] px-[7px] rounded-[10px]";

export default function StudentSidebar({ user }: { user: SessionPayload }) {
  const initials =
    [user.firstName, user.lastName]
      .filter(Boolean)
      .map((n) => n![0].toUpperCase())
      .join("") || user.email[0].toUpperCase();

  return (
    <aside className="col-start-1 row-start-2 bg-[#06457F] border-r border-[rgba(200,169,110,0.1)] py-6 flex flex-col sticky top-[var(--header-h)] h-[calc(100vh-var(--header-h))] overflow-y-auto">
      <span className={`${sectionLabel} mt-0`}>Main</span>
      <div className={navItemActive}>
        <svg {...svgProps}>
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
        </svg>
        Overview
      </div>
      <div className={navItemBase}>
        <svg {...svgProps}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
        My Courses
        <span className={badge}>3</span>
      </div>
      <div className={navItemBase}>
        <svg {...svgProps}>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        Certificates
        <span className={badge}>2</span>
      </div>
      <div className={navItemBase}>
        <svg {...svgProps}>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        Schedule
      </div>
      <div className={navItemBase}>
        <svg {...svgProps}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        Messages
        <span className={badgeRed}>2</span>
      </div>

      <span className={`${sectionLabel} mt-[1.2rem]`}>Explore</span>
      <a href="arps-programs.html" className={navItemBase}>
        <svg {...svgProps}>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        Browse Programs
      </a>
      <a href="arps-workshop.html" className={navItemBase}>
        <svg {...svgProps}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        Workshops
      </a>
      <a href="arps-research.html" className={navItemBase}>
        <svg {...svgProps}>
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        Research Training
      </a>

      <span className={`${sectionLabel} mt-[1.2rem]`}>Account</span>
      <div className={navItemBase}>
        <svg {...svgProps}>
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        Notifications
        <span className={badgeRed}>3</span>
      </div>
      <div className={navItemBase}>
        <svg {...svgProps}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
        Settings
      </div>
      <a href="arps-support.html" className={navItemBase}>
        <svg {...svgProps}>
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        Help &amp; Support
      </a>

      <div className="mt-auto py-[1.2rem] px-6 border-t border-[rgba(200,169,110,0.08)]">
        <NavUser user={{
          name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email,
          email: user.email,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=0D8ABC&color=fff&size=128&font-size=0.33`
        }} />
        {/* <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-[rgba(200,169,110,0.15)] border-[1.5px] border-[rgba(200,169,110,0.25)] flex items-center justify-center font-serif text-[0.78rem] text-[var(--gold-light)] shrink-0">
            {initials}
          </div>
          <div>
            <div className="text-[0.84rem] text-[rgba(247,243,237,0.7)] font-normal">
              {user.firstName} {user.lastName}
            </div>
            <div className="text-[0.7rem] text-[rgba(247,243,237,0.3)] font-light">
              {user.role}
            </div>
          </div>
        </div>
        <button className="flex items-center gap-1.5 text-[0.74rem] text-[rgba(247,243,237,0.3)] mt-[0.8rem] cursor-pointer transition-colors duration-200 bg-transparent border-0 p-0 font-sans hover:text-[rgba(247,243,237,0.6)]">
          <svg
            viewBox="0 0 24 24"
            className="w-3.25 h-3.25 stroke-current fill-none shrink-0"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sign Out
        </button> */}
      </div>
    </aside>
  );
}
