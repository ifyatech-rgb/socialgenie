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
    const searchParams = request.nextUrl.searchParams

    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || "all"
    const plan = searchParams.get("plan") || "all"
    const page = parseInt(searchParams.get("page") || "1")
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 50)
    const offset = (page - 1) * limit

    let query = supabase
      .from("profiles")
      .select("*", { count: "exact" })

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    if (status === "active") {
      query = query.gte("last_active_at", weekAgo.toISOString())
    } else if (status === "inactive") {
      query = query.or(`last_active_at.lt.${weekAgo.toISOString()},last_active_at.is.null`)
    } else if (status === "admin") {
      query = query.eq("role", "admin")
    }

    if (plan !== "all") {
      query = query.eq("plan", plan)
    }

    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: usersData, count, error } = await query

    if (error) {
      console.error("Users query error:", error)
      return NextResponse.json(
        { error: error.message, users: [], total: 0, page: 1, limit: 50, totalPages: 0 },
        { status: 500 }
      )
    }

    type ProfileRow = { id: string; email: string; last_active_at: string | null; [key: string]: unknown }
    const users = (usersData ?? []) as ProfileRow[]

    // Real script/video counts: match Prisma User by email
    const enhancedUsers = await Promise.all(
      users.map(async (user) => {
        const prismaUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { id: true },
        })
        let scriptCount = 0
        let videoCount = 0
        if (prismaUser) {
          scriptCount = await prisma.script.count({ where: { userId: prismaUser.id } })
          videoCount = await prisma.script.count({
            where: { userId: prismaUser.id, generatedVideoUrl: { not: null } },
          })
        }
        return {
          ...user,
          scriptCount,
          videoCount,
          isActive: user.last_active_at ? new Date(user.last_active_at) > weekAgo : false,
        }
      })
    )

    return NextResponse.json({
      users: enhancedUsers,
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    })
  } catch (error) {
    console.error("Admin users error:", error)
    return NextResponse.json(
      { error: "Failed to load users", users: [], total: 0, page: 1, limit: 50, totalPages: 0 },
      { status: 500 }
    )
  }
}
