import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin-auth"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin()
    if (!admin.ok) {
      return NextResponse.json({ error: admin.error }, { status: admin.status })
    }

    const { id: profileId } = await context.params
    const supabase = createAdminClient()

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", profileId)
      .single()

    if (error || !profile) {
      return NextResponse.json({ error: "User not found", user: null }, { status: 404 })
    }

    // Match Prisma User by email for scripts, videos, training videos
    const prismaUser = await prisma.users.findUnique({
      where: { email: (profile as { email: string }).email },
      select: { id: true },
    })

    const [scripts, videosWithUrl, trainingVideos, activityRes] = await Promise.all([
      prismaUser
        ? prisma.scripts.findMany({
            where: { user_id: prismaUser.id },
            orderBy: { created_at: "desc" },
            select: {
              id: true,
              topic: true,
              platform: true,
              content_style: true,
              estimated_duration: true,
              script_text: true,
              status: true,
              generated_video_url: true,
              video_status: true,
              created_at: true,
            },
          })
        : [],
      prismaUser
        ? prisma.scripts.findMany({
            where: { user_id: prismaUser.id, generated_video_url: { not: null } },
            orderBy: { created_at: "desc" },
            select: {
              id: true,
              topic: true,
              platform: true,
              generated_video_url: true,
              created_at: true,
            },
          })
        : [],
      prismaUser
        ? [] // no trainingVideo model in schema; use [] until model exists
        : [],
      supabase
        .from("activity_logs")
        .select("*")
        .eq("user_id", profileId)
        .order("created_at", { ascending: false })
        .limit(100),
    ])

    const activities = activityRes.data ?? []

    return NextResponse.json({
      user: profile,
      scripts,
      videos: videosWithUrl,
      trainingVideos,
      activities,
    })
  } catch (error) {
    console.error("Admin user detail error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin()
    if (!admin.ok) {
      return NextResponse.json({ error: admin.error }, { status: admin.status })
    }

    const { id: userId } = await context.params
    const supabase = createAdminClient()
    const body = await request.json()

    // Normalize role to lowercase: DB expects "admin" | "user"
    const role =
      typeof body.role === "string"
        ? (body.role.toLowerCase() as "admin" | "user")
        : undefined
    const validRole =
      role === "admin" || role === "user" ? role : undefined

    const updatePayload = {
      full_name: body.full_name,
      email: body.email,
      credits: body.credits,
      plan: body.plan,
      ...(validRole !== undefined && { role: validRole }),
    }
    const { data: user, error } = await (supabase as any)
      .from("profiles")
      .update(updatePayload)
      .eq("id", userId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Admin user update error:', error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin()
    if (!admin.ok) {
      return NextResponse.json({ error: admin.error }, { status: admin.status })
    }

    const { id: userId } = await context.params
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin user delete error:', error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
