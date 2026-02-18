-- Run this in Supabase SQL Editor once to create the Waitlist table.
-- Required for /api/waitlist (landing page email signup).

CREATE TABLE IF NOT EXISTS "public"."Waitlist" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "email" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Waitlist_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Waitlist_email_key" ON "public"."Waitlist"("email");
CREATE INDEX IF NOT EXISTS "Waitlist_email_idx" ON "public"."Waitlist"("email");
