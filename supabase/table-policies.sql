-- ═══════════════════════════════════════════════════════════════
-- SUPABASE: What to use for your tables (User, Script, etc.)
-- ═══════════════════════════════════════════════════════════════
--
-- Your app uses Prisma + NextAuth. All DB access goes through your
-- Next.js server with DATABASE_URL (pooler). The frontend never
-- talks to these tables directly.
--
-- RECOMMENDATION: Keep these tables UNRESTRICTED.
--   - Security is enforced in your API (getServerSession, auth checks).
--   - Enabling RLS here can break Prisma unless you use a bypass.
--
-- Only enable RLS if you later use Supabase Client from the browser
-- (e.g. realtime or direct queries) and need per-user row access.
-- ═══════════════════════════════════════════════════════════════

-- Optional: If you want RLS on for “just in case”, use policies that
-- allow the backend (service role / your app) and restrict anon.
-- Uncomment and run only if you need this.

/*
-- Enable RLS on user-data tables (optional)
ALTER TABLE "User"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Script"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GeneratedVideo" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Avatar"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Video"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Activity"       ENABLE ROW LEVEL SECURITY;

-- Allow full access for service role (your app / migrations)
-- (Supabase service role bypasses RLS by default when using service key)
-- For connections using DATABASE_URL (pooler), ensure the DB user
-- has BYPASSRLS or add a policy that allows your app user.

-- Example: allow all for authenticated backend (if using Supabase Auth JWT)
-- CREATE POLICY "Allow service and backend" ON "User"
--   FOR ALL USING (true);
*/

-- Leave Account, Session, VerificationToken, Onboarding, Subscription,
-- TrainingVideo, Waitlist, profiles as UNRESTRICTED when using Prisma-only access.
