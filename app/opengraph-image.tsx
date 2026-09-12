import { ImageResponse } from "next/og"
import { SITE_NAME } from "@/lib/seo"

export const alt = "ARPS Institute — Professional Education, Research & Leadership"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

/** Site-wide default social preview card. Any page that doesn't set its own
 *  `openGraph.images` inherits this, so a shared link is never a blank
 *  preview. Deliberately uses system fonts — loading a webfont here means a
 *  network fetch on every image render and a failure mode where the whole
 *  card 500s. */
export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0A3D6B",
          padding: "72px 80px",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              border: "3px solid #BFE0D6",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 30,
            }}
          >
            A
          </div>
          <div style={{ color: "#BFE0D6", fontSize: 26, letterSpacing: 6, textTransform: "uppercase" }}>
            {SITE_NAME}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Satori requires an explicit display on any element with more than
              one child — each line is its own node rather than a <br />. */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              color: "#ffffff",
              fontSize: 66,
              lineHeight: 1.1,
              letterSpacing: -1.5,
            }}
          >
            <div>Professional Education,</div>
            <div>Research &amp; Leadership</div>
          </div>
          <div style={{ color: "#C6D6E6", fontSize: 27, lineHeight: 1.4, maxWidth: 860 }}>
            Certification programmes, research training and institutional consulting for
            scholars and practitioners worldwide.
          </div>
        </div>

        <div style={{ display: "flex", height: 8, width: 180, background: "#0B6FC4" }} />
      </div>
    ),
    size
  )
}
