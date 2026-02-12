-- Run in Supabase SQL Editor if you manage schema manually.
-- Otherwise: npx prisma db push

ALTER TABLE "Subscription"
  ADD COLUMN IF NOT EXISTS "paymentMethodFingerprint" TEXT,
  ADD COLUMN IF NOT EXISTS "duplicatePaymentMethod" BOOLEAN NOT NULL DEFAULT false;
