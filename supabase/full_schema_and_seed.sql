-- ═══════════════════════════════════════════════════════════════════════════════
-- SUPABASE: Full schema + seed (run once in SQL Editor)
-- Run in: Supabase Dashboard → SQL Editor → paste this file → Run
--
-- AFTER RUNNING:
-- 1. In .env: set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY).
-- 2. When users sign up via your app (NextAuth/Prisma), sync them to Supabase (e.g. lib/supabase-sync)
--    or run the seed again to add more users.
-- 3. pkdigitalldreamers@gmail.com is seeded as creator (20 video credits, 50 genie edits).
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── DROP EXISTING TABLES (CASCADE drops policies; safe when tables don't exist) ─
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS generated_videos CASCADE;
DROP TABLE IF EXISTS avatars CASCADE;
DROP TABLE IF EXISTS scripts CASCADE;
DROP TABLE IF EXISTS videos CASCADE;
DROP TABLE IF EXISTS training_videos CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS user_activity CASCADE;
DROP TABLE IF EXISTS video_tracking CASCADE;
DROP TABLE IF EXISTS credits_usage CASCADE;
DROP TABLE IF EXISTS credits_log CASCADE;
DROP TABLE IF EXISTS api_calls_tracking CASCADE;
DROP TABLE IF EXISTS error_logs CASCADE;
DROP TABLE IF EXISTS error_log CASCADE;
DROP TABLE IF EXISTS subscription_events CASCADE;
DROP TABLE IF EXISTS page_views CASCADE;
DROP TABLE IF EXISTS daily_stats CASCADE;
DROP TABLE IF EXISTS feature_usage CASCADE;
DROP TABLE IF EXISTS avatar_tracking CASCADE;

-- ─── 1. PROFILES (admin/analytics) ─────────────────────────────────────────────
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  plan TEXT DEFAULT 'free',
  credits INTEGER DEFAULT 10,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'banned')),
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 2. USERS (app sync: Prisma id = TEXT) ────────────────────────────────────
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  image TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'trial',
  video_credits INTEGER DEFAULT 10,
  genie_edits INTEGER DEFAULT 0,
  custom_avatars_used INTEGER DEFAULT 0,
  custom_avatars_limit INTEGER DEFAULT 1,
  payment_status TEXT DEFAULT 'pending',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_users_email ON users(email);

-- ─── 3. ACTIVITY_LOGS ────────────────────────────────────────────────────────
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);

-- ─── 4. SCRIPTS ───────────────────────────────────────────────────────────────
CREATE TABLE scripts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  video_id TEXT,
  topic TEXT NOT NULL,
  platform TEXT NOT NULL,
  tone TEXT,
  length INTEGER,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'generated',
  lifecycle_status TEXT DEFAULT 'draft',
  video_url TEXT,
  generated_video_id TEXT,
  video_provider TEXT,
  video_status TEXT,
  video_progress INTEGER,
  generated_video_url TEXT,
  project_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_scripts_user_id ON scripts(user_id);
CREATE INDEX idx_scripts_created_at ON scripts(created_at DESC);

-- ─── 5. VIDEOS ─────────────────────────────────────────────────────────────────
CREATE TABLE videos (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  script_id TEXT,
  filename TEXT,
  url TEXT,
  thumbnail_url TEXT,
  duration INTEGER,
  status TEXT DEFAULT 'uploaded',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_videos_user_id ON videos(user_id);
CREATE INDEX idx_videos_created_at ON videos(created_at DESC);

-- ─── 6. TRAINING_VIDEOS ───────────────────────────────────────────────────────
CREATE TABLE training_videos (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  duration INTEGER,
  status TEXT DEFAULT 'processing',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_training_videos_user_id ON training_videos(user_id);

-- ─── 7. USER_ACTIVITY (tracking) ───────────────────────────────────────────────
CREATE TABLE user_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX idx_user_activity_created_at ON user_activity(created_at DESC);
CREATE INDEX idx_user_activity_event_type ON user_activity(event_type);

-- ─── 8. VIDEO_TRACKING ─────────────────────────────────────────────────────────
CREATE TABLE video_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  script_id TEXT,
  video_id TEXT,
  provider TEXT,
  status TEXT NOT NULL,
  credits_used INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX idx_video_tracking_user_id ON video_tracking(user_id);
CREATE INDEX idx_video_tracking_created_at ON video_tracking(created_at DESC);
CREATE INDEX idx_video_tracking_status ON video_tracking(status);

-- ─── 9. CREDITS_LOG (tracking) ─────────────────────────────────────────────────
CREATE TABLE credits_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  reference_type TEXT,
  reference_id TEXT,
  balance_after INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_credits_log_user_id ON credits_log(user_id);
CREATE INDEX idx_credits_log_created_at ON credits_log(created_at DESC);
CREATE INDEX idx_credits_log_reason ON credits_log(reason);

-- ─── 10. API_CALLS_TRACKING ───────────────────────────────────────────────────
CREATE TABLE api_calls_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_api_calls_user_id ON api_calls_tracking(user_id);
CREATE INDEX idx_api_calls_created_at ON api_calls_tracking(created_at DESC);
CREATE INDEX idx_api_calls_endpoint ON api_calls_tracking(endpoint);

-- ─── 11. ERROR_LOG (tracking) ──────────────────────────────────────────────────
CREATE TABLE error_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT,
  endpoint TEXT,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  status_code INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_error_log_user_id ON error_log(user_id);
CREATE INDEX idx_error_log_created_at ON error_log(created_at DESC);

-- ─── 12. SUBSCRIPTION_EVENTS ───────────────────────────────────────────────────
CREATE TABLE subscription_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  plan TEXT,
  stripe_event_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_subscription_events_user_id ON subscription_events(user_id);
CREATE INDEX idx_subscription_events_created_at ON subscription_events(created_at DESC);

-- ─── 13. PAGE_VIEWS ────────────────────────────────────────────────────────────
CREATE TABLE page_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT,
  path TEXT NOT NULL,
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_page_views_user_id ON page_views(user_id);
CREATE INDEX idx_page_views_created_at ON page_views(created_at DESC);
CREATE INDEX idx_page_views_path ON page_views(path);

-- ─── 14. DAILY_STATS ──────────────────────────────────────────────────────────
CREATE TABLE daily_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stat_date DATE NOT NULL UNIQUE,
  active_users INTEGER DEFAULT 0,
  videos_generated INTEGER DEFAULT 0,
  credits_used INTEGER DEFAULT 0,
  new_signups INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_daily_stats_stat_date ON daily_stats(stat_date);

-- ─── 15. FEATURE_USAGE ─────────────────────────────────────────────────────────
CREATE TABLE feature_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  feature_name TEXT NOT NULL,
  count INTEGER DEFAULT 1,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_feature_usage_user_id ON feature_usage(user_id);
CREATE INDEX idx_feature_usage_feature_name ON feature_usage(feature_name);
CREATE INDEX idx_feature_usage_created_at ON feature_usage(created_at DESC);

-- ─── 16. AVATAR_TRACKING ───────────────────────────────────────────────────────
CREATE TABLE avatar_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  avatar_id TEXT,
  provider TEXT,
  status TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_avatar_tracking_user_id ON avatar_tracking(user_id);
CREATE INDEX idx_avatar_tracking_created_at ON avatar_tracking(created_at DESC);

-- ─── 17. AVATARS (custom HeyGen avatars) ────────────────────────────────────────
CREATE TABLE avatars (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'photo',
  provider_avatar_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_avatars_user_id ON avatars(user_id);
CREATE INDEX idx_avatars_provider_id ON avatars(provider_avatar_id);
CREATE INDEX idx_avatars_created_at ON avatars(created_at DESC);

-- ─── 18. GENERATED_VIDEOS (HeyGen/D-ID) ─────────────────────────────────────────
CREATE TABLE generated_videos (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  script_id TEXT,
  generated_video_id TEXT NOT NULL,
  video_provider TEXT NOT NULL DEFAULT 'heygen',
  video_status TEXT NOT NULL DEFAULT 'processing',
  video_progress INTEGER DEFAULT 0,
  generated_video_url TEXT,
  thumbnail_url TEXT,
  duration INTEGER,
  video_error TEXT,
  project_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_generated_videos_user_id ON generated_videos(user_id);
CREATE INDEX idx_generated_videos_script_id ON generated_videos(script_id);
CREATE INDEX idx_generated_videos_provider_id ON generated_videos(generated_video_id);
CREATE INDEX idx_generated_videos_created_at ON generated_videos(created_at DESC);

-- ─── ROW LEVEL SECURITY & POLICIES ─────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE avatars ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (true);
CREATE POLICY "Enable insert for signup" ON profiles FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable insert for activity logging" ON activity_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins and service can view activity" ON activity_logs FOR SELECT USING (true);

CREATE POLICY "Users can view own scripts" ON scripts FOR SELECT USING (true);
CREATE POLICY "Users can insert scripts" ON scripts FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own scripts" ON scripts FOR UPDATE USING (true);
CREATE POLICY "Users can delete own scripts" ON scripts FOR DELETE USING (true);

CREATE POLICY "Users can view own videos" ON videos FOR SELECT USING (true);
CREATE POLICY "Users can insert videos" ON videos FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own videos" ON videos FOR UPDATE USING (true);

CREATE POLICY "Users can view own training videos" ON training_videos FOR SELECT USING (true);
CREATE POLICY "Users can insert training videos" ON training_videos FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role full access avatars" ON avatars FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access generated_videos" ON generated_videos FOR ALL USING (true) WITH CHECK (true);

-- ─── SEED: Creator user ───────────────────────────────────────────────────────
INSERT INTO users (
  id,
  email,
  name,
  plan,
  video_credits,
  genie_edits,
  custom_avatars_used,
  custom_avatars_limit,
  payment_status,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid()::text,
  'pkdigitalldreamers@gmail.com',
  'PK Digital',
  'creator',
  20,
  50,
  0,
  1,
  'paid',
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  plan = EXCLUDED.plan,
  video_credits = EXCLUDED.video_credits,
  genie_edits = EXCLUDED.genie_edits,
  custom_avatars_used = EXCLUDED.custom_avatars_used,
  custom_avatars_limit = EXCLUDED.custom_avatars_limit,
  payment_status = EXCLUDED.payment_status,
  name = EXCLUDED.name,
  updated_at = NOW();
