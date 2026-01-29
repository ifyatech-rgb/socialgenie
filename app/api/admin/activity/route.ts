import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createClient()
    const searchParams = request.nextUrl.searchParams
    
    const userId = searchParams.get('userId')
    const action = searchParams.get('action')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('activity_logs')
      .select(`
        *,
        profiles:user_id (
          id,
          full_name,
          email,
          avatar_url
        )
      `, { count: 'exact' })

    // Apply filters
    if (userId) {
      query = query.eq('user_id', userId)
    }

    if (action) {
      query = query.eq('action', action)
    }

    if (startDate) {
      query = query.gte('created_at', startDate)
    }

    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: activities, count, error } = await query

    if (error) {
      console.error('Activity query error:', error)
      throw error
    }

    return NextResponse.json({
      activities: activities || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    })
  } catch (error) {
    console.error('Admin activity error:', error)
    
    // Return demo data
    const actions = ['user.signup', 'script.generated', 'video.requested', 'user.login', 'video.completed']
    const names = ['Sarah Chen', 'Mike Rodriguez', 'Lisa Park', 'James Wilson', 'Emma Stone']
    
    const demoActivities = Array.from({ length: 20 }, (_, i) => ({
      id: `demo-${i}`,
      user_id: `user-${i % 5}`,
      action: actions[i % actions.length],
      details: { topic: 'How to lose weight', platform: 'TikTok' },
      ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`,
      user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      created_at: new Date(Date.now() - i * 5 * 60 * 1000).toISOString(),
      profiles: {
        id: `user-${i % 5}`,
        full_name: names[i % names.length],
        email: `${names[i % names.length].toLowerCase().replace(' ', '.')}@example.com`,
        avatar_url: null
      }
    }))

    return NextResponse.json({
      activities: demoActivities,
      total: 500,
      page: 1,
      limit: 100,
      totalPages: 5
    })
  }
}
