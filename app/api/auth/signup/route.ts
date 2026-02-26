import { NextRequest, NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { PLANS } from "@/lib/plans"
import { syncUserToSupabase } from "@/lib/supabase-sync"
import { trackUserActivity } from "@/lib/tracking"

/**
 * POST /api/auth/signup
 * Create account (email + password). Used after onboarding when user chose email flow.
 * Body: { email, password, onboardingAnswers?: { niche?, platform?, challenge? } }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const email = (body.email as string)?.trim()?.toLowerCase()
    const password = body.password as string
    const onboardingAnswers = body.onboardingAnswers as Record<string, string> | undefined

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email required" },
        { status: 400 }
      )
    }
    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      )
    }

    const existing = await prisma.users.findUnique({
      where: { email },
    })
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered. Please sign in." },
        { status: 400 }
      )
    }

    const hashedPassword = await hash(password, 10)
    const trial = PLANS.trial

    const user = await prisma.users.create({
      data: {
        email,
        name: email.split("@")[0] ?? "User",
        password_hash: hashedPassword,
        plan: "trial",
        payment_status: "trialing",
        onboarding_completed: true,
        niche: onboardingAnswers?.niche ?? null,
        platform: onboardingAnswers?.platform ?? null,
        credits: trial.videoCredits,
        video_credits: trial.videoCredits,
        genie_edits: trial.genieEdits ?? 25,
        custom_avatars_limit: trial.customAvatarsLimit ?? 1,
      },
    })

    await syncUserToSupabase({
      id: user.id,
      email: user.email,
      name: user.name ?? undefined,
      avatar_url: null,
    }).catch(() => {})
    trackUserActivity(user.id, "signup").catch(() => {})

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email },
    })
  } catch (error) {
    console.error("[signup]", error)
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    )
  }
}
