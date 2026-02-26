import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/auth/redirect-destination
 * Used after OAuth (e.g. Google) to decide: onboarding vs dashboard.
 * - onboarding_completed === true → /dashboard
 * - Otherwise → /onboarding (show form once, then never again)
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ redirect: "/dashboard" })
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user.email.trim().toLowerCase() },
      select: { onboarding_completed: true },
    })

    if (!user) {
      return NextResponse.json({ redirect: "/dashboard" })
    }

    return NextResponse.json({
      redirect: user.onboarding_completed ? "/dashboard" : "/onboarding",
    })
  } catch {
    return NextResponse.json({ redirect: "/dashboard" })
  }
}
