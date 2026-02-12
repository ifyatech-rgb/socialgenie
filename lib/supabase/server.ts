import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'

/**
 * Creates a Supabase client for use in server components and API routes.
 * This client handles cookie-based auth with proper server-side cookie management.
 * 
 * @returns A typed Supabase client instance for server-side usage
 * 
 * @example
 * ```tsx
 * // In a Server Component
 * import { createClient } from '@/lib/supabase/server'
 * 
 * export default async function ServerComponent() {
 *   const supabase = createClient()
 *   const { data } = await supabase.from('users').select()
 *   // ...
 * }
 * ```
 */
export async function createClient() {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file.'
    )
  }

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
          // The `set` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch (error) {
          // The `delete` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  })
}

/**
 * Creates a Supabase admin client with service role key.
 * Use this only in secure server-side contexts (API routes, server actions).
 * WARNING: This bypasses Row Level Security!
 * 
 * @returns A Supabase client with admin privileges
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing Supabase admin environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY or SUPABASE_SERVICE_ROLE_KEY in your .env file.'
    )
  }

  return createServerClient<Database>(supabaseUrl, supabaseServiceKey, {
    cookies: {
      get() { return undefined },
      set() {},
      remove() {},
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
