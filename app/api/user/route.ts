import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthUserEmail, getSessionForRequest, authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTrialStatus } from "@/lib/payment";
import { syncUserToSupabase } from "@/lib/supabase-sync";
import { getUserCached, setUserCache } from "@/lib/user-cache";

/**
 * GET /api/user - Get current user data including credits (Prisma only, single source of truth).
 * Resolves user by session.user.id first. Cached per user for 15s to avoid duplicate calls.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionForRequest(request);
    const userEmail = await getAuthUserEmail(request);
    if (!session?.user && !userEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Same resolution order as dashboard: session user id first, then email
    const userIdFromSession = session?.user?.id ?? null;
    const emailNormalized = userEmail?.trim().toLowerCase() || undefined;
    const selectFields = {
      id: true,
      email: true,
      name: true,
      image: true,
      credits: true,
      plan: true,
      payment_status: true,
      niche: true,
      platform: true,
      onboarding_completed: true,
      avatar_url: true,
      avatar_status: true,
      custom_avatars_limit: true,
      custom_avatars_used: true,
      video_credits: true,
      genie_edits: true,
      created_at: true,
      _count: { select: { scripts: true } },
    } as const;
    let user = userIdFromSession
      ? await prisma.users.findUnique({
          where: { id: userIdFromSession },
          select: selectFields,
        })
      : null;
    if (!user && emailNormalized) {
      user = await prisma.users.findUnique({
        where: { email: emailNormalized },
        select: selectFields,
      });
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const cached = getUserCached(user.id);
    if (cached) {
      const res = NextResponse.json(cached);
      res.headers.set("Cache-Control", "private, s-maxage=60, stale-while-revalidate=300");
      return res;
    }

    const videoCreditsDb = user.video_credits ?? 0;
    const genieEditsDb = user.genie_edits ?? 0;
    const creditsDisplay = user.credits ?? user.video_credits ?? 0;
    const trialStatus = getTrialStatus(user.created_at ?? new Date());
    const isTrialPlan = user.plan === "trial";

    const responseData = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        credits: creditsDisplay,
        videoCredits: videoCreditsDb,
        genieEdits: genieEditsDb,
        plan: user.plan,
        payment_status: user.payment_status,
        niche: user.niche,
        platforms: user.platform,
        onboardingCompleted: user.onboarding_completed,
        avatarUrl: user.avatar_url,
        avatarStatus: user.avatar_status,
        customAvatarsLimit: user.custom_avatars_limit,
        customAvatarsUsed: user.custom_avatars_used,
        createdAt: user.created_at,
        scriptsCount: user._count.scripts,
        videosCount: 0,
        customAvatarsCreated: user.custom_avatars_used ?? 0,
        trial: {
          isActive: isTrialPlan,
          daysRemaining: trialStatus.daysRemaining,
          isExpired: trialStatus.isExpired,
        },
      },
    };
    setUserCache(user.id, responseData);
    const res = NextResponse.json(responseData);
    res.headers.set("Cache-Control", "private, s-maxage=60, stale-while-revalidate=300");
    return res;
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch user" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user - Update current user data
 */
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, image, niche, platforms } = body;

    const user = await prisma.users.update({
      where: { id: session.user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(image !== undefined && { image }),
        ...(niche !== undefined && { niche }),
        ...(platforms !== undefined && { platforms }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        credits: true,
        plan: true,
        niche: true,
        platform: true,
        onboarding_completed: true,
        video_credits: true,
        genie_edits: true,
        custom_avatars_used: true,
        custom_avatars_limit: true,
      },
    });

    syncUserToSupabase({
      id: user.id,
      email: user.email,
      name: user.name ?? undefined,
      avatar_url: user.image ?? undefined,
      plan: user.plan ?? undefined,
      video_credits: user.video_credits ?? undefined,
      genie_edits: user.genie_edits ?? undefined,
      custom_avatars_used: user.custom_avatars_used ?? undefined,
      custom_avatars_limit: user.custom_avatars_limit ?? undefined,
    }).catch(() => {});

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update user" },
      { status: 500 }
    );
  }
}
