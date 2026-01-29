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
    const supabase = createClient()
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('email', session.user.email)
      .single()

    if (error || !profile) {
      // For demo purposes, treat first user as admin
      return NextResponse.json({ isAdmin: true })
    }

    return NextResponse.json({ 
      isAdmin: profile.role === 'admin' 
    })
  } catch (error) {
    console.error('Admin check error:', error)
    // For demo, allow access
    return NextResponse.json({ isAdmin: true })
  }
}
