import { ImageResponse } from "next/og"
import { getCertificateByToken, displayName } from "@/services/certificate.service"
import { SITE_NAME } from "@/lib/seo"

export const runtime = "nodejs"
export const alt = "Certificate of completion"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

/** The card LinkedIn, X and Slack render when a certificate link is shared.
 *
 *  Every <div> with more than one child declares `display: flex` explicitly —
 *  Satori has no block layout and throws without it, which is the single most
 *  common way these routes fail at request time rather than at build time. */
export default async function Image({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const cert = await getCertificateByToken(token)

  const name   = cert ? displayName(cert.user) : "Certificate"
  const course = cert?.course.title ?? "Not found"
  const issued = cert
    ? new Date(cert.issuedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : ""

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          justifyContent: "space-between", padding: "64px 72px",
          background: "linear-gradient(135deg, #0B0E24 0%, #241C61 55%, #3A2E7E 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* Gold rule */}
        <div style={{ display: "flex", position: "absolute", top: 0, left: 0, right: 0, height: 10,
                      background: "linear-gradient(90deg, #8A6E2F, #E8CE8F, #8A6E2F)" }} />

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 22, letterSpacing: 6, color: "#E8CE8F", fontWeight: 700 }}>
            CERTIFICATE OF COMPLETION
          </div>
          <div style={{ display: "flex", fontSize: 26, color: "rgba(255,255,255,0.55)", marginTop: 14 }}>
            {SITE_NAME}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 30, color: "rgba(255,255,255,0.6)" }}>
            Awarded to
          </div>
          <div style={{ display: "flex", fontSize: 68, color: "#FFFFFF", fontWeight: 800, marginTop: 6 }}>
            {name.length > 34 ? `${name.slice(0, 34)}…` : name}
          </div>
          <div style={{ display: "flex", fontSize: 34, color: "#C9BCFF", fontWeight: 600, marginTop: 18, lineHeight: 1.25 }}>
            {course.length > 76 ? `${course.slice(0, 76)}…` : course}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontSize: 24, color: "rgba(255,255,255,0.5)" }}>
            {issued ? `Issued ${issued}` : ""}
          </div>
          {cert && (
            <div style={{
              display: "flex", fontSize: 20, color: "#0B0E24", fontWeight: 700,
              background: "#E8CE8F", padding: "10px 20px", borderRadius: 999,
            }}>
              Verified
            </div>
          )}
        </div>
      </div>
    ),
    size,
  )
}
