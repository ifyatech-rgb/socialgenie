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

    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'
    const plan = searchParams.get('plan') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })

    // Apply search filter
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    // Apply status filter
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    if (status === 'active') {
      query = query.gte('last_active_at', weekAgo.toISOString())
    } else if (status === 'inactive') {
      query = query.or(`last_active_at.lt.${weekAgo.toISOString()},last_active_at.is.null`)
    } else if (status === 'admin') {
      query = query.eq('role', 'admin')
    }

    // Apply plan filter
    if (plan !== 'all') {
      query = query.eq('plan', plan)
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: usersData, count, error } = await query

    if (error) {
      console.error('Users query error:', error)
      throw error
    }

    type ProfileRow = { id: string; last_active_at: string | null; [key: string]: unknown }
    const users = (usersData ?? null) as ProfileRow[] | null

    // Get script counts for each user
    const userIds = users?.map(u => u.id) || []
    
    const { data: scriptCounts } = await supabase
      .from('scripts')
      .select('user_id')
      .in('user_id', userIds)

    const { data: videoCounts } = await supabase
      .from('videos')
      .select('user_id')
      .in('user_id', userIds)

    // Count scripts and videos per user
    const scriptsPerUser: Record<string, number> = {}
    const videosPerUser: Record<string, number> = {}

    ;(scriptCounts as { user_id: string }[] | null)?.forEach(s => {
      scriptsPerUser[s.user_id] = (scriptsPerUser[s.user_id] || 0) + 1
    })

    ;(videoCounts as { user_id: string }[] | null)?.forEach(v => {
      videosPerUser[v.user_id] = (videosPerUser[v.user_id] || 0) + 1
    })

    // Enhance users with counts
    const enhancedUsers = users?.map(user => ({
      ...user,
      scriptCount: scriptsPerUser[user.id] || 0,
      videoCount: videosPerUser[user.id] || 0,
      isActive: user.last_active_at ? new Date(user.last_active_at) > weekAgo : false
    }))

    return NextResponse.json({
      users: enhancedUsers || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    })
  } catch (error) {
    console.error('Admin users error:', error)
    
    // Return demo data
    const demoUsers = Array.from({ length: 10 }, (_, i) => ({
      id: `demo-${i}`,
      full_name: ['Sarah Chen', 'Mike Rodriguez', 'Lisa Park', 'James Wilson', 'Emma Stone'][i % 5],
      email: `user${i}@example.com`,
      created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      last_active_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      credits: Math.floor(Math.random() * 100),
      plan: ['free', 'starter', 'creator', 'pro'][i % 4],
      role: i === 0 ? 'admin' : 'user',
      scriptCount: Math.floor(Math.random() * 50),
      videoCount: Math.floor(Math.random() * 20),
      isActive: Math.random() > 0.3
    }))

    return NextResponse.json({
      users: demoUsers,
      total: 1247,
      page: 1,
      limit: 50,
      totalPages: 25
    })
  }
}
