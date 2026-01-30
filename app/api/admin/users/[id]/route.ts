import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()
    const userId = params.id

    const { data: user, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('User fetch error:', error)
      // Return demo user
      return NextResponse.json({
        user: {
          id: userId,
          full_name: 'Demo User',
          email: 'demo@example.com',
          created_at: new Date().toISOString(),
          last_active_at: new Date().toISOString(),
          credits: 50,
          plan: 'creator',
          role: 'user',
          avatar_url: null
        }
      })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Admin user detail error:', error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()
    const userId = params.id
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()
    const userId = params.id

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
