import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

/**
 * Creates a Supabase client for use in client components.
 * This client is configured for browser-side usage with cookie-based auth.
 * 
 * @returns A typed Supabase client instance
 * 
 * @example
 * ```tsx
 * 'use client'
 * import { createClient } from '@/lib/supabase/client'
 * 
 * export default function MyComponent() {
 *   const supabase = createClient()
 *   // Use supabase client...
 * }
 * ```
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file.'
    )
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}

// Export a singleton instance for convenience
let clientInstance: ReturnType<typeof createClient> | null = null

/**
 * Gets a singleton Supabase client instance.
 * Useful when you want to reuse the same client across multiple calls.
 * 
 * @returns A typed Supabase client instance (singleton)
 */
export function getClient() {
  if (!clientInstance) {
    clientInstance = createClient()
  }
  return clientInstance
}
