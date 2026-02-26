import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthUserEmail, authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/activity - Get user's recent activity
 */
export async function GET(request: NextRequest) {
  try {
    const userEmail = await getAuthUserEmail(request);
    if (!userEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { email: userEmail },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const activities = await prisma.user_activity_log.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: "desc" },
      take: limit,
      select: { id: true, activity_type: true, metadata: true, created_at: true },
    });

    // Format activities for display (map user_activity_log fields to expected shape)
    const formattedActivities = activities.map((activity) => {
      const details = (activity.metadata as Record<string, unknown>) || {};
      const actionMap: Record<string, { type: string; text: string; action: string }> = {
        "script.generated": {
          type: "script",
          text: `Script generated: '${details.topic || "Untitled"}'`,
          action: "View",
        },
        "script.deleted": {
          type: "script",
          text: `Script deleted: '${details.topic || "Untitled"}'`,
          action: "Undo",
        },
        "video.uploaded": {
          type: "upload",
          text: `Video uploaded: '${details.filename || "Untitled"}'`,
          action: "View",
        },
        "video.created": {
          type: "video",
          text: `Video created from script`,
          action: "Download",
        },
        "user.login": {
          type: "login",
          text: "Logged in",
          action: "View",
        },
        "user.signup": {
          type: "signup",
          text: "Account created",
          action: "View",
        },
        "onboarding.completed": {
          type: "onboarding",
          text: "Completed onboarding",
          action: "View",
        },
      };

      const action = activity.activity_type;
      const config = actionMap[action] || {
        type: "other",
        text: action,
        action: "View",
      };

      return {
        id: activity.id,
        type: config.type,
        text: config.text,
        action: config.action,
        time: getRelativeTime(activity.created_at ?? new Date()),
        createdAt: activity.created_at ?? new Date(),
      };
    });

    return NextResponse.json({ activities: formattedActivities });
  } catch (error: any) {
    console.error("Error fetching activity:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch activity" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/activity - Log a new activity
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, details } = body;

    if (!action) {
      return NextResponse.json(
        { error: "Action is required" },
        { status: 400 }
      );
    }

    const activity = await prisma.user_activity_log.create({
      data: {
        user_id: session.user.id,
        activity_type: action,
        metadata: details ? (details as object) : undefined,
      },
    });

    return NextResponse.json({
      activity: {
        id: activity.id,
        action: activity.activity_type,
        details: activity.metadata,
        createdAt: activity.created_at,
      },
    });
  } catch (error: any) {
    console.error("Error logging activity:", error);
    return NextResponse.json(
      { error: error.message || "Failed to log activity" },
      { status: 500 }
    );
  }
}

/**
 * Helper to get relative time string
 */
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  
  return new Date(date).toLocaleDateString();
}
