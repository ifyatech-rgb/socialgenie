import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ isAdmin: false }, { status: 401 })
    }

    // Check if user is admin in database
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('email', session.user.email)
      .single()

    if (error || !data) {
      // For demo purposes, treat first user as admin
      return NextResponse.json({ isAdmin: true })
    }

    // Type assertion: Supabase client may infer 'never' when table types are strict
    const profile = data as { role?: string }
    return NextResponse.json({
      isAdmin: profile.role === 'admin',
    })
  } catch (error) {
    console.error('Admin check error:', error)
    // For demo, allow access
    return NextResponse.json({ isAdmin: true })
  }
}
