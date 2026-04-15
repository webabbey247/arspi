import { z } from "zod"

export const loginSchema = z.object({
  email:      z.string({ error: "Email is required" }).check(z.email("Invalid email address")).toLowerCase(),
  password:   z.string({ error: "Password is required" }).min(1, "Password is required"),
  rememberMe: z.boolean().optional().default(false),
})

export type LoginInput = z.infer<typeof loginSchema>

export const forgotPasswordSchema = z.object({
  email: z.string({ error: "Email is required" }).check(z.email("Invalid email address")).toLowerCase(),
})

export const resetPasswordSchema = z.object({
  token:    z.string({ error: "Token is required" }).min(1),
  password: z.string({ error: "Password is required" })
    .min(8, "Password must be at least 8 characters")
    .check(z.regex(/[A-Z]/, "Must contain at least one uppercase letter"))
    .check(z.regex(/[0-9]/, "Must contain at least one number")),
})

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput  = z.infer<typeof resetPasswordSchema>
