"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { navLinks } from "@/lib/data";

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 h-17 flex items-center bg-white backdrop-blur-[14px] border-b border-[#5379AE]/20 w-full">
      <div className="w-full flex items-center justify-between px-8 md:px-16">
        <Link
          href="/"
          className="flex items-center gap-2.5 shrink-0 no-underline w-50"
        >
          <Image
            src="/images/arps-institute-logo.webp"
            alt="ARPS Institute Logo"
            width={198}
            height={39}
            className="h-9.75 w-49.5"
            priority
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-7">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`${
                pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(link.href))
                  ? "text-[#0474c4]"
                  : "text-[#262b40] hover:text-[#0474c4]"
              } font-body text-[1rem] tracking-[0.01em] leading-normal font-normal capitalize transition-colors`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Auth buttons */}
        <div className="hidden lg:flex items-center gap-4 shrink-0">
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
        </div>

        {/* Mobile toggle */}
        <button
          className="lg:hidden transition-colors"
          style={{ color: "rgba(255,255,255,0.65)" }}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="lg:hidden absolute top-17 left-0 right-0 border-b shadow-xl z-40"
          style={{
            background: "rgba(38,43,64,0.98)",
            borderColor: "rgba(83,121,174,0.18)",
          }}
        >
          <div className="flex flex-col py-4 px-6 gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="py-2.5 text-[0.82rem] tracking-widest uppercase transition-colors"
                style={{
                  color:
                    pathname === link.href
                      ? "#0474C4"
                      : "rgba(255,255,255,0.65)",
                }}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div
              className="flex gap-2 pt-4 mt-2"
              style={{ borderTop: "1px solid rgba(83,121,174,0.18)" }}
            >
              <Button size="sm" className="flex-1" asChild>
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  Sign In
                </Link>
              </Button>
              <Button size="sm" className="flex-1" asChild>
                <Link href="/signup" onClick={() => setMobileOpen(false)}>
                  Sign Up
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
