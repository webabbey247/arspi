"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"
import { Play, X } from "lucide-react"

/**
 * A round play button that opens a full-screen video player. The video starts
 * playing as soon as it opens (with sound, since the click allows it) and
 * stops when it closes, because the player is removed rather than hidden.
 * Escape, the close button or a click on the backdrop closes it.
 */
export default function VideoLightbox({ src, title, poster }: {
  src: string
  /** Accessible name for the dialog and the button ("Play video: …"). */
  title: string
  poster?: string
}) {
  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label={`Play video: ${title}`}
          className="group absolute inset-0 grid place-items-center cursor-pointer rounded-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0474C4]"
        >
          <span className="relative grid place-items-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/95 text-[#0474C4] shadow-[0_12px_40px_rgba(6,13,20,0.35)] transition-transform duration-300 group-hover:scale-110">
            {/* Soft pulse so it reads as something to press. */}
            <span className="absolute inset-0 rounded-full bg-white/60 animate-ping motion-reduce:animate-none" aria-hidden />
            <Play className="relative w-7 h-7 sm:w-8 sm:h-8 translate-x-0.5 fill-current" aria-hidden />
          </span>
        </button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[200] bg-[#060D14]/95 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-[210] flex items-center justify-center p-4 sm:p-10 outline-none"
          // Clicks on the empty space around the video close it, like the backdrop.
          onClick={e => { if (e.target === e.currentTarget) (e.currentTarget.querySelector("[data-close]") as HTMLButtonElement | null)?.click() }}
        >
          <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
          <video
            src={src}
            poster={poster}
            autoPlay
            controls
            playsInline
            className="w-full max-w-6xl max-h-full aspect-video bg-black rounded-sm shadow-2xl"
          />
          <DialogPrimitive.Close asChild>
            <button
              type="button"
              data-close
              aria-label="Close video"
              className="absolute top-3 right-3 sm:top-5 sm:right-5 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white grid place-items-center cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
