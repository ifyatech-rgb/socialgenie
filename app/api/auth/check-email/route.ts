import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/auth/check-email?email=...
 * Returns whether the email is already registered (used before sign-up).
 */
export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email")?.trim().toLowerCase()
  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    })
    return NextResponse.json({ exists: !!user })
  } catch (e) {
    console.error("[check-email]", e)
    return NextResponse.json({ error: "Check failed" }, { status: 500 })
  }
}
