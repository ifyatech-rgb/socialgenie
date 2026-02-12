-- Run this in Supabase SQL Editor to add Stripe columns to Subscription table.
-- Fixes: "The column Subscription.stripeCustomerId does not exist in the current database"

ALTER TABLE "Subscription"
  ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT,
  ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" TEXT,
  ADD COLUMN IF NOT EXISTS "trialEndsAt" TIMESTAMP(3);
