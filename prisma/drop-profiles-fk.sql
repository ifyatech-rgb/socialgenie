-- Run this once in Supabase SQL Editor if Prisma reports:
-- "Cross schema references... public.profiles points to auth.users"
-- This removes the FK so Prisma can use only the "public" schema.
-- Your app still uses the profiles table via Supabase client; only the DB constraint is removed.

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

-- If it still fails, find the FK name in Supabase SQL Editor:
-- SELECT conname FROM pg_constraint WHERE conrelid = 'public.profiles'::regclass AND contype = 'f';
