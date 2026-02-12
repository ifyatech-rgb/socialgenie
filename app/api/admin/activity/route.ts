import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/admin-auth"

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (!admin.ok) {
      return NextResponse.json({ error: admin.error }, { status: admin.status })
    }

    const supabase = createAdminClient()
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const action = searchParams.get('action')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 100)
    const offset = (page - 1) * limit

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

    if (userId) query = query.eq('user_id', userId)
    if (action) query = query.eq('action', action)
    if (startDate) query = query.gte('created_at', startDate)
    if (endDate) query = query.lte('created_at', endDate)

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: activities, count: totalCount, error } = await query

    if (error) {
      console.error('Activity query error:', error)
      return NextResponse.json(
        { error: error.message, activities: [], total: 0, page, limit, totalPages: 0 },
        { status: 500 }
      )
    }

    return NextResponse.json({
      activities: activities ?? [],
      total: totalCount ?? 0,
      page,
      limit,
      totalPages: Math.ceil((totalCount ?? 0) / limit),
    })
  } catch (error) {
    console.error('Admin activity error:', error)
    return NextResponse.json(
      { error: "Failed to load activity", activities: [], total: 0, page: 1, limit: 100, totalPages: 0 },
      { status: 500 }
    )
  }
}
