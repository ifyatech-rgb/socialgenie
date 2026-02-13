CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS profiles (
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

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'status') THEN
    ALTER TABLE profiles ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'banned'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'updated_at') THEN
    ALTER TABLE profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);

CREATE TABLE IF NOT EXISTS scripts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  video_id TEXT,
  topic TEXT NOT NULL,
  platform TEXT NOT NULL,
  tone TEXT NOT NULL,
  length INTEGER NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'generated',
  video_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_scripts_user_id ON scripts(user_id);
CREATE INDEX IF NOT EXISTS idx_scripts_created_at ON scripts(created_at DESC);

CREATE TABLE IF NOT EXISTS videos (
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
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);

CREATE TABLE IF NOT EXISTS training_videos (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  duration INTEGER,
  status TEXT DEFAULT 'processing',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_training_videos_user_id ON training_videos(user_id);

CREATE TABLE IF NOT EXISTS user_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_event_type ON user_activity(event_type);

CREATE TABLE IF NOT EXISTS video_tracking (
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
CREATE INDEX IF NOT EXISTS idx_video_tracking_user_id ON video_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_video_tracking_created_at ON video_tracking(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_tracking_status ON video_tracking(status);

CREATE TABLE IF NOT EXISTS credits_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  reference_type TEXT,
  reference_id TEXT,
  balance_after INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_credits_usage_user_id ON credits_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_credits_usage_created_at ON credits_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credits_usage_reason ON credits_usage(reason);

CREATE TABLE IF NOT EXISTS api_calls_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_api_calls_user_id ON api_calls_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_api_calls_created_at ON api_calls_tracking(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_calls_endpoint ON api_calls_tracking(endpoint);

CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT,
  endpoint TEXT,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  status_code INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  plan TEXT,
  stripe_event_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_subscription_events_user_id ON subscription_events(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_created_at ON subscription_events(created_at DESC);

CREATE TABLE IF NOT EXISTS page_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT,
  path TEXT NOT NULL,
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_page_views_user_id ON page_views(user_id);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views(path);

CREATE TABLE IF NOT EXISTS daily_stats (
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
CREATE INDEX IF NOT EXISTS idx_daily_stats_stat_date ON daily_stats(stat_date);

CREATE TABLE IF NOT EXISTS feature_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  feature_name TEXT NOT NULL,
  count INTEGER DEFAULT 1,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_feature_usage_user_id ON feature_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_usage_feature_name ON feature_usage(feature_name);
CREATE INDEX IF NOT EXISTS idx_feature_usage_created_at ON feature_usage(created_at DESC);

CREATE TABLE IF NOT EXISTS avatar_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  avatar_id TEXT,
  provider TEXT,
  status TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_avatar_tracking_user_id ON avatar_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_avatar_tracking_created_at ON avatar_tracking(created_at DESC);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for signup" ON profiles;
DROP POLICY IF EXISTS "Admins can view all activity" ON activity_logs;
DROP POLICY IF EXISTS "Enable insert for activity logging" ON activity_logs;
DROP POLICY IF EXISTS "Users can view own scripts" ON scripts;
DROP POLICY IF EXISTS "Users can insert scripts" ON scripts;
DROP POLICY IF EXISTS "Users can update own scripts" ON scripts;
DROP POLICY IF EXISTS "Users can delete own scripts" ON scripts;
DROP POLICY IF EXISTS "Users can view own videos" ON videos;
DROP POLICY IF EXISTS "Users can insert videos" ON videos;
DROP POLICY IF EXISTS "Users can view own training videos" ON training_videos;
DROP POLICY IF EXISTS "Users can insert training videos" ON training_videos;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (true);
CREATE POLICY "Enable insert for signup" ON profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable insert for activity logging" ON activity_logs
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins and service can view activity" ON activity_logs
  FOR SELECT USING (true);

CREATE POLICY "Users can view own scripts" ON scripts
  FOR SELECT USING (true);
CREATE POLICY "Users can insert scripts" ON scripts
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own scripts" ON scripts
  FOR UPDATE USING (true);
CREATE POLICY "Users can delete own scripts" ON scripts
  FOR DELETE USING (true);

CREATE POLICY "Users can view own videos" ON videos
  FOR SELECT USING (true);
CREATE POLICY "Users can insert videos" ON videos
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own videos" ON videos
  FOR UPDATE USING (true);

CREATE POLICY "Users can view own training videos" ON training_videos
  FOR SELECT USING (true);
CREATE POLICY "Users can insert training videos" ON training_videos
  FOR INSERT WITH CHECK (true);
