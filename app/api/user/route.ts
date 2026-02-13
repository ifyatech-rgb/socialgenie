import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthUserEmail, authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/user - Get current user data including credits (Prisma + optional Supabase sync)
 */
export async function GET(request: NextRequest) {
  try {
    const userEmail = await getAuthUserEmail(request);
    if (!userEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
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
        createdAt: true,
        _count: {
          select: {
            scripts: true,
            videos: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Credits: prefer Prisma (source of truth). Use Supabase only if Prisma has no value.
    let credits = user.credits != null ? user.credits : 0;
    if (credits === 0) {
      try {
        const supabase = createAdminClient();
        const { data } = await supabase
          .from("profiles")
          .select("credits")
          .eq("email", user.email)
          .maybeSingle();
        const profile = data as { credits?: number | null } | null;
        if (profile?.credits != null && typeof profile.credits === "number") {
          credits = profile.credits;
        }
      } catch {
        // keep Prisma value
      }
    }

    return NextResponse.json({
      user: {
        ...user,
        credits,
        scriptsCount: user._count.scripts,
        videosCount: user._count.videos,
      },
    });
  } catch (error: any) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch user" },
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
