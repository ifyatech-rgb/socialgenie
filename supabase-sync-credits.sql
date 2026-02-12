-- Run in Supabase SQL Editor to sync credits.
-- Use this so dashboard/sidebar show the correct credits (e.g. 9).

-- 1) Supabase profiles table (used by admin; credits synced to dashboard if row exists)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 10;

UPDATE profiles
SET credits = 10
WHERE credits IS NULL;

-- Set your user to 9 credits (match your email)
UPDATE profiles
SET credits = 9
WHERE email = 'parthkhanna8282@gmail.com';

-- If you use a separate public.users table (Supabase), uncomment:
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 10;
-- UPDATE users SET credits = 10 WHERE credits IS NULL;
-- UPDATE users SET credits = 9 WHERE email = 'parthkhanna8282@gmail.com';

-- 2) Prisma "User" table (main app auth; same DB as Supabase)
-- Ensures Prisma users have credits; update email to match your account
UPDATE "User"
SET credits = 9
WHERE email = 'parthkhanna8282@gmail.com';

-- Give 10 credits to any user with NULL/0 credits
UPDATE "User"
SET credits = 10
WHERE credits IS NULL OR credits < 1;
