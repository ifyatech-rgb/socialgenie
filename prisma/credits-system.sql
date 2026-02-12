-- ═══════════════════════════════════════════════════════════
-- CREDITS SYSTEM (Optional Supabase / Profile sync)
-- ═══════════════════════════════════════════════════════════
-- The app uses Prisma User.credits for deduction (see app/api/scripts/generate/route.ts).
-- Normal script = 1 credit, Research-enabled script = 3 credits.
-- Run this in Supabase SQL Editor only if you use Supabase profiles and want:
--   - credits column on profiles (for dashboard/sidebar sync)
--   - credits_usage table for usage logging/analytics
-- ═══════════════════════════════════════════════════════════

-- Ensure profiles have credits (for dashboard display when synced)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 10;

UPDATE profiles SET credits = 10 WHERE credits IS NULL;

-- Optional: credits_usage table for tracking (analytics only; deduction stays in Prisma)
CREATE TABLE IF NOT EXISTS credits_usage (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,  -- Prisma User id (cuid) or auth.users id if using Supabase Auth
  credits_used INTEGER NOT NULL,
  script_type VARCHAR(50) NOT NULL,  -- 'normal' (1) or 'research' (3)
  topic TEXT,
  platform VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credits_usage_user_id ON credits_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_credits_usage_created_at ON credits_usage(created_at);

-- Optional: Safe deduct for Supabase-backed users (if you ever move credits to Supabase)
-- CREATE OR REPLACE FUNCTION deduct_credits(p_user_id UUID, p_credits INTEGER)
-- RETURNS BOOLEAN AS $$
-- DECLARE current_credits INTEGER;
-- BEGIN
--   SELECT credits INTO current_credits FROM profiles WHERE id = p_user_id;
--   IF current_credits IS NULL OR current_credits < p_credits THEN RETURN FALSE; END IF;
--   UPDATE profiles SET credits = credits - p_credits WHERE id = p_user_id;
--   RETURN TRUE;
-- END;
-- $$ LANGUAGE plpgsql;
