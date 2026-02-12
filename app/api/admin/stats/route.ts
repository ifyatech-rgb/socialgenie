import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin-auth"

export async function GET() {
  try {
    const admin = await requireAdmin()
    if (!admin.ok) {
      return NextResponse.json({ error: admin.error }, { status: admin.status })
    }

    const supabase = createAdminClient()
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Supabase: profiles & activity_logs (real data)
    const { count: totalUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })

    const { count: newUsersThisWeek } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", weekAgo.toISOString())

    const { data: activeUserRows } = await supabase
      .from("activity_logs")
      .select("user_id")
      .gte("created_at", weekAgo.toISOString())
    const activeUserIds = new Set((activeUserRows ?? []).map((r: { user_id: string }) => r.user_id))
    const activeUsers = activeUserIds.size

    // Prisma: Script counts; "videos created" = Scripts with generatedVideoUrl (AI-generated videos)
    const [totalScripts, scriptsToday, totalVideos, videosToday] = await Promise.all([
      prisma.script.count(),
      prisma.script.count({ where: { createdAt: { gte: dayStart } } }),
      prisma.script.count({ where: { generatedVideoUrl: { not: null } } }),
      prisma.script.count({
        where: {
          generatedVideoUrl: { not: null },
          createdAt: { gte: dayStart },
        },
      }),
    ])

    // Recent activity from Supabase (real)
    const { data: recentActivity } = await supabase
      .from("activity_logs")
      .select(
        `
        *,
        profiles:user_id (
          id,
          full_name,
          email,
          avatar_url
        )
      `
      )
      .order("created_at", { ascending: false })
      .limit(20)

    // Top users: profiles with script/video counts (match Prisma User by email)
    const { data: topProfiles } = await supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url, created_at, last_active_at, credits")
      .order("last_active_at", { ascending: false, nullsFirst: false })
      .limit(10)

    const topUsers = await Promise.all(
      (topProfiles ?? []).map(async (p: { id: string; email: string; [key: string]: unknown }) => {
        const prismaUser = await prisma.user.findUnique({
          where: { email: p.email },
          select: { id: true },
        })
        if (!prismaUser) {
          return { ...p, scriptCount: 0, videoCount: 0 }
        }
        const [scriptCount, videoCount] = await Promise.all([
          prisma.script.count({ where: { userId: prismaUser.id } }),
          prisma.script.count({
            where: { userId: prismaUser.id, generatedVideoUrl: { not: null } },
          }),
        ])
        return { ...p, scriptCount, videoCount }
      })
    )

    // Chart: signups by day (last 30 days) from profiles
    const { data: signupData } = await supabase
      .from("profiles")
      .select("created_at")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: true })

    const signupsByDay: Record<string, number> = {}
    ;(signupData as { created_at: string }[] | null)?.forEach((user) => {
      const date = new Date(user.created_at).toISOString().split("T")[0]
      signupsByDay[date] = (signupsByDay[date] || 0) + 1
    })

    const chartData: { date: string; signups: number }[] = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = d.toISOString().split("T")[0]
      chartData.push({ date: dateStr, signups: signupsByDay[dateStr] || 0 })
    }

    // Previous period (yesterday) for today's growth %
    const yesterdayStart = new Date(dayStart.getTime() - 24 * 60 * 60 * 1000)
    const [prevScriptsToday, prevVideosToday, prevNewUsersRes] = await Promise.all([
      prisma.script.count({
        where: { createdAt: { gte: yesterdayStart, lt: dayStart } },
      }),
      prisma.script.count({
        where: {
          generatedVideoUrl: { not: null },
          createdAt: { gte: yesterdayStart, lt: dayStart },
        },
      }),
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", new Date(weekAgo.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .lt("created_at", weekAgo.toISOString()),
    ])
    const prevNewUsersWeek = prevNewUsersRes.count ?? 0

    return NextResponse.json({
      totalUsers: totalUsers ?? 0,
      newUsersThisWeek: newUsersThisWeek ?? 0,
      totalScripts,
      scriptsToday,
      totalVideos,
      videosToday,
      activeUsers,
      recentActivity: recentActivity ?? [],
      topUsers,
      chartData,
      growth: {
        newUsersChange:
          prevNewUsersWeek === 0
            ? 0
            : Math.round(
                (((newUsersThisWeek ?? 0) - prevNewUsersWeek) / prevNewUsersWeek) * 100
              ),
        scriptsTodayChange:
          prevScriptsToday === 0 ? 0 : Math.round(((scriptsToday - prevScriptsToday) / prevScriptsToday) * 100),
        videosTodayChange:
          prevVideosToday === 0 ? 0 : Math.round(((videosToday - prevVideosToday) / prevVideosToday) * 100),
      },
    })
  } catch (error) {
    console.error("Admin stats error:", error)
    return NextResponse.json(
      {
        error: "Failed to load stats",
        totalUsers: 0,
        newUsersThisWeek: 0,
        totalScripts: 0,
        scriptsToday: 0,
        totalVideos: 0,
        videosToday: 0,
        activeUsers: 0,
        recentActivity: [],
        topUsers: [],
        chartData: [],
      },
      { status: 500 }
    )
  }
}
