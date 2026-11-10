/**
 * Who may enrol in a programme or register for a workshop.
 *
 * Staff accounts may not. An administrator or instructor enrolling in their
 * own catalogue puts a member of staff into the learner reporting — completion
 * rates, revenue, certificates and the progress screens all count enrolments
 * without asking who the account belongs to — and gives them a second,
 * contradictory relationship to a programme they already own or teach.
 *
 * Enforced on the server, where it is authoritative. The UI checks the same
 * rule only so the button can explain itself rather than failing on click.
 */

export const STAFF_ROLES = ["ADMIN", "INSTRUCTOR"] as const

export function isStaffRole(role: string | null | undefined): boolean {
  return !!role && (STAFF_ROLES as readonly string[]).includes(role)
}

/** One wording, so the API response and the disabled button agree. */
export const STAFF_ENROLMENT_MESSAGE =
  "Staff accounts can't enrol. Use a learner account to take this programme."

export const STAFF_REGISTRATION_MESSAGE =
  "Staff accounts can't register. Use a learner account to attend this workshop."
