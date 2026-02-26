-- =============================================================================
-- SUPABASE SYNC – Run this in Supabase Dashboard → SQL Editor → New query
-- Run in order. Safe to run multiple times (uses IF NOT EXISTS / IF EXISTS).
-- =============================================================================

-- 1) Enable UUID extension (if not already)
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- 2) USERS table – add credits & app columns if missing
-- =============================================================================
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS credits integer DEFAULT 10;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS video_credits integer DEFAULT 10;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS video_credits_used integer DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS payment_status text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS genie_edits integer DEFAULT 25;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS custom_avatars_limit integer DEFAULT 1;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS custom_avatars_used integer DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_status text;

-- Backfill existing users
UPDATE public.users SET credits = 10 WHERE credits IS NULL;
UPDATE public.users SET video_credits = 10 WHERE video_credits IS NULL;
UPDATE public.users SET genie_edits = 25 WHERE genie_edits IS NULL;
UPDATE public.users SET custom_avatars_limit = 1 WHERE custom_avatars_limit IS NULL;
UPDATE public.users SET custom_avatars_used = 0 WHERE custom_avatars_used IS NULL;


-- 3) SCRIPTS table – add lifecycle & credit columns if missing
-- =============================================================================
ALTER TABLE public.scripts ADD COLUMN IF NOT EXISTS lifecycle_status text DEFAULT 'draft';
ALTER TABLE public.scripts ADD COLUMN IF NOT EXISTS credit_charged boolean DEFAULT false;

UPDATE public.scripts SET lifecycle_status = 'draft' WHERE lifecycle_status IS NULL;
UPDATE public.scripts SET credit_charged = false WHERE credit_charged IS NULL;


-- 4) Optional: set your own user to unlimited trial (replace email)
-- =============================================================================
-- UPDATE public.users
-- SET
--   credits = 10,
--   video_credits = 10,
--   payment_status = 'trialing',
--   plan = 'trial'
-- WHERE email = 'your@email.com';


-- 5) Verify sync (run as a separate query to check)
-- =============================================================================
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'users'
-- ORDER BY ordinal_position;
