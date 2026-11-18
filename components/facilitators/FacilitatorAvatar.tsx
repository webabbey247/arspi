"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { useUploadThing } from "@/lib/uploadthing-client"
import { cn } from "@/lib/utils"
import { initialsOf } from "./types"

/** Round photo, or initials when there isn't one. */
export function FacilitatorAvatar({ name, imageUrl, size = 40, institute }: {
  name: string; imageUrl?: string | null; size?: number; institute?: boolean
}) {
  return imageUrl ? (
    <span className="relative shrink-0 rounded-full overflow-hidden border border-[#DFE2ED] bg-white" style={{ width: size, height: size }}>
      <Image src={imageUrl} alt="" fill sizes={`${size}px`} className="object-cover" />
    </span>
  ) : (
    <span
      className={cn(
        "shrink-0 rounded-full grid place-items-center font-extrabold",
        institute ? "bg-[linear-gradient(135deg,#241C61,#6756DF)] text-white" : "bg-[#EEECFF] text-[#6655DF]",
      )}
      style={{ width: size, height: size, fontSize: Math.max(11, Math.round(size * 0.34)) }}
      aria-hidden
    >
      {initialsOf(name) || "?"}
    </span>
  )
}

/** Photo picker for the facilitator form (UploadThing image uploader). */
export function FacilitatorPhotoUpload({ value, name, onChange }: {
  value: string; name: string; onChange: (url: string) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const { startUpload } = useUploadThing("imageUploader")
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError("")
    try {
      const res = await startUpload([file])
      if (res?.[0]?.url) onChange(res[0].url)
      else setError("Upload failed. Try a smaller image.")
    } catch {
      setError("Upload failed. Try a smaller image.")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div className="flex items-center gap-3">
      <FacilitatorAvatar name={name} imageUrl={value} size={56} />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="px-3 py-1.5 text-[12px] font-semibold border border-[#DFE2ED] rounded-[8px] text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF] disabled:opacity-50 cursor-pointer"
        >
          {uploading ? "Uploading…" : value ? "Change photo" : "Upload photo"}
        </button>
        {value && !uploading && (
          <button type="button" onClick={() => onChange("")} className="text-[12px] font-semibold text-[#8A90A6] hover:text-rose-600 cursor-pointer">
            Remove
          </button>
        )}
        {error && <span className="text-[12px] text-rose-600">{error}</span>}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  )
}
