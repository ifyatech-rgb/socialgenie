-- Drop views and function that may depend on tables Prisma wants to change/drop.
-- Run once in Supabase SQL Editor or: psql "$DIRECT_DATABASE_URL" -f scripts/drop-views-for-db-push.sql
-- Then run: npx prisma db push

-- Drop all views first
DROP VIEW IF EXISTS active_users CASCADE;
DROP VIEW IF EXISTS today_stats CASCADE;
DROP VIEW IF EXISTS videos_today CASCADE;

-- Drop function
DROP FUNCTION IF EXISTS calculate_user_profitability(UUID) CASCADE;
