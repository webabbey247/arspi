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
                <a href="mailto:support@arpsinstitute.org" style="color:#0474C4;">support@arpsinstitute.org</a>.
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
                <a href="mailto:support@arpsinstitute.org" style="color:#0474C4;">support@arpsinstitute.org</a>.
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
