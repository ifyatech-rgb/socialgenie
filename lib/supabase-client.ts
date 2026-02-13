/**
 * Regular Supabase client for frontend / browser use.
 * Respects Row Level Security and uses the anon key.
 *
 * Usage:
 *   'use client'
 *   import { createSupabaseClient } from '@/lib/supabase-client'
 *   const supabase = createSupabaseClient()
 */
export { createClient as createSupabaseClient, getClient } from '@/lib/supabase/client'
