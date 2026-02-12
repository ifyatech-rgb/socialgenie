import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/server"

/**
 * Verifies the current session user is an admin (profiles.role === 'admin').
 * Use in admin API routes. Returns { ok: true } or { ok: false, status, error }.
 */
export async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return { ok: false as const, status: 401, error: "Unauthorized" }
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("email", session.user.email)
    .single()

  if (error || !data) {
    return { ok: false as const, status: 403, error: "Forbidden" }
  }

  const role = (data as { role?: string }).role
  if (role !== "admin") {
    return { ok: false as const, status: 403, error: "Admin only" }
  }

  return { ok: true as const }
}
