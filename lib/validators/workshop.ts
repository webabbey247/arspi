import * as yup from "yup"

export const PAYMENT_METHODS = ["CARD", "PAYPAL", "BANK_TRANSFER"] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export const workshopSchema = (requirePayment: boolean) =>
  yup.object({
    firstName: yup
      .string()
      .required("First name is required")
      .trim()
      .min(2, "First name must be at least 2 characters"),
    lastName: yup
      .string()
      .required("Last name is required")
      .trim()
      .min(2, "Last name must be at least 2 characters"),
    email: yup
      .string()
      .required("Email address is required")
      .email("Please enter a valid email address")
      .lowercase()
      .trim(),
    organisation: yup.string().trim().optional(),
    paymentMethod: requirePayment
      ? yup
          .string()
          .required("Please select a payment method")
          .oneOf(PAYMENT_METHODS, "Invalid payment method")
      : yup.string().optional(),
  })

export type WorkshopInput = {
  firstName: string
  lastName: string
  email: string
  organisation?: string
  paymentMethod?: string
}

// Shape sent to the API — includes event metadata from the parent
export type WorkshopRegistrationPayload = WorkshopInput & {
  workshopId?: string
  workshopTitle: string
  workshopDate: string
  workshopTime: string
  fee: number
}
