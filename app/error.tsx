"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-ink-deep flex items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-ink bg-size-[60px_60px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-125 h-125 rounded-full bg-red-500/5 blur-[100px] pointer-events-none" />

      <div className="relative z-10 text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
          <svg className="h-7 w-7 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <p className="text-[0.68rem] tracking-[0.18em] uppercase text-sapphire mb-4">
          Something went wrong
        </p>
        <h1 className="font-serif text-sky-light text-2xl md:text-3xl font-normal mb-4 leading-snug">
          An unexpected error occurred
        </h1>
        <p className="text-white/40 font-light text-sm leading-loose mb-8">
          We apologise for the inconvenience. Please try refreshing the page or returning to the homepage.
        </p>

        <div className="flex gap-3 justify-center flex-wrap">
          <Button
            onClick={reset}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">
              <Home className="h-4 w-4" />
              Go Home
            </Link>
          </Button>
        </div>

        {error.digest && (
          <p className="mt-8 text-[0.65rem] text-white/15 font-mono">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
