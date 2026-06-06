import "server-only"
import nodemailer from "nodemailer"

const transport = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

const FROM = process.env.SMTP_FROM ?? "ARPS Institute <noreply@arpsinstitute.org>"

export async function sendEmailVerificationEmail(to: string, verifyLink: string): Promise<void> {
  await transport.sendMail({
    from:    FROM,
    to,
    subject: "Verify your ARPS Institute email address",
    text: `Welcome to ARPS Institute! Please verify your email address by opening the link below. It expires in 24 hours.\n\n${verifyLink}\n\nIf you didn't create an account, you can safely ignore this email.`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#EBF3FC;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #BFDBF7;">

          <!-- Header -->
          <tr>
            <td style="background:#06457F;padding:28px 32px;">
              <p style="margin:0;font-size:18px;font-weight:600;color:#ffffff;letter-spacing:-0.01em;">
                ARPS Institute
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 32px 28px;">
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#071639;letter-spacing:-0.015em;">
                Confirm your email address
              </h1>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#475569;">
                You&apos;re almost there! Click the button below to verify your email and activate your
                ARPS Institute account. This link expires in <strong>24 hours</strong>.
              </p>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background:#0474C4;border-radius:32px;">
                    <a href="${verifyLink}"
                       style="display:inline-block;padding:14px 32px;font-size:13px;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;color:#ffffff;text-decoration:none;">
                      Verify Email Address
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#64748B;">
                Or copy and paste this URL into your browser:
              </p>
              <p style="margin:0;font-size:12px;color:#0474C4;word-break:break-all;">
                ${verifyLink}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #E2EAF4;">
              <p style="margin:0;font-size:12px;color:#94A3B8;line-height:1.6;">
                If you didn&apos;t create an ARPS Institute account, no action is needed — this email can
                be safely ignored. For help, contact
                <a href="mailto:support@iarps.com" style="color:#0474C4;">support@iarps.com</a>.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  })
}

// ── Workshop confirmation ─────────────────────────────────────────────────────

export type WorkshopConfirmationData = {
  firstName:       string
  workshopTitle:   string
  workshopDate:    string
  workshopTime:    string
  fee:             number
  isConfirmed:     boolean
  category?:       string
  level?:          string
  duration?:       number
  facilitators?:   string[]
  medium?:         string
  onlinePlatform?: string | null
  onlineLink?:     string | null
  venueAddress?:   string | null
  venueCity?:      string | null
  venueCountry?:   string | null
}

const CATEGORY_LABEL: Record<string, string> = {
  SHORT_COURSE: "Short Course",
  WEBINAR:      "Webinar",
  MASTERCLASS:  "Masterclass",
  CONFERENCE:   "Conference",
  WORKSHOP:     "Workshop",
}

const LEVEL_LABEL: Record<string, string> = {
  BEGINNER:     "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED:     "Advanced",
}

export async function sendWorkshopConfirmationEmail(to: string, data: WorkshopConfirmationData): Promise<void> {
  const {
    firstName, workshopTitle, workshopDate, workshopTime, fee,
    isConfirmed, category, level, duration, facilitators,
    medium, onlinePlatform, onlineLink, venueAddress, venueCity, venueCountry,
  } = data

  const feeLabel    = fee === 0 ? "Free" : `$${fee.toLocaleString()}`
  const statusColor = isConfirmed ? "#059669" : "#D97706"
  const statusText  = isConfirmed ? "Confirmed" : "Pending Payment"
  const subject     = isConfirmed
    ? `You're registered: ${workshopTitle}`
    : `Registration received: ${workshopTitle} — payment required`

  const deliveryRow = (() => {
    if (!medium) return null
    if (medium === "ONLINE") {
      const platform = onlinePlatform ?? "Online"
      return `<tr>
        <td style="padding:6px 0;font-size:13px;color:#64748B;width:130px;vertical-align:top;">Delivery</td>
        <td style="padding:6px 0;font-size:13px;color:#1E293B;font-weight:500;">
          ${platform}${onlineLink ? ` — <a href="${onlineLink}" style="color:#0474C4;">${onlineLink}</a>` : ""}
        </td>
      </tr>`
    }
    const venue = [venueAddress, venueCity, venueCountry].filter(Boolean).join(", ")
    return `<tr>
      <td style="padding:6px 0;font-size:13px;color:#64748B;width:130px;vertical-align:top;">Venue</td>
      <td style="padding:6px 0;font-size:13px;color:#1E293B;font-weight:500;">${venue || "In-Person"}</td>
    </tr>`
  })()

  const facilitatorRow = facilitators && facilitators.length > 0
    ? `<tr>
        <td style="padding:6px 0;font-size:13px;color:#64748B;width:130px;vertical-align:top;">Facilitator${facilitators.length > 1 ? "s" : ""}</td>
        <td style="padding:6px 0;font-size:13px;color:#1E293B;font-weight:500;">${facilitators.join(", ")}</td>
      </tr>`
    : ""

  await transport.sendMail({
    from:    FROM,
    to,
    subject,
    text: `Hi ${firstName},\n\n${isConfirmed ? "You are confirmed!" : "Your registration has been received."}\n\nWorkshop: ${workshopTitle}\nDate: ${workshopDate}\nTime: ${workshopTime}\nFee: ${feeLabel}\nStatus: ${statusText}\n\nFor help, contact support@iarps.com`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#EBF3FC;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:540px;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #BFDBF7;">

          <!-- Header -->
          <tr>
            <td style="background:#0474C4;padding:28px 32px 24px;">
              <p style="margin:0 0 12px;font-size:11px;font-weight:500;color:rgba(255,255,255,0.7);letter-spacing:0.07em;text-transform:uppercase;">
                Workshop Registration
              </p>
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.01em;line-height:1.3;">
                ${workshopTitle}
              </h1>
              <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.7);">
                ${workshopDate}${workshopTime ? " &middot; " + workshopTime : ""}
              </p>
              ${category || level ? `
              <div style="margin-top:14px;display:flex;gap:6px;flex-wrap:wrap;">
                ${category ? `<span style="display:inline-block;padding:3px 10px;background:rgba(255,255,255,0.15);border-radius:100px;font-size:11px;font-weight:500;color:rgba(255,255,255,0.85);letter-spacing:0.05em;">${CATEGORY_LABEL[category] ?? category}</span>` : ""}
                ${level ? `<span style="display:inline-block;padding:3px 10px;background:rgba(255,255,255,0.15);border-radius:100px;font-size:11px;font-weight:500;color:rgba(255,255,255,0.85);letter-spacing:0.05em;">${LEVEL_LABEL[level] ?? level}</span>` : ""}
                <span style="display:inline-block;padding:3px 10px;background:${fee === 0 ? "rgba(52,211,153,0.25)" : "rgba(255,255,255,0.15)"};border-radius:100px;font-size:11px;font-weight:500;color:${fee === 0 ? "rgb(110,231,183)" : "rgba(255,255,255,0.85)"};letter-spacing:0.05em;">${feeLabel}</span>
              </div>` : ""}
            </td>
          </tr>

          <!-- Status banner -->
          <tr>
            <td style="padding:0 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 0;background:${isConfirmed ? "#F0FDF4" : "#FFFBEB"};border:1px solid ${isConfirmed ? "#BBF7D0" : "#FDE68A"};border-radius:8px;">
                <tr>
                  <td style="padding:14px 16px;">
                    <p style="margin:0;font-size:13px;font-weight:600;color:${statusColor};">
                      ${isConfirmed ? "&#10003; Registration Confirmed" : "&#9679; Registration Received — Awaiting Payment"}
                    </p>
                    <p style="margin:4px 0 0;font-size:12px;color:${isConfirmed ? "#059669" : "#92400E"};">
                      ${isConfirmed
                        ? "Your spot is secured. See event details below."
                        : "Complete your payment to confirm your spot. Check your inbox for payment instructions."}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:24px 32px 8px;">
              <p style="margin:0 0 16px;font-size:15px;font-weight:400;color:#475569;line-height:1.6;">
                Hi <strong style="color:#1E293B;">${firstName}</strong>,
                ${isConfirmed
                  ? " you&apos;re all set! Here are your event details."
                  : " thanks for registering. Complete your payment to secure your spot."}
              </p>

              <!-- Event details table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E2EAF4;border-radius:8px;overflow:hidden;margin-bottom:20px;">
                <tr>
                  <td style="background:#F8FAFC;padding:12px 16px;font-size:11px;font-weight:600;color:#94A3B8;letter-spacing:0.06em;text-transform:uppercase;" colspan="2">
                    Event Information
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 16px 16px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#64748B;width:130px;vertical-align:top;">Workshop</td>
                        <td style="padding:6px 0;font-size:13px;color:#1E293B;font-weight:600;">${workshopTitle}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#64748B;width:130px;vertical-align:top;">Date</td>
                        <td style="padding:6px 0;font-size:13px;color:#1E293B;font-weight:500;">${workshopDate}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#64748B;width:130px;vertical-align:top;">Time</td>
                        <td style="padding:6px 0;font-size:13px;color:#1E293B;font-weight:500;">${workshopTime}</td>
                      </tr>
                      ${duration ? `<tr>
                        <td style="padding:6px 0;font-size:13px;color:#64748B;width:130px;vertical-align:top;">Duration</td>
                        <td style="padding:6px 0;font-size:13px;color:#1E293B;font-weight:500;">${duration} hour${duration !== 1 ? "s" : ""}</td>
                      </tr>` : ""}
                      ${deliveryRow ?? ""}
                      ${facilitatorRow}
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#64748B;width:130px;vertical-align:top;">Fee</td>
                        <td style="padding:6px 0;font-size:13px;color:#1E293B;font-weight:500;">${feeLabel}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#64748B;width:130px;vertical-align:top;">Status</td>
                        <td style="padding:6px 0;font-size:13px;font-weight:600;color:${statusColor};">${statusText}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #E2EAF4;">
              <p style="margin:0;font-size:12px;color:#94A3B8;line-height:1.6;">
                Questions? Contact us at
                <a href="mailto:support@iarps.com" style="color:#0474C4;">support@iarps.com</a>.
                &mdash; ARPS Institute
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  })
}

export async function sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
  await transport.sendMail({
    from:    FROM,
    to,
    subject: "Reset your ARPS Institute password",
    text: `You requested a password reset. Open the link below to set a new password. It expires in 1 hour.\n\n${resetLink}\n\nIf you didn't request this, you can safely ignore this email.`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#EBF3FC;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #BFDBF7;">

          <!-- Header -->
          <tr>
            <td style="background:#06457F;padding:28px 32px;">
              <p style="margin:0;font-size:18px;font-weight:600;color:#ffffff;letter-spacing:-0.01em;">
                ARPS Institute
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 32px 28px;">
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#071639;letter-spacing:-0.015em;">
                Reset your password
              </h1>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#475569;">
                We received a request to reset the password for your ARPS Institute account.
                Click the button below to choose a new password. This link expires in
                <strong>1 hour</strong>.
              </p>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background:#0474C4;border-radius:32px;">
                    <a href="${resetLink}"
                       style="display:inline-block;padding:14px 32px;font-size:13px;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;color:#ffffff;text-decoration:none;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#64748B;">
                Or copy and paste this URL into your browser:
              </p>
              <p style="margin:0;font-size:12px;color:#0474C4;word-break:break-all;">
                ${resetLink}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #E2EAF4;">
              <p style="margin:0;font-size:12px;color:#94A3B8;line-height:1.6;">
                If you didn&apos;t request a password reset, no action is needed — your password
                will not change. For security questions contact
                <a href="mailto:support@iarps.com" style="color:#0474C4;">support@iarps.com</a>.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  })
}
