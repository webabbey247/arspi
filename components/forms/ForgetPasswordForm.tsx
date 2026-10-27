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
      className="fixed inset-0 bg-[#171C35]/70 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-[16px] w-full max-w-md overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[linear-gradient(135deg,#241C61,#6756DF)] p-5 flex items-start justify-between gap-4">
          <div>
            <div className="text-[20px] tracking-[-0.02em] leading-[1.25] font-extrabold text-white">
              Reset Your Password
            </div>
            <div className="text-[13px] text-white/80 mt-0.5">
              We&apos;ll send a reset link to your email
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-white/35 hover:text-white text-xl leading-none shrink-0 bg-[#EEECFF]/20 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {resetSent ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-[10px] px-4 py-3 text-[14px] font-bold text-emerald-700">
              ✓ Reset link sent — check your inbox.
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[14px] font-extrabold text-[#171C35]">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  {...register("email")}
                  className="text-[15px] leading-[1.5] bg-white border border-[#DFE2ED] rounded-[10px] px-[13px] py-[11px] text-[#171C35] outline-none transition-shadow focus:border-[#6655DF] focus:ring-3 focus:ring-[#6655DF]/15 placeholder:text-[#8A90A6]"
                />
                {errors.email && (
                  <span className="text-[12px] font-bold text-red-600">{errors.email.message}</span>
                )}
              </div>

              {apiError && (
                <p className="text-[12px] font-bold text-red-600">{apiError}</p>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="h-12 rounded py-2.5 px-5 font-body text-[0.875rem] tracking-[0.02em] font-medium text-[#EEECFF] bg-[#6655DF] hover:bg-[#2C2368] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
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
