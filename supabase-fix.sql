-- ═══════════════════════════════════════════════════════════════
-- VIRALCLONE SUPABASE SETUP - SAFE VERSION
-- ═══════════════════════════════════════════════════════════════

-- Step 1: Create all tables first
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  plan TEXT DEFAULT 'free',
  credits INTEGER DEFAULT 10,
  status TEXT DEFAULT 'active',
  last_active_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  script_id UUID REFERENCES scripts(id) ON DELETE SET NULL,
  url TEXT,
  thumbnail_url TEXT,
  duration INTEGER,
  status TEXT DEFAULT 'processing',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  duration INTEGER,
  status TEXT DEFAULT 'processing',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scripts_user_id ON scripts(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);

-- Step 3: Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_videos ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop existing policies (now tables exist)
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

-- Step 5: Create fresh policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (true);
CREATE POLICY "Enable insert for signup" ON profiles FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all activity" ON activity_logs FOR SELECT USING (true);
CREATE POLICY "Enable insert for activity logging" ON activity_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own scripts" ON scripts FOR SELECT USING (true);
CREATE POLICY "Users can insert scripts" ON scripts FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own scripts" ON scripts FOR UPDATE USING (true);
CREATE POLICY "Users can delete own scripts" ON scripts FOR DELETE USING (true);

CREATE POLICY "Users can view own videos" ON videos FOR SELECT USING (true);
CREATE POLICY "Users can insert videos" ON videos FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own training videos" ON training_videos FOR SELECT USING (true);
CREATE POLICY "Users can insert training videos" ON training_videos FOR INSERT WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════
-- DONE! All tables and policies created.
-- ═══════════════════════════════════════════════════════════════
