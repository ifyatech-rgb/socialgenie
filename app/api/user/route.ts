import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthUserEmail, getSessionForRequest, authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const USER_CACHE_MS = 15_000; // 15 seconds – reduces duplicate hits from layout/children
const userCache = new Map<string, { data: object; cacheTime: number }>();

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
    let user = userIdFromSession
      ? await prisma.user.findUnique({
          where: { id: userIdFromSession },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            credits: true,
            plan: true,
            payment_status: true,
            niche: true,
            platforms: true,
            onboardingCompleted: true,
            avatarUrl: true,
            avatarStatus: true,
            customAvatarsLimit: true,
            customAvatarsUsed: true,
            videoCredits: true,
            genieEdits: true,
            createdAt: true,
            _count: {
              select: {
                scripts: true,
                videos: true,
              },
            },
          },
        })
      : null;
    if (!user && emailNormalized) {
      user = await prisma.user.findUnique({
        where: { email: emailNormalized },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          credits: true,
          plan: true,
          payment_status: true,
          niche: true,
          platforms: true,
          onboardingCompleted: true,
          avatarUrl: true,
          avatarStatus: true,
          customAvatarsLimit: true,
          customAvatarsUsed: true,
          videoCredits: true,
          genieEdits: true,
          createdAt: true,
          _count: {
            select: {
              scripts: true,
              videos: true,
            },
          },
        },
      });
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const cached = userCache.get(user.id);
    if (cached && Date.now() - cached.cacheTime < USER_CACHE_MS) {
      return NextResponse.json(cached.data);
    }

    const videoCreditsDb = user.videoCredits ?? 0;
    const genieEditsDb = user.genieEdits ?? 0;
    const creditsDisplay = user.credits ?? user.videoCredits ?? 0;

    const responseData = {
      user: {
        ...user,
        credits: creditsDisplay,
        videoCredits: videoCreditsDb,
        genieEdits: genieEditsDb,
        scriptsCount: user._count.scripts,
        videosCount: user._count.videos,
        customAvatarsCreated: user.customAvatarsUsed ?? 0,
      },
    };
    userCache.set(user.id, { data: responseData, cacheTime: Date.now() });
    return NextResponse.json(responseData);
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

    const user = await prisma.user.update({
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
        platforms: true,
        onboardingCompleted: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update user" },
      { status: 500 }
    );
  }
}
