import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin-auth"

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (!admin.ok) {
      return NextResponse.json({ error: admin.error }, { status: admin.status })
    }

    const supabase = createAdminClient()
    const range = request.nextUrl.searchParams.get("range") || "30d"
    const now = new Date()
    let start: Date
    if (range === "today") {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    } else if (range === "7d") {
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else if (range === "90d") {
      start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    } else if (range === "all") {
      start = new Date(0)
    } else {
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    const startStr = start.toISOString()

    // Previous period for comparison
    const periodMs = now.getTime() - start.getTime()
    const prevEnd = new Date(start.getTime() - 1)
    const prevStart = new Date(prevEnd.getTime() - periodMs)

    const [totalUsers, newUsersPeriod, activeUsersPeriod, totalScripts, totalVideos, scriptsPeriod, videosPeriod] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", startStr),
      supabase.from("activity_logs").select("user_id").gte("created_at", startStr),
      prisma.script.count(),
      prisma.script.count({ where: { generatedVideoUrl: { not: null } } }),
      prisma.script.count({ where: { createdAt: { gte: start } } }),
      prisma.script.count({ where: { createdAt: { gte: start }, generatedVideoUrl: { not: null } } }),
    ])

    const activeSet = new Set((activeUsersPeriod.data ?? []).map((r: { user_id: string }) => r.user_id))

    // Previous period metrics for comparison
    const prevStartStr = prevStart.toISOString()
    const prevEndStr = prevEnd.toISOString()
    const { count: prevNewUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", prevStartStr)
      .lte("created_at", prevEndStr)
    const prevScripts = await prisma.script.count({
      where: { createdAt: { gte: prevStart, lte: prevEnd } },
    })
    const prevVideos = await prisma.script.count({
      where: { createdAt: { gte: prevStart, lte: prevEnd }, generatedVideoUrl: { not: null } },
    })

    const totalUsersNum = totalUsers.count ?? 0
    const newUsersNum = newUsersPeriod.count ?? 0
    const totalScriptsNum = totalScripts
    const totalVideosNum = totalVideos
    const prevNew = prevNewUsers ?? 0
    const totalUsersChange = prevNew === 0 ? 0 : ((newUsersNum - prevNew) / prevNew) * 100
    const totalScriptsChange = prevScripts === 0 ? 0 : ((scriptsPeriod - prevScripts) / prevScripts) * 100
    const totalVideosChange = prevVideos === 0 ? 0 : ((videosPeriod - prevVideos) / prevVideos) * 100

    // User growth by day (last 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const { data: signupRows } = await supabase
      .from("profiles")
      .select("created_at")
      .gte("created_at", thirtyDaysAgo.toISOString())
    const byDay: Record<string, number> = {}
    let cumulative = 0
    const userGrowth = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = d.toISOString().split("T")[0]
      const count = (signupRows ?? []).filter((r: { created_at: string }) => r.created_at.startsWith(dateStr)).length
      cumulative += count
      byDay[dateStr] = count
      userGrowth.push({ date: dateStr, users: count, cumulative })
    }

    // Content creation (scripts/videos by day, last 7)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const [scriptsList, videosList] = await Promise.all([
      prisma.script.findMany({ where: { createdAt: { gte: sevenDaysAgo } }, select: { createdAt: true } }),
      prisma.script.findMany({ where: { createdAt: { gte: sevenDaysAgo }, generatedVideoUrl: { not: null } }, select: { createdAt: true } }),
    ])
    const contentByDay: Record<string, { scripts: number; videos: number }> = {}
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = d.toISOString().split("T")[0]
      contentByDay[dateStr] = { scripts: 0, videos: 0 }
    }
    scriptsList.forEach((s) => {
      const dateStr = s.createdAt.toISOString().split("T")[0]
      if (contentByDay[dateStr]) contentByDay[dateStr].scripts += 1
    })
    videosList.forEach((v) => {
      const dateStr = v.createdAt.toISOString().split("T")[0]
      if (contentByDay[dateStr]) contentByDay[dateStr].videos += 1
    })
    const contentCreation = Object.entries(contentByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date: new Date(date).toLocaleDateString("en-US", { weekday: "short" }), scripts: v.scripts, videos: v.videos }))

    // Hourly activity (last 7 days)
    const { data: activityRows } = await supabase
      .from("activity_logs")
      .select("created_at")
      .gte("created_at", new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString())
    const byHour: Record<number, number> = {}
    for (let h = 0; h < 24; h++) byHour[h] = 0
    ;(activityRows ?? []).forEach((r: { created_at: string }) => {
      const h = new Date(r.created_at).getHours()
      byHour[h] = (byHour[h] || 0) + 1
    })
    const hourlyActivity = Object.entries(byHour).map(([hour, activity]) => ({ hour: `${hour}:00`, activity }))

    return NextResponse.json({
      userGrowth,
      contentCreation,
      platformDistribution: [], // No platform breakdown in DB; show empty or derive from Script.platform later
      hourlyActivity,
      metrics: {
        totalUsers: totalUsersNum,
        totalUsersChange,
        activeUsers: activeSet.size,
        activeUsersChange: 0,
        totalScripts: totalScriptsNum,
        totalScriptsChange,
        totalVideos: totalVideosNum,
        totalVideosChange,
        avgScriptsPerUser: totalUsersNum > 0 ? Math.round((totalScriptsNum / totalUsersNum) * 10) / 10 : 0,
        avgScriptsChange: 0,
        conversionRate: totalUsersNum > 0 ? Math.round((totalVideosNum / totalUsersNum) * 100) : 0,
        conversionChange: 0,
      },
    })
  } catch (error) {
    console.error("Admin analytics error:", error)
    return NextResponse.json(
      {
        error: "Failed to load analytics",
        userGrowth: [],
        contentCreation: [],
        platformDistribution: [],
        hourlyActivity: [],
        metrics: null,
      },
      { status: 500 }
    )
  }
}
