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
      // Total counts
      prisma.video.count({
        where: { userId: session.user.id },
      }),
      prisma.script.count({
        where: { userId: session.user.id },
      }),
      // Scripts this week
      prisma.script.count({
        where: {
          userId: session.user.id,
          createdAt: { gte: oneWeekAgo },
        },
      }),
      // Scripts last week (for comparison)
      prisma.script.count({
        where: {
          userId: session.user.id,
          createdAt: { gte: twoWeeksAgo, lt: oneWeekAgo },
        },
      }),
      // Videos this week
      prisma.video.count({
        where: {
          userId: session.user.id,
          createdAt: { gte: oneWeekAgo },
        },
      }),
      // Videos last week (for comparison)
      prisma.video.count({
        where: {
          userId: session.user.id,
          createdAt: { gte: twoWeeksAgo, lt: oneWeekAgo },
        },
      }),
      // Scripts this month
      prisma.script.count({
        where: {
          userId: session.user.id,
          createdAt: { gte: oneMonthAgo },
        },
      }),
      // Scripts last month (for comparison)
      prisma.script.count({
        where: {
          userId: session.user.id,
          createdAt: { gte: twoMonthsAgo, lt: oneMonthAgo },
        },
      }),
      // Videos this month
      prisma.video.count({
        where: {
          userId: session.user.id,
          createdAt: { gte: oneMonthAgo },
        },
      }),
      // Videos last month (for comparison)
      prisma.video.count({
        where: {
          userId: session.user.id,
          createdAt: { gte: twoMonthsAgo, lt: oneMonthAgo },
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
