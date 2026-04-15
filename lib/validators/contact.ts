import * as yup from "yup"

const SUBJECTS = ["ENQUIRY", "PROGRAMS", "PARTNERSHIPS", "MEDIA", "OTHER"] as const

export const contactSchema = yup.object({
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
  phone: yup
    .string()
    .trim()
    .optional()
    .matches(/^[+\d\s\-().]{7,20}$/, {
      message: "Please enter a valid phone number",
      excludeEmptyString: true,
    }),
  subject: yup
    .string()
    .required("Please select a subject")
    .oneOf(SUBJECTS, "Invalid subject selected"),
  message: yup
    .string()
    .required("Message is required")
    .trim()
    .min(10, "Message must be at least 10 characters"),
})

// Override phone to be truly optional (yup infers `string | undefined` which
// conflicts with react-hook-form expecting `phone?: string`)
export type ContactInput = Omit<yup.InferType<typeof contactSchema>, "phone"> & {
  phone?: string
}
