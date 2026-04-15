import { z } from "zod"

export const basicInfoSchema = z.object({
  email: z
    .string({ error: "Email is required" })
    .check(z.email("Invalid email address"))
    .toLowerCase(),
  password: z
    .string({ error: "Password is required" })
    .min(8, "Password must be at least 8 characters")
    .check(z.regex(/[A-Z]/, "Must contain at least one uppercase letter"))
    .check(z.regex(/[0-9]/, "Must contain at least one number")),
})

export const profileInfoSchema = z.object({
  userId:       z.string(),
  firstName:    z.string({ error: "First name is required" }).min(2, "Min 2 characters").max(50),
  lastName:     z.string({ error: "Last name is required" }).min(2, "Min 2 characters").max(50),
  country:      z.string().optional(),
  jobTitle:     z.string().optional(),
  organisation: z.string().optional(),
  roleType:     z.string().optional(),
})

export const learningInterestsSchema = z.object({
  userId:         z.string(),
  interests:      z.array(z.string()),
  referralSource: z.string().optional(),
  emailOptIn:     z.boolean().optional(),
})

export type BasicInfoInput        = z.infer<typeof basicInfoSchema>
export type ProfileInfoInput      = z.infer<typeof profileInfoSchema>
export type LearningInterestsInput = z.infer<typeof learningInterestsSchema>
