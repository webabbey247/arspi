"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { ChevronRight, Eye, EyeOff } from "lucide-react"
import Link from "next/link"

const schema = yup.object({
  password: yup
    .string()
    .min(8, "Must be at least 8 characters")
    .matches(/[A-Z]/, "Must contain an uppercase letter")
    .matches(/[0-9]/, "Must contain a number")
    .required("New password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords do not match")
    .required("Please confirm your new password"),
})

type Fields = yup.InferType<typeof schema>

const ResetPasswordForm = ({
  token,
  showPw,
  setShowPw,
  onSuccess,
}: {
  token: string
  showPw: boolean
  setShowPw: (show: boolean) => void
  onSuccess: () => void
}) => {
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [isLoading,     setIsLoading]     = useState(false)
  const [apiError,      setApiError]      = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Fields>({ resolver: yupResolver(schema), mode: "onTouched" })

  async function onSubmit(data: Fields) {
    if (!token) {
      setApiError("Missing reset token. Please use the link from your email.")
      return
    }
    setApiError(null)
    setIsLoading(true)
    try {
      const res  = await fetch("/api/auth/reset-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ token, password: data.password }),
      })
      const body = await res.json()
      if (!res.ok) {
        setApiError(body.error ?? "Something went wrong.")
        return
      }
      onSuccess()
    } catch {
      setApiError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="mb-4">
        <h1 className="font-heading text-[2rem] tracking-[-0.015em] leading-[1.2] font-bold text-[#071639] mb-1.5">
          Choose a New Password
        </h1>
        <p className="font-body text-[0.875rem] tracking-[0em] leading-[1.6] font-normal text-slate-600">
          Your new password must be at least 8 characters and include an uppercase letter and a number.
        </p>
      </div>

      {/* New Password */}
      <div className="flex flex-col gap-1.5">
        <label className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-slate-400">
          New Password
        </label>
        <div className="relative">
          <Input
            type={showPw ? "text" : "password"}
            placeholder="Enter your new password"
            autoComplete="new-password"
            {...register("password")}
            className="pr-11 font-body text-[0.875rem] tracking-[0em] leading-[1.6] font-normal bg-sky-light border border-[#0474C4]/25 rounded-sm px-3 py-2 text-ink outline-none focus:border-[#0474C4] placeholder:text-slate-400 placeholder:font-light"
          />
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-ink transition-colors"
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <span className="font-body text-[0.6875rem] text-red-500">{errors.password.message}</span>
        )}
      </div>

      {/* Confirm New Password */}
      <div className="flex flex-col gap-1.5">
        <label className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-slate-400">
          Confirm New Password
        </label>
        <div className="relative">
          <Input
            type={showConfirmPw ? "text" : "password"}
            placeholder="Repeat your new password"
            autoComplete="new-password"
            {...register("confirmPassword")}
            className="pr-11 font-body text-[0.875rem] tracking-[0em] leading-[1.6] font-normal bg-sky-light border border-[#0474C4]/25 rounded-sm px-3 py-2 text-ink outline-none focus:border-[#0474C4] placeholder:text-slate-400 placeholder:font-light"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPw(!showConfirmPw)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-ink transition-colors"
          >
            {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <span className="font-body text-[0.6875rem] text-red-500">{errors.confirmPassword.message}</span>
        )}
      </div>

      {apiError && (
        <p className="font-body text-[0.6875rem] text-red-500 text-center">{apiError}</p>
      )}

      <Button
        type="submit"
        disabled={isLoading}
        className="bg-[#0474C4] min-w-40 h-12 text-white inline-flex border-none py-3.5 px-8 justify-center items-center font-body text-[0.82rem] font-medium tracking-widest uppercase cursor-pointer rounded-[32px] transition-all duration-250 hover:bg-[#06457F] hover:border-[#06457F] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isLoading ? "Updating…" : <>Update Password <ChevronRight className="h-4 w-4" /></>}
      </Button>

      <p className="text-center font-body text-[0.75rem] tracking-[0em] leading-normal font-normal text-slate-400">
        Remembered it?{" "}
        <Link href="/login" className="text-[#0474C4] hover:text-[#06457F] transition-colors font-medium">
          Back to sign in
        </Link>
      </p>
    </form>
  )
}

export default ResetPasswordForm
