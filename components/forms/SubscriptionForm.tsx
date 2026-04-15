"use client"

import { useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import { ChevronRight, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Input } from "../ui/input"
import { subscriptionSchema, type SubscriptionInput } from "@/lib/validators/subscription"

const SubscriptionForm = () => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SubscriptionInput>({
    resolver: yupResolver(subscriptionSchema),
  })

  const onSubmit = async (data: SubscriptionInput) => {
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const json = await res.json()

      if (!res.ok) {
        toast.error(json.error ?? "Something went wrong.")
        return
      }

      toast.success(json.message ?? "Successfully subscribed!")
      reset()
    } catch {
      toast.error("Network error. Please try again.")
    }
  }

  return (
    <div className="mb-3 max-w-105">
      <form onSubmit={handleSubmit(onSubmit)} className="flex relative" noValidate>
        <Input
          type="email"
          placeholder="Enter your email address"
          {...register("email")}
          className="font-body text-[0.875rem] tracking-[0em] leading-[1.6] font-normal flex-1 rounded-l-sm px-4 py-3 rounded-r-[32px] outline-none transition-colors bg-[#A8C4EC]/6 border border-[#5379AE]/22 text-[#D4E4F6] placeholder:font-body placeholder:text-[0.875rem] placeholder:tracking-[0em] placeholder:font-light placeholder:text-[#D4E4F6]/40"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="absolute right-0 font-body text-[0.75rem] h-full tracking-[0.07em] capitalize text-[#EBF3FC] font-medium px-5 rounded-[32px] transition-colors whitespace-nowrap bg-[#0474C4] hover:bg-[#06457f] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span className="inline-flex gap-2 items-center">
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Subscribe
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </span>
        </button>
      </form>
      {errors.email && (
        <p className="mt-1.5 text-[0.75rem] text-red-400 font-body">{errors.email.message}</p>
      )}
    </div>
  )
}

export default SubscriptionForm
