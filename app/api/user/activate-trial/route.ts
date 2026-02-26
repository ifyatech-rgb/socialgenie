import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PLANS } from "@/lib/plans"

/**
 * POST /api/user/activate-trial
 * Activate free trial for the current user (no Stripe).
 * Sets plan to trial, trial video credits (e.g. 10), 5 Genie edits, payment_status to trialing.
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const trial = PLANS.trial
    const email = session.user.email.trim().toLowerCase()
    await prisma.users.update({
      where: { email },
      data: {
        plan: "trial",
        plan_status: "trialing",
        payment_status: "trialing",
        credits: trial.videoCredits,
        video_credits: trial.videoCredits,
        video_credits_used: 0,
        genie_edits: trial.genieEdits,
        custom_avatars_limit: trial.customAvatarsLimit,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Trial activated",
    })
  } catch (error) {
    console.error("[activate-trial]", error)
    return NextResponse.json(
      { error: "Failed to activate trial" },
      { status: 500 }
    )
  }
}
