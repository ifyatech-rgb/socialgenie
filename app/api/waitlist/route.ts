import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/waitlist
 * Save email to Waitlist table (landing page "Give Access").
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const email = (body.email as string)?.trim()?.toLowerCase()
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 })
    }

    await prisma.user_activity_log.create({
      data: {
        activity_type: "waitlist_signup",
        description: "Waitlist signup",
        metadata: { email },
      },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[waitlist]", e)
    return NextResponse.json({ error: "Failed to save" }, { status: 500 })
  }
}
