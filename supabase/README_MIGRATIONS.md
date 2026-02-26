# Supabase migrations – full UGC, avatars, scripts, tracking

Run migrations in order in the **Supabase Dashboard → SQL Editor** (or via `supabase db push` if using CLI):

1. **001_complete_setup_raw.sql** – profiles, activity_logs, scripts, videos, training_videos, tracking tables (user_activity, video_tracking, credits_usage, api_calls_tracking, error_logs, subscription_events, page_views, daily_stats, feature_usage, avatar_tracking), RLS policies.
2. **002_tracking_tables.sql** – `users` table, `credits_log`, `error_log`.
3. **003_users_payment_columns.sql** – payment columns on `users`.
4. **004_full_ugc_avatars_scripts.sql** – extends `users` (plan, video_credits, genie_edits, custom_avatars_*), extends `scripts` (lifecycle_status, generated_video_*, video_provider, etc.), creates `avatars` and `generated_videos`, RLS for new tables.

After running these, the app will sync to Supabase:

- **Users** – sign-in/sign-up, PATCH /api/user, create-avatar (custom avatars count).
- **Scripts** – POST /api/scripts/generate, heygen/generate (legacy script path), projects (legacy script status updates), scripts/[id]/generate-video.
- **Avatars** – POST /api/heygen/create-avatar.
- **Videos** – POST /api/videos/upload.
- **Generated videos** – POST /api/heygen/generate, GET /api/projects (status updates).
- **Activity** – script generation activity to `activity_logs`.

Tracking (already in 001/002): `user_activity`, `video_tracking`, `credits_log`, `error_log`, `feature_usage`, `avatar_tracking`, etc. are written by `lib/tracking.ts`.
