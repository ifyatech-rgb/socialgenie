/**
 * Centralized tracking for production monitoring.
 * All functions fail silently (try/catch); never throw.
 * Uses Supabase admin client to write to tracking tables (no RLS).
 */

import { getSupabaseAdmin } from '@/lib/supabase-admin'

type Json = Record<string, unknown> | unknown[]

function safeTrack<T>(fn: () => Promise<T>): Promise<T | null> {
  return fn().catch(() => null)
}

function hasSupabaseConfig(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY)
  )
}

/** Track user activity (login, signup, logout, etc.) */
export function trackUserActivity(
  userId: string,
  eventType: string,
  options?: {
    metadata?: Json
    ipAddress?: string | null
    userAgent?: string | null
  }
): Promise<unknown> {
  if (!hasSupabaseConfig()) return Promise.resolve(null)
  return safeTrack(async () => {
    const admin = getSupabaseAdmin()
    const { error } = await (admin as any)
      .from('user_activity')
      .insert({
        user_id: userId,
        event_type: eventType,
        metadata: options?.metadata ?? null,
        ip_address: options?.ipAddress ?? null,
        user_agent: options?.userAgent ?? null,
      })
    if (error) throw error
    return null
  })
}

/** Track video generation request / completion */
export function trackVideoGeneration(payload: {
    user_id: string
    script_id?: string | null
    video_id?: string | null
    provider?: string | null
    status: string
    credits_used?: number | null
    error_message?: string | null
    completed_at?: string | null
  }
): Promise<unknown> {
  if (!hasSupabaseConfig()) return Promise.resolve(null)
  return safeTrack(async () => {
    const admin = getSupabaseAdmin()
    const { error } = await (admin as any).from('video_tracking').insert(payload)
    if (error) throw error
    return null
  })
}

/** Track credits usage (deduction or grant) */
export function trackCreditsUsage(
  payload: {
    user_id: string
    amount: number
    reason: string
    reference_type?: string | null
    reference_id?: string | null
    balance_after?: number | null
  }
): Promise<unknown> {
  if (!hasSupabaseConfig()) return Promise.resolve(null)
  return safeTrack(async () => {
    const admin = getSupabaseAdmin()
    const { error } = await (admin as any).from('credits_log').insert(payload)
    if (error) throw error
    return null
  })
}

/** Track API call (endpoint, method, status, duration) */
export function trackApiCall(
  payload: {
    user_id?: string | null
    endpoint: string
    method: string
    status_code?: number | null
    duration_ms?: number | null
  }
): Promise<unknown> {
  if (!hasSupabaseConfig()) return Promise.resolve(null)
  return safeTrack(async () => {
    const admin = getSupabaseAdmin()
    const { error } = await (admin as any)
      .from('api_calls_tracking')
      .insert(payload)
    if (error) throw error
    return null
  })
}

/** Log an error to error_logs */
export function trackError(
  payload: {
    user_id?: string | null
    endpoint?: string | null
    error_message: string
    error_stack?: string | null
    status_code?: number | null
    metadata?: Json
  }
): Promise<unknown> {
  if (!hasSupabaseConfig()) return Promise.resolve(null)
  return safeTrack(async () => {
    const admin = getSupabaseAdmin()
    const { error } = await (admin as any).from('error_log').insert(payload)
    if (error) throw error
    return null
  })
}

/** Track subscription event (plan change, trial, cancel) */
export function trackSubscriptionEvent(
  payload: {
    user_id: string
    event_type: string
    plan?: string | null
    stripe_event_id?: string | null
    metadata?: Json
  }
): Promise<unknown> {
  if (!hasSupabaseConfig()) return Promise.resolve(null)
  return safeTrack(async () => {
    const admin = getSupabaseAdmin()
    const { error } = await (admin as any)
      .from('subscription_events')
      .insert(payload)
    if (error) throw error
    return null
  })
}

/** Track page view (optional, for analytics) */
export function trackPageView(
  payload: {
    user_id?: string | null
    path: string
    referrer?: string | null
  }
): Promise<unknown> {
  if (!hasSupabaseConfig()) return Promise.resolve(null)
  return safeTrack(async () => {
    const admin = getSupabaseAdmin()
    const { error } = await (admin as any).from('page_views').insert(payload)
    if (error) throw error
    return null
  })
}

/** Upsert or increment daily stats (for cron/aggregation) */
export function trackDailyStats(
  payload: {
    stat_date: string
    active_users?: number
    videos_generated?: number
    credits_used?: number
    new_signups?: number
    metadata?: Json
  }
): Promise<unknown> {
  if (!hasSupabaseConfig()) return Promise.resolve(null)
  return safeTrack(async () => {
    const admin = getSupabaseAdmin()
    const { error } = await (admin as any)
      .from('daily_stats')
      .upsert(payload, {
        onConflict: 'stat_date',
        ignoreDuplicates: false,
      })
    if (error) throw error
    return null
  })
}

/** Track feature usage (e.g. script_generated, avatar_created) */
export function trackFeatureUsage(
  payload: {
    user_id: string
    feature_name: string
    count?: number
    metadata?: Json
  }
): Promise<unknown> {
  if (!hasSupabaseConfig()) return Promise.resolve(null)
  return safeTrack(async () => {
    const admin = getSupabaseAdmin()
    const { error } = await (admin as any)
      .from('feature_usage')
      .insert({
        ...payload,
        count: payload.count ?? 1,
      })
    if (error) throw error
    return null
  })
}

/** Track avatar creation or usage */
export function trackAvatarEvent(
  payload: {
    user_id: string
    event_type: string
    avatar_id?: string | null
    provider?: string | null
    status?: string | null
    error_message?: string | null
  }
): Promise<unknown> {
  if (!hasSupabaseConfig()) return Promise.resolve(null)
  return safeTrack(async () => {
    const admin = getSupabaseAdmin()
    const { error } = await (admin as any).from('avatar_tracking').insert(payload)
    if (error) throw error
    return null
  })
}

/** Extract IP and User-Agent from Request (for activity/error logging) */
export function getRequestMeta(request?: Request | null): {
  ipAddress: string | null
  userAgent: string | null
} {
  if (!request) return { ipAddress: null, userAgent: null }
  const ipAddress =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    null
  const userAgent = request.headers.get('user-agent') || null
  return { ipAddress, userAgent }
}
