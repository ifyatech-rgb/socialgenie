import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Calculate date ranges
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const [
      totalVideos,
      totalScripts,
      scriptsThisWeek,
      scriptsLastWeek,
      videosThisWeek,
      videosLastWeek,
      scriptsThisMonth,
      scriptsLastMonth,
      videosThisMonth,
      videosLastMonth,
    ] = await Promise.all([
      // Total counts (videos = scripts with generated_video_url)
      prisma.scripts.count({
        where: { user_id: session.user.id, generated_video_url: { not: null } },
      }),
      prisma.scripts.count({
        where: { user_id: session.user.id },
      }),
      // Scripts this week
      prisma.scripts.count({
        where: {
          user_id: session.user.id,
          created_at: { gte: oneWeekAgo },
        },
      }),
      // Scripts last week (for comparison)
      prisma.scripts.count({
        where: {
          user_id: session.user.id,
          created_at: { gte: twoWeeksAgo, lt: oneWeekAgo },
        },
      }),
      // Videos this week
      prisma.scripts.count({
        where: {
          user_id: session.user.id,
          generated_video_url: { not: null },
          created_at: { gte: oneWeekAgo },
        },
      }),
      // Videos last week (for comparison)
      prisma.scripts.count({
        where: {
          user_id: session.user.id,
          generated_video_url: { not: null },
          created_at: { gte: twoWeeksAgo, lt: oneWeekAgo },
        },
      }),
      // Scripts this month
      prisma.scripts.count({
        where: {
          user_id: session.user.id,
          created_at: { gte: oneMonthAgo },
        },
      }),
      // Scripts last month (for comparison)
      prisma.scripts.count({
        where: {
          user_id: session.user.id,
          created_at: { gte: twoMonthsAgo, lt: oneMonthAgo },
        },
      }),
      // Videos this month
      prisma.scripts.count({
        where: {
          user_id: session.user.id,
          generated_video_url: { not: null },
          created_at: { gte: oneMonthAgo },
        },
      }),
      // Videos last month (for comparison)
      prisma.scripts.count({
        where: {
          user_id: session.user.id,
          generated_video_url: { not: null },
          created_at: { gte: twoMonthsAgo, lt: oneMonthAgo },
        },
      }),
    ]);

    // Calculate percentage changes
    const scriptsWeeklyChange = scriptsLastWeek > 0 
      ? Math.round(((scriptsThisWeek - scriptsLastWeek) / scriptsLastWeek) * 100)
      : scriptsThisWeek > 0 ? 100 : 0;
    
    const videosWeeklyChange = videosLastWeek > 0
      ? Math.round(((videosThisWeek - videosLastWeek) / videosLastWeek) * 100)
      : videosThisWeek > 0 ? 100 : 0;

    const scriptsMonthlyChange = scriptsLastMonth > 0
      ? Math.round(((scriptsThisMonth - scriptsLastMonth) / scriptsLastMonth) * 100)
      : scriptsThisMonth > 0 ? 100 : 0;

    const videosMonthlyChange = videosLastMonth > 0
      ? Math.round(((videosThisMonth - videosLastMonth) / videosLastMonth) * 100)
      : videosThisMonth > 0 ? 100 : 0;

    return NextResponse.json({
      videos: totalVideos,
      scripts: totalScripts,
      scriptsThisWeek,
      videosThisWeek,
      scriptsWeeklyChange,
      videosWeeklyChange,
      scriptsThisMonth,
      videosThisMonth,
      scriptsMonthlyChange,
      videosMonthlyChange,
    });
  } catch (error: any) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
