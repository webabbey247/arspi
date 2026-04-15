"use client"

import { useForm, Controller, type Resolver } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import { ChevronRight, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { contactSchema, type ContactInput } from "@/lib/validators/contact"

const GeneralContactForm = () => {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: yupResolver(contactSchema) as Resolver<ContactInput>,
  })

  const onSubmit = async (data: ContactInput) => {
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const json = await res.json()

      if (!res.ok) {
        toast.error(json.error ?? "Something went wrong.")
        return
      }

      toast.success(json.message ?? "Message sent successfully!")
      reset()
    } catch {
      toast.error("Network error. Please try again.")
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col justify-start items-start w-full gap-4"
    >
      <div className="grid grid-cols-2 gap-4 w-full">
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.68rem] uppercase tracking-widest text-[#637AA3]">
            First Name
          </label>
          <Input placeholder="First Name" {...register("firstName")} />
          {errors.firstName && (
            <p className="text-[0.72rem] text-red-400">{errors.firstName.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.68rem] uppercase tracking-widest text-[#637AA3]">
            Last Name
          </label>
          <Input placeholder="Last Name" {...register("lastName")} />
          {errors.lastName && (
            <p className="text-[0.72rem] text-red-400">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full">
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.68rem] uppercase tracking-widest text-[#637AA3]">
            Email Address
          </label>
          <Input placeholder="Email Address" type="email" {...register("email")} />
          {errors.email && (
            <p className="text-[0.72rem] text-red-400">{errors.email.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.68rem] uppercase tracking-widest text-[#637AA3]">
            Mobile Number
          </label>
          <Input placeholder="Mobile Number" {...register("phone")} />
          {errors.phone && (
            <p className="text-[0.72rem] text-red-400">{errors.phone.message}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5 w-full">
        <label className="text-[0.68rem] uppercase tracking-widest text-[#637AA3]">
          Subject of Interest
        </label>
        <Controller
          name="subject"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="h-14 w-full rounded-sm border border-sapphire/25 bg-sky-light px-4 py-2 text-sm font-light text-ink outline-none focus:border-sapphire">
                <SelectValue placeholder="Select Preferred Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="ENQUIRY">General Enquiry</SelectItem>
                  <SelectItem value="PROGRAMS">Programs</SelectItem>
                  <SelectItem value="PARTNERSHIPS">Partnerships</SelectItem>
                  <SelectItem value="MEDIA">Media</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
        />
        {errors.subject && (
          <p className="text-[0.72rem] text-red-400">{errors.subject.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5 w-full">
        <label className="text-[0.68rem] uppercase tracking-widest text-[#637AA3]">
          Message
        </label>
        <Textarea placeholder="Tell us more..." {...register("message")} />
        {errors.message && (
          <p className="text-[0.72rem] text-red-400">{errors.message.message}</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-12 mt-6 rounded-[32px] py-2.5 px-7.5 text-[#EBF3FC] bg-[#0474C4] hover:bg-[#06457f] text-[0.875rem] tracking-[0.02em] font-medium disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            Send Message <ChevronRight className="h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  )
}

export default GeneralContactForm
