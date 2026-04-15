import * as yup from "yup"

export const subscriptionSchema = yup.object({
  email: yup
    .string()
    .required("Email is required")
    .email("Please enter a valid email address")
    .lowercase()
    .trim(),
})

export type SubscriptionInput = yup.InferType<typeof subscriptionSchema>
