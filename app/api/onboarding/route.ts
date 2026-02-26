import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { invalidateUserCache } from "@/lib/user-cache"

/**
 * POST /api/onboarding
 * Save onboarding answers (niche, platform, challenge) and set user onboardingCompleted = true.
 * Body: { niche?, platform?, challenge? } or legacy { describeYou, mainGoal, ... }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const niche = (body.niche as string)?.trim() || (body.describeYou as string)?.trim() || null
    const platform = (body.platform as string)?.trim() || null
    const challenge = (body.challenge as string)?.trim() || (body.mainGoal as string)?.trim() || null

    const user = await prisma.users.findUnique({
      where: { email: session.user.email.toLowerCase() },
    })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    await prisma.users.update({
      where: { id: user.id },
      data: {
        onboarding_completed: true,
        ...(niche != null && niche !== "" && { niche }),
        ...(platform != null && platform !== "" && { platform }),
        ...(challenge != null && challenge !== "" && { main_challenge: challenge }),
      },
    })

    invalidateUserCache(user.id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[onboarding]", e)
    return NextResponse.json({ error: "Failed to save onboarding" }, { status: 500 })
  }
}
