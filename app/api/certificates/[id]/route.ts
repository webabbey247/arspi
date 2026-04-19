import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { revokeCertificate } from "@/services/certificate.service"

type Context = { params: Promise<{ id: string }> }

/** DELETE /api/certificates/[id] — revoke a certificate (admin only) */
export async function DELETE(_req: NextRequest, { params }: Context) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const result = await revokeCertificate(id)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[DELETE /api/certificates/[id]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
