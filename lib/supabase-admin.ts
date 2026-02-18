import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

/**
 * Supabase admin client using the service role key.
 * Bypasses Row Level Security; use only in secure server-side code (API routes, server actions, tracking).
 *
 * Usage:
 *   import { getSupabaseAdmin } from '@/lib/supabase-admin'
 *   const admin = getSupabaseAdmin()
 *   await admin.from('user_activity').insert({ ... })
 */
export function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

  if (!supabaseUrl || !serviceKey) {
    throw new Error(
      'Missing Supabase admin env: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY).'
    )
  }

  return createServerClient<Database>(supabaseUrl, serviceKey, {
    cookies: {
      get() {
        return undefined
      },
      set() {},
      remove() {},
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
