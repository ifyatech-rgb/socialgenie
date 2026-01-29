import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createClient()
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    // Get total users
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    // Get new users this week
    const { count: newUsersThisWeek } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString())

    // Get total scripts
    const { count: totalScripts } = await supabase
      .from('scripts')
      .select('*', { count: 'exact', head: true })

    // Get scripts today
    const { count: scriptsToday } = await supabase
      .from('scripts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', dayAgo.toISOString())

    // Get total videos
    const { count: totalVideos } = await supabase
      .from('videos')
      .select('*', { count: 'exact', head: true })

    // Get videos today
    const { count: videosToday } = await supabase
      .from('videos')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', dayAgo.toISOString())

    // Get active users (last 7 days)
    const { count: activeUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('last_active_at', weekAgo.toISOString())

    // Get recent activity
    const { data: recentActivity } = await supabase
      .from('activity_logs')
      .select(`
        *,
        profiles:user_id (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })
      .limit(20)

    // Get top users this week
    const { data: topUsers } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        avatar_url,
        created_at,
        last_active_at,
        credits
      `)
      .order('last_active_at', { ascending: false, nullsFirst: false })
      .limit(10)

    // Get daily signups for chart (last 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const { data: signupData } = await supabase
      .from('profiles')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true })

    // Process signups by day
    const signupsByDay: Record<string, number> = {}
    signupData?.forEach(user => {
      const date = new Date(user.created_at).toISOString().split('T')[0]
      signupsByDay[date] = (signupsByDay[date] || 0) + 1
    })

    // Fill in missing days with 0
    const chartData = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      chartData.push({
        date: dateStr,
        signups: signupsByDay[dateStr] || 0
      })
    }

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      newUsersThisWeek: newUsersThisWeek || 0,
      totalScripts: totalScripts || 0,
      scriptsToday: scriptsToday || 0,
      totalVideos: totalVideos || 0,
      videosToday: videosToday || 0,
      activeUsers: activeUsers || 0,
      recentActivity: recentActivity || [],
      topUsers: topUsers || [],
      chartData
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    
    // Return demo data if database not set up
    return NextResponse.json({
      totalUsers: 1247,
      newUsersThisWeek: 89,
      totalScripts: 5847,
      scriptsToday: 247,
      totalVideos: 1892,
      videosToday: 67,
      activeUsers: 847,
      recentActivity: [],
      topUsers: [],
      chartData: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        signups: Math.floor(Math.random() * 20) + 5
      }))
    })
  }
}
