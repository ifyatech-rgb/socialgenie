/**
 * Supabase Client Exports
 * 
 * Usage:
 * 
 * Client Components:
 * ```tsx
 * 'use client'
 * import { createClient } from '@/lib/supabase/client'
 * const supabase = createClient()
 * ```
 * 
 * Server Components / API Routes:
 * ```tsx
 * import { createClient } from '@/lib/supabase/server'
 * const supabase = createClient()
 * ```
 * 
 * Admin Operations (bypasses RLS):
 * ```tsx
 * import { createAdminClient } from '@/lib/supabase/server'
 * const supabase = createAdminClient()
 * ```
 */

// Re-export for convenience
export { createClient as createBrowserClient, getClient } from './client'
export { createClient as createServerClient, createAdminClient } from './server'
