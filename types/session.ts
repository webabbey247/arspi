export type SessionPayload = {
  sub:       string
  email:     string
  role:      "ADMIN" | "INSTRUCTOR" | "USER"
  firstName: string | null
  lastName:  string | null
}
