import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/onboarding
 * Save onboarding answers and set user onboardingCompleted = true.
 * Body: { describeYou, mainGoal, videosPerMonth, usedAiTools, whenPlanningStart }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const describeYou = (body.describeYou as string)?.trim() || null
    const mainGoal = (body.mainGoal as string)?.trim() || null
    const videosPerMonth = (body.videosPerMonth as string)?.trim() || null
    const usedAiTools = (body.usedAiTools as string)?.trim() || null
    const whenPlanningStart = (body.whenPlanningStart as string)?.trim() || null

    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase() },
    })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    await prisma.onboarding.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        describeYou,
        mainGoal,
        videosPerMonth,
        usedAiTools,
        whenPlanningStart,
      },
      update: {
        describeYou,
        mainGoal,
        videosPerMonth,
        usedAiTools,
        whenPlanningStart,
      },
    })

    await prisma.user.update({
      where: { id: user.id },
      data: { onboardingCompleted: true },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[onboarding]", e)
    return NextResponse.json({ error: "Failed to save onboarding" }, { status: 500 })
  }
}
