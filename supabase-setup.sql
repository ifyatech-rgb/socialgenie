-- ═══════════════════════════════════════════════════════════════
-- VIRALCLONE SUPABASE SETUP
-- Run this SQL in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ═══════════════════════════════════════════════════════════════

-- 1. Create profiles table (stores user data)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'creator', 'pro')),
  credits INTEGER DEFAULT 10,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'banned')),
  last_active_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create activity_logs table (tracks all user actions)
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create scripts table (stores generated scripts)
CREATE TABLE IF NOT EXISTS scripts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  topic TEXT NOT NULL,
  platform TEXT NOT NULL,
  tone TEXT NOT NULL,
  length INTEGER NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'generated',
  video_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create videos table (stores generated videos)
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  script_id UUID REFERENCES scripts(id) ON DELETE SET NULL,
  url TEXT,
  thumbnail_url TEXT,
  duration INTEGER,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create training_videos table (user uploaded face/voice videos)
CREATE TABLE IF NOT EXISTS training_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  duration INTEGER,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_scripts_user_id ON scripts(user_id);
CREATE INDEX IF NOT EXISTS idx_scripts_created_at ON scripts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);

-- 7. Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_videos ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies for profiles
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- Allow inserts (for signup)
CREATE POLICY "Enable insert for signup" ON profiles
  FOR INSERT WITH CHECK (true);

-- 9. RLS Policies for activity_logs
-- Admins can view all activity
CREATE POLICY "Admins can view all activity" ON activity_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.email = current_setting('request.jwt.claims', true)::json->>'email'
      AND profiles.role = 'admin'
    )
  );

-- Allow inserts for activity logging
CREATE POLICY "Enable insert for activity logging" ON activity_logs
  FOR INSERT WITH CHECK (true);

-- 10. RLS Policies for scripts
-- Users can view their own scripts
CREATE POLICY "Users can view own scripts" ON scripts
  FOR SELECT USING (true);

-- Users can insert their own scripts
CREATE POLICY "Users can insert scripts" ON scripts
  FOR INSERT WITH CHECK (true);

-- Users can update their own scripts
CREATE POLICY "Users can update own scripts" ON scripts
  FOR UPDATE USING (true);

-- Users can delete their own scripts
CREATE POLICY "Users can delete own scripts" ON scripts
  FOR DELETE USING (true);

-- 11. RLS Policies for videos
CREATE POLICY "Users can view own videos" ON videos
  FOR SELECT USING (true);

CREATE POLICY "Users can insert videos" ON videos
  FOR INSERT WITH CHECK (true);

-- 12. RLS Policies for training_videos
CREATE POLICY "Users can view own training videos" ON training_videos
  FOR SELECT USING (true);

CREATE POLICY "Users can insert training videos" ON training_videos
  FOR INSERT WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════
-- MAKE YOURSELF ADMIN
-- Replace 'your@email.com' with your actual email
-- ═══════════════════════════════════════════════════════════════

-- Run this AFTER you sign up:
-- UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';

-- ═══════════════════════════════════════════════════════════════
-- DONE! Your Supabase is now ready for ViralClone
-- ═══════════════════════════════════════════════════════════════
