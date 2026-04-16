import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { ContactStatus, ContactSubject, getContactMessages } from "@/services/contact.service"

/** GET /api/admin/enquiries — list all contact enquiries (admin only) */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = req.nextUrl
    const status = searchParams.get("status") as ContactStatus | null
    const subject = searchParams.get("subject") as ContactSubject | null
    const search = searchParams.get("search") ?? undefined

    const enquiries = await getContactMessages({
      status: status ?? undefined,
      subject: subject ?? undefined,
      search,
    })

    return NextResponse.json(
      enquiries.map((enquiry) => ({
        ...enquiry,
        createdAt: enquiry.createdAt.toISOString(),
      }))
    )
  } catch (error) {
    console.error("[GET /api/admin/enquiries]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}