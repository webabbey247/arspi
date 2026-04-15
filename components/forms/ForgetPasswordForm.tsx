"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { ChevronRight, X } from "lucide-react"

const schema = yup.object({
  email: yup.string().email("Enter a valid email").required("Email is required"),
})

type Fields = yup.InferType<typeof schema>

const ForgetPasswordForm = ({
  resetSent,
  setForgotOpen,
  setResetSent,
}: {
  resetSent: boolean
  setForgotOpen: (open: boolean) => void
  setResetSent: (sent: boolean) => void
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [apiError,  setApiError]  = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Fields>({ resolver: yupResolver(schema), mode: "onTouched" })

  function handleClose() {
    setForgotOpen(false)
    setResetSent(false)
  }

  async function onSubmit(data: Fields) {
    setApiError(null)
    setIsLoading(true)
    try {
      const res  = await fetch("/api/auth/forgot-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: data.email }),
      })
      const body = await res.json()
      if (!res.ok) {
        setApiError(body.error ?? "Something went wrong.")
        return
      }
      setResetSent(true)
    } catch {
      setApiError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-[#181C2C]/70 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className="bg-[#EBF3FC] rounded-lg w-full max-w-md overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#0474C4] p-5 flex items-start justify-between gap-4">
          <div>
            <div className="font-heading text-[1.125rem] tracking-[-0.005em] leading-[1.3] font-medium text-slate-300">
              Reset Your Password
            </div>
            <div className="font-body text-[0.75rem] tracking-[0em] leading-normal font-normal text-slate-300 mt-0.5">
              We&apos;ll send a reset link to your email
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-white/35 hover:text-white text-xl leading-none shrink-0 bg-[#EDF2FB]/20 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {resetSent ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-sm px-4 py-3 font-body text-[0.875rem] text-emerald-700">
              ✓ Reset link sent — check your inbox.
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-slate-400">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  {...register("email")}
                  className="font-body text-[0.875rem] tracking-[0em] leading-[1.6] font-normal bg-sky-light border border-[#0474C4]/25 rounded-sm px-3 py-2 text-ink outline-none focus:border-[#0474C4] placeholder:text-slate-400 placeholder:font-light"
                />
                {errors.email && (
                  <span className="font-body text-[0.6875rem] text-red-500">{errors.email.message}</span>
                )}
              </div>

              {apiError && (
                <p className="font-body text-[0.6875rem] text-red-500">{apiError}</p>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="h-12 rounded-[32px] py-2.5 px-5 font-body text-[0.875rem] tracking-[0.02em] font-medium text-[#EBF3FC] bg-[#0474C4] hover:bg-[#06457f] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "Sending…" : <>Send Reset Link <ChevronRight className="w-4 h-4" /></>}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default ForgetPasswordForm
