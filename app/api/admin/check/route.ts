import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ isAdmin: false }, { status: 401 })
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('email', session.user.email)
      .single()

    if (error || !data) {
      return NextResponse.json({ isAdmin: false })
    }

    const role = (data as Record<string, unknown>).role as string | undefined
    return NextResponse.json({ isAdmin: role === 'admin' })
  } catch (error) {
    console.error('Admin check error:', error)
    return NextResponse.json({ isAdmin: false })
  }
}
