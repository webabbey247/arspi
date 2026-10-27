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
        <h1 className="text-[clamp(30px,4vw,38px)] tracking-[-0.035em] leading-[1.1] font-extrabold text-[#171C35] mb-2">
          Choose a New Password
        </h1>
        <p className="text-[15px] leading-[1.55] text-[#69708A]">
          Your new password must be at least 8 characters and include an uppercase letter and a number.
        </p>
      </div>

      {/* New Password */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[14px] font-extrabold text-[#171C35]">
          New Password
        </label>
        <div className="relative">
          <Input
            type={showPw ? "text" : "password"}
            placeholder="Enter your new password"
            autoComplete="new-password"
            {...register("password")}
            className="pr-11 text-[15px] leading-[1.5] bg-white border border-[#DFE2ED] rounded-[10px] px-[13px] py-[11px] text-[#171C35] outline-none transition-shadow focus:border-[#6655DF] focus:ring-3 focus:ring-[#6655DF]/15 placeholder:text-[#8A90A6]"
          />
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A90A6] hover:text-[#171C35] transition-colors"
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <span className="text-[12px] font-bold text-red-600">{errors.password.message}</span>
        )}
      </div>

      {/* Confirm New Password */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[14px] font-extrabold text-[#171C35]">
          Confirm New Password
        </label>
        <div className="relative">
          <Input
            type={showConfirmPw ? "text" : "password"}
            placeholder="Repeat your new password"
            autoComplete="new-password"
            {...register("confirmPassword")}
            className="pr-11 text-[15px] leading-[1.5] bg-white border border-[#DFE2ED] rounded-[10px] px-[13px] py-[11px] text-[#171C35] outline-none transition-shadow focus:border-[#6655DF] focus:ring-3 focus:ring-[#6655DF]/15 placeholder:text-[#8A90A6]"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPw(!showConfirmPw)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A90A6] hover:text-[#171C35] transition-colors"
          >
            {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <span className="text-[12px] font-bold text-red-600">{errors.confirmPassword.message}</span>
        )}
      </div>

      {apiError && (
        <p className="text-[12px] font-bold text-red-600 text-center">{apiError}</p>
      )}

      <Button
        type="submit"
        disabled={isLoading}
        className="bg-[#6655DF] min-w-40 h-12 text-white inline-flex gap-2 border border-[#6655DF] py-[11px] px-4 justify-center items-center text-[15px] font-extrabold cursor-pointer rounded-[10px] transition-colors hover:bg-[#2C2368] hover:border-[#2C2368] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isLoading ? "Updating…" : <>Update Password <ChevronRight className="h-4 w-4" /></>}
      </Button>

      <p className="text-center text-[12px] text-[#8A90A6]">
        Remembered it?{" "}
        <Link href="/login" className="text-[#6655DF] hover:text-[#2C2368] transition-colors font-extrabold">
          Back to sign in
        </Link>
      </p>
    </form>
  )
}

export default ResetPasswordForm
