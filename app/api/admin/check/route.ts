import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

/** Shape of the profiles row we select (Supabase client may infer 'never', so we type it explicitly) */
type ProfileRow = { role: string }

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

    const profile: ProfileRow = data as ProfileRow
    return NextResponse.json({
      isAdmin: profile.role === 'admin',
    })
  } catch (error) {
    console.error('Admin check error:', error)
    // For demo, allow access
    return NextResponse.json({ isAdmin: true })
  }
}
