"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import DashboardSidebar from "./DashboardSidebar";
import DashboardHeader from "./DashboardHeader";
import type { SessionPayload } from "@/types/session";

export default function DashboardShell({
  user,
  children,
}: {
  user: SessionPayload;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Close the mobile sidebar on route change — adjusted during render (not an
  // effect) per React's guidance for resetting state when a prop changes.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setSidebarOpen(false);
  }

  useEffect(() => {
    if (sidebarOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [sidebarOpen]);

  return (
    <div className="flex flex-col h-screen bg-[#F5F4F1] overflow-hidden">
      <DashboardHeader user={user} onMenuClick={() => setSidebarOpen(true)} />
      <div className="flex flex-1 overflow-hidden relative">
        <DashboardSidebar
          userRole={user.role}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="flex-1 overflow-y-auto w-full">{children}</main>
      </div>
    </div>
  );
}
