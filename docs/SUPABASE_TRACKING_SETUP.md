# Supabase Database & Tracking Setup

This doc summarizes the Supabase migration, integration files, and tracking wiring.

## Task 1: Migration

**File:** `supabase/migrations/001_complete_setup.sql`

- Adds missing columns to `profiles` (e.g. `status`, `updated_at`).
- Creates tracking tables (no RLS): `user_activity`, `video_tracking`, `credits_usage`, `api_calls_tracking`, `error_logs`, `subscription_events`, `page_views`, `daily_stats`, `feature_usage`, `avatar_tracking`.
- Ensures existing tables exist with indexes: `profiles`, `activity_logs`, `scripts`, `videos`, `training_videos`.
- Enables RLS on user-data tables (`profiles`, `scripts`, `videos`, `training_videos`, `activity_logs`) with policies; tracking tables are left without RLS (backend-only via service role).

**Apply the migration:**

1. Supabase Dashboard → SQL Editor → paste contents of `supabase/migrations/001_complete_setup.sql` → Run.
2. Or with Supabase CLI: `supabase db push` (from project root).

## Task 2: Integration Files

| File | Purpose |
|------|--------|
| `lib/supabase-admin.ts` | Admin client via `getSupabaseAdmin()` using service role key. Use for backend and tracking. |
| `lib/supabase-client.ts` | Re-exports `createSupabaseClient` / `getClient` from `lib/supabase/client.ts` for frontend. |
| `lib/tracking.ts` | All tracking helpers (user activity, video, credits, API calls, errors, subscription events, page views, daily stats, feature usage, avatar). All fail silently and no-op when Supabase env is missing. |

## Task 3: Where Tracking Is Wired

| Area | Where | Tables |
|------|--------|--------|
| Login / signup | `lib/auth.ts` (after syncUserToSupabase) | `user_activity` |
| Video creation | `app/api/videos/generate/route.ts`, `app/api/scripts/[id]/generate-video/route.ts`, `app/api/heygen/generate/route.ts` | `video_tracking`, `credits_usage` |
| Avatar creation | `app/api/heygen/create-avatar/route.ts` | `avatar_tracking`; errors → `error_logs` |
| Credit usage | Script generate, video generate, HeyGen generate, Stripe webhook | `credits_usage` |
| Subscription | `app/api/webhooks/stripe/route.ts` (checkout + invoice) | `credits_usage`, `subscription_events` |
| Script generation | `app/api/scripts/generate/route.ts` | `credits_usage`, `feature_usage` |
| API errors | `app/api/videos/generate/route.ts`, `app/api/scripts/[id]/generate-video/route.ts`, `app/api/heygen/create-avatar/route.ts` | `error_logs` |

## Task 4: Environment Variables

### Local (`.env`)

Ensure these are set (see `.env.example`):

```env
# Supabase (required for tracking and existing Supabase features)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

Optional alternative name for service key: `SUPABASE_SERVICE_KEY` (used by `lib/supabase-admin.ts` and `lib/supabase/server.ts`).

### Vercel (Production)

In Vercel → Project → Settings → Environment Variables, add (for Production / Preview / Development as needed):

| Name | Value | Notes |
|------|--------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<project-ref>.supabase.co` | From Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (anon/public key) | From Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | (service_role key) | From same page; **keep secret** |

If you use `SUPABASE_SERVICE_KEY` elsewhere, add that too with the same value.

## What To Do Next

1. **Run the migration** in your Supabase project (SQL Editor or `supabase db push`).
2. **Set env vars** locally and in Vercel as above.
3. **Regenerate Supabase types** (optional):  
   `npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/supabase.ts`  
   so `types/supabase.ts` includes the new tracking tables for stricter typing.
4. **Deploy** and verify: sign in, generate a script, generate a video, trigger Stripe webhook (test mode) and confirm rows in `user_activity`, `credits_usage`, `video_tracking`, `subscription_events`, and `error_logs` as expected.

Tracking never throws; if Supabase env is missing, all tracking calls no-op.
