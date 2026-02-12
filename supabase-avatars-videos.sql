-- Run this in Supabase SQL Editor to create avatars and videos tables with RLS.
-- Requires auth.users (Supabase Auth). If you use a separate "scripts" table in Supabase, add the FK for script_id.

-- Avatars table
CREATE TABLE IF NOT EXISTS avatars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  did_actor_id TEXT NOT NULL,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'failed')),
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Videos table (script_id optional if scripts table does not exist in Supabase)
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  script_id UUID,
  did_clip_id TEXT,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  title TEXT,
  script_text TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  duration INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_avatars_user_id ON avatars(user_id);
CREATE INDEX IF NOT EXISTS idx_avatars_status ON avatars(status);
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);

-- Row Level Security
ALTER TABLE avatars ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Policies for avatars
DROP POLICY IF EXISTS "Users can view their own avatars" ON avatars;
CREATE POLICY "Users can view their own avatars"
  ON avatars FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own avatars" ON avatars;
CREATE POLICY "Users can create their own avatars"
  ON avatars FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own avatars" ON avatars;
CREATE POLICY "Users can update their own avatars"
  ON avatars FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies for videos
DROP POLICY IF EXISTS "Users can view their own videos" ON videos;
CREATE POLICY "Users can view their own videos"
  ON videos FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own videos" ON videos;
CREATE POLICY "Users can create their own videos"
  ON videos FOR INSERT
  WITH CHECK (auth.uid() = user_id);
